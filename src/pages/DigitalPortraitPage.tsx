import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calcFormativeTotal, calcFinalExamTotal, calcFinalWeighted, calcFinalTotal } from "@/types";
import type { FormativeScore, FinalExam } from "@/types";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface AutoTag { label: string; trigger: string; type: "warning" | "success" | "info"; }

export default function DigitalPortraitPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get("section") || "";

  const [student, setStudent] = useState<any>(null);
  const [sectionInfo, setSectionInfo] = useState<any>(null);
  const [fs, setFs] = useState<FormativeScore | null>(null);
  const [fe, setFe] = useState<FinalExam | null>(null);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [courseHistory, setCourseHistory] = useState<any[]>([]);
  const [growthLogs, setGrowthLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [{ data: fsData }, { data: feData }, { data: hwData }] = await Promise.all([
          supabase.from("formative_scores").select("*").eq("student_id", id).eq("class_section_id", sectionId).maybeSingle(),
          supabase.from("final_exams").select("*").eq("student_id", id).eq("class_section_id", sectionId).maybeSingle(),
          supabase.from("homeworks").select("*").eq("student_id", id).eq("class_section_id", sectionId).eq("is_deleted", false).order("homework_no"),
        ]);
        setFs(fsData as any);
        setFe(feData as any);
        setHomeworks(hwData || []);
      }

      // Course history
      const { data: ch } = await supabase.from("course_history").select("*, terms(term_name), courses(course_name)").eq("student_id", id).order("created_at");
      setCourseHistory(ch || []);

      // Recent growth logs
      const { data: logs } = await supabase.from("growth_logs").select("*, growth_types(display_name)").eq("student_id", id).eq("is_deleted", false).order("record_date", { ascending: false }).limit(3);
      const logRows: any[] = [];
      for (const log of logs || []) {
        const { data: logTags } = await supabase.from("growth_log_tags").select("tags(display_name)").eq("growth_log_id", log.id);
        logRows.push({
          ...log,
          type_name: (log as any).growth_types?.display_name || "",
          tag_names: (logTags || []).map((t: any) => t.tags?.display_name).filter(Boolean),
        });
      }
      setGrowthLogs(logRows);
      setLoading(false);
    }
    load();
  }, [id, sectionId]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!student) return <div className="text-center py-10 text-muted-foreground">学生未找到</div>;

  const formativeTotal = fs ? calcFormativeTotal(fs) : 0;
  const finalExamTotal = fe ? calcFinalExamTotal(fe) : 0;
  const finalWeighted = fe ? calcFinalWeighted(fe) : 0;
  const finalTotal = calcFinalTotal(formativeTotal, finalWeighted);

  // Radar data (6 dimensions, normalized to 0-100)
  const radarData = fe && fs ? [
    { dim: "听力", value: fs.listening_test_score },
    { dim: "口语", value: fs.speaking_test_score },
    { dim: "阅读", value: fe.cloze + fe.tf + fe.match + fe.deep > 0 ? +((fe.cloze + fe.tf + fe.match + fe.deep) / 60 * 100).toFixed(0) : 0 },
    { dim: "写作", value: fe.writing > 0 ? +(fe.writing / 15 * 100).toFixed(0) : 0 },
    { dim: "词汇", value: fe.vocab > 0 ? +(fe.vocab / 10 * 100).toFixed(0) : 0 },
    { dim: "翻译", value: fe.translation > 0 ? +(fe.translation / 15 * 100).toFixed(0) : 0 },
  ] : [];

  // Behavior stats
  const hwSubmitted = homeworks.filter(h => h.submitted).length;
  const hwOnTime = homeworks.filter(h => h.on_time).length;
  const hwTotal = homeworks.length;
  const submitRate = hwTotal > 0 ? +(hwSubmitted / hwTotal * 100).toFixed(0) : 0;
  const onTimeRate = hwTotal > 0 ? +(hwOnTime / hwTotal * 100).toFixed(0) : 0;
  const hwAvg = hwTotal > 0 ? +(homeworks.reduce((a, h) => a + h.score, 0) / hwTotal).toFixed(1) : 0;
  const revisionAvg = hwTotal > 0 ? +(homeworks.reduce((a, h) => a + h.revision_count, 0) / hwTotal).toFixed(1) : 0;

  // Growth trend
  const trendData = courseHistory.map((ch: any) => ({
    name: ch.courses?.course_name || "",
    total: ch.final_total,
  }));

  // Previous term total for comparison
  const prevTotal = courseHistory.length > 0 ? courseHistory[courseHistory.length - 1].final_total : null;
  const diff = prevTotal !== null && finalTotal > 0 ? +(finalTotal - prevTotal).toFixed(1) : null;

  // Auto tags
  const autoTags: AutoTag[] = [];
  if (fs && fs.listening_test_score < 60) autoTags.push({ label: "听力短板型", trigger: `听力=${fs.listening_test_score}<60`, type: "warning" });
  if (fe && +(fe.writing / 15 * 100).toFixed(0) > 85) autoTags.push({ label: "写作优势型", trigger: `写作折算>${85}`, type: "success" });
  if (onTimeRate < 70 && hwTotal > 0) autoTags.push({ label: "拖延型", trigger: `按时率=${onTimeRate}%<70%`, type: "warning" });
  if (diff !== null && diff >= 5) autoTags.push({ label: "显著进步型", trigger: `较上学期+${diff}`, type: "success" });
  if (finalTotal > 0 && finalTotal < 60) autoTags.push({ label: "学业风险型", trigger: `总评=${finalTotal}<60`, type: "warning" });

  const courseName = sectionInfo?.courses?.course_name || "";
  const termName = sectionInfo?.terms?.term_name || "";

  const hasScores = fs || fe;

  return (
    <div>
      <PageHeader title={`数字画像：${student.name}`} description={`${courseName} / ${termName}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* A) Summary card */}
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">综合评价</h3>
          {hasScores ? (
            <>
              <div className="text-center mb-3">
                <span className={`text-4xl font-bold ${finalTotal >= 80 ? "text-success" : finalTotal >= 60 ? "text-foreground" : "text-destructive"}`}>{finalTotal}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              {diff !== null && (
                <div className={`flex items-center justify-center gap-1 text-sm ${diff >= 0 ? "text-success" : "text-destructive"}`}>
                  {diff >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  较上学期 {diff >= 0 ? "+" : ""}{diff}
                </div>
              )}
              {(finalTotal < 60 || (fs && fs.listening_test_score < 55) || onTimeRate < 70) && (
                <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> 存在学业风险
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center">暂无成绩</p>
          )}
        </div>

        {/* B) Radar */}
        <div className="bg-card rounded-lg p-5 border border-border lg:col-span-2">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">能力雷达（6维）</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                <PolarGrid stroke="hsl(220 13% 87%)" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="hsl(224 60% 38%)" fill="hsl(224 60% 38%)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">暂无数据</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* C) Behavior */}
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">行为画像</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">{submitRate}%</p>
              <p className="text-xs text-muted-foreground">作业提交率</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className={`text-2xl font-bold ${onTimeRate < 70 ? "text-destructive" : "text-foreground"}`}>{onTimeRate}%</p>
              <p className="text-xs text-muted-foreground">按时率</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">{hwAvg}</p>
              <p className="text-xs text-muted-foreground">作业均分</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-foreground">{revisionAvg}</p>
              <p className="text-xs text-muted-foreground">平均修改次数</p>
            </div>
          </div>
          {fs && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-foreground">{fs.online_task_score}</p>
                <p className="text-xs text-muted-foreground">线上任务</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-foreground">{+((fs.qa_score + fs.group_score) / 2).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">课堂参与</p>
              </div>
            </div>
          )}
        </div>

        {/* D) Trend */}
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">成长趋势（大英1-4）</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 87%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(224 60% 38%)" strokeWidth={2} dot={{ fill: "hsl(224 60% 38%)" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">暂无历史趋势</p>
          )}
        </div>
      </div>

      {/* E) Auto tags */}
      {autoTags.length > 0 && (
        <div className="bg-card rounded-lg p-5 border border-border mb-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">自动标签</h3>
          <div className="flex flex-wrap gap-2">
            {autoTags.map((tag, i) => (
              <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                tag.type === "warning" ? "bg-destructive/10 text-destructive border border-destructive/20" :
                tag.type === "success" ? "bg-success/10 text-success border border-success/20" :
                "bg-info/10 text-info border border-info/20"
              }`}>
                {tag.label} <span className="opacity-70 ml-1">({tag.trigger})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* F) Recent growth logs */}
      <div className="bg-card rounded-lg p-5 border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">最近成长记录</h3>
        {growthLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无成长记录</p>
        ) : (
          <div className="space-y-3">
            {growthLogs.map((log: any) => (
              <div key={log.id} className="flex gap-3 border-l-2 border-primary/30 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{log.record_date}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{log.type_name}</span>
                  </div>
                  <p className="text-sm text-card-foreground">{log.content}</p>
                  {log.tag_names.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {log.tag_names.map((tn: string, i: number) => (
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
