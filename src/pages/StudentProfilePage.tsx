import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { exportStudentProfile } from "@/lib/exportHelpers";
import {
  calcFormativeTotal, calcFinalExamTotal, calcFinalWeighted, calcFinalTotal, getScoreClass,
} from "@/types";
import type { FormativeScore, FinalExam } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get("section") || "";

  const [student, setStudent] = useState<any>(null);
  const [sectionInfo, setSectionInfo] = useState<any>(null);
  const [fs, setFs] = useState<FormativeScore | null>(null);
  const [fe, setFe] = useState<FinalExam | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
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
      setLoading(false);
    }
    load();
  }, [id, sectionId]);

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

  return (
    <div>
      <PageHeader
        title={`${student.name} - ${courseName} - ${termName} - ${sectionName}`}
        actions={
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 导出PDF
          </Button>
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
    </div>
  );
}
