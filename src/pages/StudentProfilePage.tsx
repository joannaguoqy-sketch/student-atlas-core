import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { exportStudentProfile } from "@/lib/exportHelpers";
import {
  calcFormativeTotal, calcFinalExamTotal, calcFinalWeighted, calcFinalTotal, getScoreClass,
} from "@/types";
import type { FormativeScore, FinalExam } from "@/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

interface GrowthLogRow {
  id: string;
  record_date: string;
  content: string;
  type_name: string;
  tag_names: string[];
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get("section") || "";

  const [student, setStudent] = useState<any>(null);
  const [sectionInfo, setSectionInfo] = useState<any>(null);
  const [fs, setFs] = useState<FormativeScore | null>(null);
  const [fe, setFe] = useState<FinalExam | null>(null);
  const [growthLogs, setGrowthLogs] = useState<GrowthLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Growth log creation
  const [addLogOpen, setAddLogOpen] = useState(false);
  const [growthTypes, setGrowthTypes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [newLogTypeId, setNewLogTypeId] = useState("");
  const [newLogContent, setNewLogContent] = useState("");
  const [newLogTagIds, setNewLogTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: stu }, { data: sec }] = await Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      sectionId ? supabase.from("class_sections").select("*, terms(term_name), courses(course_name)").eq("id", sectionId).single() : Promise.resolve({ data: null }),
    ]);
    setStudent(stu);
    setSectionInfo(sec);

    if (sectionId) {
      const [{ data: fsData }, { data: feData }] = await Promise.all([
        supabase.from("formative_scores").select("*").eq("student_id", id).eq("class_section_id", sectionId).maybeSingle(),
        supabase.from("final_exams").select("*").eq("student_id", id).eq("class_section_id", sectionId).maybeSingle(),
      ]);
      setFs(fsData as any);
      setFe(feData as any);
    }

    // Fetch growth logs with type names
    const { data: logs } = await supabase
      .from("growth_logs")
      .select("*, growth_types(display_name)")
      .eq("student_id", id)
      .order("record_date", { ascending: false });

    const logRows: GrowthLogRow[] = [];
    for (const log of logs || []) {
      const { data: logTags } = await supabase
        .from("growth_log_tags")
        .select("tag_id, tags(display_name)")
        .eq("growth_log_id", log.id);
      logRows.push({
        id: log.id,
        record_date: log.record_date,
        content: log.content,
        type_name: (log as any).growth_types?.display_name || "",
        tag_names: (logTags || []).map((t: any) => t.tags?.display_name || ""),
      });
    }
    setGrowthLogs(logRows);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id, sectionId]);

  const loadGrowthConfig = async () => {
    const [{ data: gt }, { data: tg }] = await Promise.all([
      supabase.from("growth_types").select("*").eq("is_enabled", true).order("sort_order"),
      supabase.from("tags").select("*").eq("is_enabled", true).order("sort_order"),
    ]);
    setGrowthTypes(gt || []);
    setTags(tg || []);
  };

  const handleAddLog = async () => {
    if (!newLogTypeId || !newLogContent.trim() || !id) return;
    setSaving(true);

    // Need a term_id
    let termId = sectionInfo?.term_id;
    if (!termId) {
      const { data: t } = await supabase.from("terms").select("id").limit(1).single();
      termId = t?.id;
    }
    if (!termId) { toast({ title: "无法确定学期", variant: "destructive" }); setSaving(false); return; }

    const { data: log, error } = await supabase.from("growth_logs").insert({
      student_id: id,
      term_id: termId,
      course_id: sectionInfo?.course_id || null,
      class_section_id: sectionId || null,
      type_id: newLogTypeId,
      content: newLogContent.trim(),
    }).select("id").single();

    if (error || !log) {
      toast({ title: "创建失败", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Insert tags
    if (newLogTagIds.length > 0) {
      await supabase.from("growth_log_tags").insert(
        newLogTagIds.map((tagId) => ({ growth_log_id: log.id, tag_id: tagId }))
      );
    }

    toast({ title: "成长记录已添加" });
    setAddLogOpen(false);
    setNewLogTypeId("");
    setNewLogContent("");
    setNewLogTagIds([]);
    setSaving(false);
    fetchData();
  };

  const toggleTag = (tagId: string) => {
    setNewLogTagIds((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!student) return <div className="p-10 text-center text-muted-foreground">学生未找到</div>;

  const courseName = sectionInfo?.courses?.course_name || "";
  const termName = sectionInfo?.terms?.term_name || "";
  const sectionName = sectionInfo?.section_name || "";

  const formativeTotal = fs ? calcFormativeTotal(fs) : 0;
  const finalExamTotal = fe ? calcFinalExamTotal(fe) : 0;
  const finalWeighted = fe ? calcFinalWeighted(fe) : 0;
  const finalTotal = calcFinalTotal(formativeTotal, finalWeighted);

  const handleExport = async () => {
    if (!sectionId) { toast({ title: "请选择教学班", variant: "destructive" }); return; }
    setExporting(true);
    try {
      await exportStudentProfile(id!, sectionId);
      toast({ title: "导出成功", description: "PDF 文件已开始下载" });
    } catch (err: any) {
      toast({ title: "导出失败", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const formativeItems = fs ? [
    { label: "个人问答", value: fs.qa_score, weight: "5%" },
    { label: "小组协作", value: fs.group_score, weight: "5%" },
    { label: "思想素养", value: fs.ideology_score, weight: "5%" },
    { label: "口语", value: fs.speaking_test_score, weight: "5%" },
    { label: "听力", value: fs.listening_test_score, weight: "5%" },
    { label: "作业", value: fs.homework_score, weight: "10%" },
    { label: "线上任务", value: fs.online_task_score, weight: "15%" },
  ] : [];

  const examItems = fe ? [
    { label: "词汇", value: fe.vocab, max: 10 },
    { label: "选词填空", value: fe.cloze, max: 10 },
    { label: "判断正误", value: fe.tf, max: 10 },
    { label: "信息匹配", value: fe.match, max: 20 },
    { label: "深度阅读", value: fe.deep, max: 20 },
    { label: "翻译", value: fe.translation, max: 15 },
    { label: "写作", value: fe.writing, max: 15 },
  ] : [];

  const tagGroups = tags.reduce((acc: Record<string, any[]>, t: any) => {
    (acc[t.group_name] = acc[t.group_name] || []).push(t);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title={`${student.name} - ${courseName || "全部"} - ${termName} - ${sectionName}`}
        actions={
          <div className="flex gap-2">
            <Dialog open={addLogOpen} onOpenChange={(open) => { setAddLogOpen(open); if (open) loadGrowthConfig(); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> 新增成长记录</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>新增成长记录</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">类型</label>
                    <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                      value={newLogTypeId} onChange={(e) => setNewLogTypeId(e.target.value)}>
                      <option value="">-- 选择类型 --</option>
                      {growthTypes.map((gt) => <option key={gt.id} value={gt.id}>{gt.display_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">内容</label>
                    <Textarea value={newLogContent} onChange={(e) => setNewLogContent(e.target.value)} placeholder="记录内容..." className="min-h-[100px]" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">标签（多选）</label>
                    {Object.entries(tagGroups).map(([group, groupTags]) => (
                      <div key={group} className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{group}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(groupTags as any[]).map((t) => (
                            <button key={t.id} type="button"
                              className={`text-xs px-2 py-1 rounded transition-colors ${newLogTagIds.includes(t.id) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                              onClick={() => toggleTag(t.id)}>
                              {t.display_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddLog} disabled={saving || !newLogTypeId || !newLogContent.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} 保存
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 导出PDF
            </Button>
          </div>
        }
      />

      <div className="bg-card rounded-lg p-4 border border-border mb-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <span><strong className="text-muted-foreground">学号：</strong>{student.student_code}</span>
        <span><strong className="text-muted-foreground">专业：</strong>{student.major || "-"}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-lg p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground">形成性评价（50%）</h3>
            <span className={`text-lg font-bold ${getScoreClass(formativeTotal, 50)}`}>{formativeTotal}/50</span>
          </div>
          {formativeItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无形成性评价数据</p>
          ) : (
            <div className="space-y-2">
              {formativeItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label} <span className="text-xs">({item.weight})</span></span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.value}%` }} />
                    </div>
                    <span className={`font-medium w-8 text-right ${getScoreClass(item.value, 100)}`}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground">期末考试（50%）</h3>
            <div className="text-right">
              <span className={`text-lg font-bold ${getScoreClass(finalExamTotal, 100)}`}>{finalExamTotal}/100</span>
              <span className="text-xs text-muted-foreground ml-2">折算 {finalWeighted}/50</span>
            </div>
          </div>
          {examItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无期末考试数据</p>
          ) : (
            <div className="space-y-2">
              {examItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label} <span className="text-xs">(0-{item.max})</span></span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / item.max) * 100}%` }} />
                    </div>
                    <span className={`font-medium w-10 text-right ${getScoreClass(item.value, item.max)}`}>{item.value}/{item.max}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-primary/5 rounded-lg p-5 border border-primary/20 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">总评（自动计算）</h3>
          <p className="text-xs text-muted-foreground mt-0.5">formative_total + final_weighted = {formativeTotal} + {finalWeighted}</p>
        </div>
        <span className={`text-3xl font-bold ${getScoreClass(finalTotal, 100)}`}>{finalTotal}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
      </div>

      {/* Growth Logs Timeline */}
      <div className="bg-card rounded-lg p-5 border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">成长记录时间轴</h3>
        {growthLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无成长记录，点击上方"新增成长记录"添加</p>
        ) : (
          <div className="space-y-4">
            {growthLogs.map((log) => (
              <div key={log.id} className="flex gap-3 border-l-2 border-primary/30 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{log.record_date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{log.type_name}</span>
                  </div>
                  <p className="text-sm text-card-foreground">{log.content}</p>
                  {log.tag_names.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {log.tag_names.map((tn, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{tn}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
