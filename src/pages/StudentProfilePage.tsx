import { useParams, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText, Plus } from "lucide-react";
import {
  getStudentById, getSectionById, getCourseById, getTermById,
  formativeScores, finalExams, homeworks, courseHistories, growthLogs, growthTypes, tags,
} from "@/data/mockData";
import {
  calcFormativeTotal, calcFinalExamTotal, calcFinalWeighted, calcFinalTotal,
  calcHomeworkAverage, getScoreClass,
} from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get("section") || "cs1";

  const student = getStudentById(id || "");
  const section = getSectionById(sectionId);
  const course = section ? getCourseById(section.course_id) : undefined;
  const term = section ? getTermById(section.term_id) : undefined;

  if (!student) return <div className="p-10 text-center text-muted-foreground">学生未找到</div>;

  const fs = formativeScores.find((f) => f.student_id === student.id && f.class_section_id === sectionId);
  const fe = finalExams.find((f) => f.student_id === student.id && f.class_section_id === sectionId);
  const hw = homeworks.filter((h) => h.student_id === student.id && h.class_section_id === sectionId).sort((a, b) => a.homework_no - b.homework_no);
  const logs = growthLogs.filter((g) => g.student_id === student.id).sort((a, b) => a.record_date.localeCompare(b.record_date));

  const formativeTotal = fs ? calcFormativeTotal(fs) : 0;
  const finalExamTotal = fe ? calcFinalExamTotal(fe) : 0;
  const finalWeighted = fe ? calcFinalWeighted(fe) : 0;
  const finalTotal = calcFinalTotal(formativeTotal, finalWeighted);
  const hwAvg = calcHomeworkAverage(hw);
  const submitRate = hw.length > 0 ? Math.round(hw.filter((h) => h.submitted).length / hw.length * 100) : 0;
  const onTimeRate = hw.length > 0 ? Math.round(hw.filter((h) => h.on_time).length / hw.length * 100) : 0;
  const totalRevisions = hw.reduce((a, h) => a + h.revision_count, 0);

  // Course history for trajectory
  const history = courseHistories
    .filter((h) => h.student_id === student.id)
    .map((h) => {
      const c = getCourseById(h.course_id);
      return { name: c?.course_name || "", score: h.final_total };
    });
  history.push({ name: course?.course_name || "大学英语4", score: finalTotal });

  const formativeItems = fs
    ? [
        { label: "个人问答", value: fs.qa_score, weight: "5%" },
        { label: "小组协作", value: fs.group_score, weight: "5%" },
        { label: "思想素养", value: fs.ideology_score, weight: "5%" },
        { label: "口语", value: fs.speaking_test_score, weight: "5%" },
        { label: "听力", value: fs.listening_test_score, weight: "5%" },
        { label: "作业", value: fs.homework_score, weight: "10%" },
        { label: "线上任务", value: fs.online_task_score, weight: "15%" },
      ]
    : [];

  const examItems = fe
    ? [
        { label: "词汇", value: fe.vocab, max: 10 },
        { label: "选词填空", value: fe.cloze, max: 10 },
        { label: "判断正误", value: fe.tf, max: 10 },
        { label: "信息匹配", value: fe.match, max: 20 },
        { label: "深度阅读", value: fe.deep, max: 20 },
        { label: "翻译", value: fe.translation, max: 15 },
        { label: "写作", value: fe.writing, max: 15 },
      ]
    : [];

  const generateComment = () => {
    const parts: string[] = [];
    parts.push(`本学期总评${finalTotal}分`);
    if (formativeTotal >= 40) parts.push("形成性参与度较高");
    else if (formativeTotal >= 30) parts.push("形成性参与度中等");
    else parts.push("形成性参与度偏低，需加强课堂表现");
    parts.push(`作业按时率${onTimeRate}%`);
    if (fs && fs.listening_test_score < 60) parts.push("听力需加强");
    if (fe && fe.writing >= 12) parts.push("写作表现突出");
    if (fe && fe.deep >= 16) parts.push("阅读理解能力较强");
    return parts.join("，") + "。";
  };

  return (
    <div>
      <PageHeader
        title={`${student.name} - ${course?.course_name || ""} - ${term?.term_name || ""} - ${section?.section_name || ""}`}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5"><Download className="h-4 w-4" /> 导出PDF</Button>
            <Button size="sm" variant="outline" className="gap-1.5"><FileText className="h-4 w-4" /> 导出Word</Button>
          </div>
        }
      />

      {/* Basic Info */}
      <div className="bg-card rounded-lg p-4 border border-border mb-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <span><strong className="text-muted-foreground">学号：</strong>{student.student_code}</span>
        <span><strong className="text-muted-foreground">专业：</strong>{student.major || "-"}</span>
        <span><strong className="text-muted-foreground">CET：</strong>{student.cet_status || "-"}</span>
        <span><strong className="text-muted-foreground">目标：</strong>{student.semester_goal || "-"}</span>
      </div>

      {/* Trajectory */}
      <div className="bg-card rounded-lg p-5 border border-border mb-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">跨课程总评轨迹</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 87%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="hsl(224 60% 38%)" strokeWidth={2.5} dot={{ fill: "hsl(224 60% 38%)", r: 4 }} name="总评" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Formative */}
        <div className="bg-card rounded-lg p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground">形成性评价（50%）</h3>
            <span className={`text-lg font-bold ${getScoreClass(formativeTotal, 50)}`}>{formativeTotal}/50</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">子项0-100录入，系统自动折算（禁止手填折算分）</p>
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
        </div>

        {/* Final Exam */}
        <div className="bg-card rounded-lg p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground">期末考试（50%）</h3>
            <div className="text-right">
              <span className={`text-lg font-bold ${getScoreClass(finalExamTotal, 100)}`}>{finalExamTotal}/100</span>
              <span className="text-xs text-muted-foreground ml-2">折算 {finalWeighted}/50</span>
            </div>
          </div>
          <div className="space-y-2">
            {examItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label} <span className="text-xs">(0-{item.max})</span></span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-info" style={{ width: `${(item.value / item.max) * 100}%` }} />
                  </div>
                  <span className={`font-medium w-10 text-right ${getScoreClass(item.value, item.max)}`}>{item.value}/{item.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final Total */}
      <div className="bg-primary/5 rounded-lg p-5 border border-primary/20 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">总评（自动计算）</h3>
          <p className="text-xs text-muted-foreground mt-0.5">formative_total + final_weighted = {formativeTotal} + {finalWeighted}</p>
        </div>
        <span className={`text-3xl font-bold ${getScoreClass(finalTotal, 100)}`}>{finalTotal}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
      </div>

      {/* Homework */}
      <div className="bg-card rounded-lg p-5 border border-border mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-card-foreground">作业明细（4次）</h3>
          <span className="text-sm text-muted-foreground">均分(自动)：<strong className="text-card-foreground">{hwAvg}</strong></span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {hw.map((h) => (
            <div key={h.id} className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">作业{h.homework_no}</span>
                <span className={`font-bold ${getScoreClass(h.score, 100)}`}>{h.score}</span>
              </div>
              <div className="flex gap-1.5 text-xs">
                <span className={h.submitted ? "text-success" : "text-destructive"}>{h.submitted ? "✓提交" : "✗未交"}</span>
                <span className={h.on_time ? "text-success" : "text-warning"}>{h.on_time ? "✓按时" : "✗迟交"}</span>
                <span className="text-muted-foreground">改{h.revision_count}次</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>提交率 <strong className="text-card-foreground">{submitRate}%</strong></span>
          <span>按时率 <strong className="text-card-foreground">{onTimeRate}%</strong></span>
          <span>修改次数 <strong className="text-card-foreground">{totalRevisions}次</strong></span>
        </div>
      </div>

      {/* Growth Timeline */}
      <div className="bg-card rounded-lg p-5 border border-border mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-card-foreground">成长记录时间轴</h3>
          <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> 添加记录</Button>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">暂无成长记录</p>
        ) : (
          <div className="space-y-0">
            {logs.map((log, idx) => {
              const type = growthTypes.find((t) => t.id === log.type_id);
              const logTags = tags.filter((t) => log.tag_ids.includes(t.id));
              const typeColors: Record<string, string> = {
                progress: "bg-success/10 text-success border-success/20",
                issue: "bg-warning/10 text-warning border-warning/20",
                performance: "bg-primary/10 text-primary border-primary/20",
                tutoring: "bg-info/10 text-info border-info/20",
                work: "bg-accent/10 text-accent border-accent/20",
              };
              const colorClass = typeColors[type?.key || ""] || "bg-muted text-muted-foreground border-border";
              return (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full border-2 mt-1.5 ${colorClass}`} />
                    {idx < logs.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{log.record_date}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${colorClass}`}>{type?.display_name}</span>
                      {logTags.map((t) => (
                        <span key={t.id} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{t.display_name}</span>
                      ))}
                    </div>
                    <p className="text-sm text-card-foreground">{log.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="bg-card rounded-lg p-5 border border-border">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">阶段评语（自动生成草稿，可编辑保存）</h3>
        <textarea
          className="w-full p-3 rounded-lg border border-border bg-background text-sm text-foreground resize-y min-h-[80px]"
          defaultValue={generateComment()}
        />
        <div className="flex gap-2 mt-3">
          <Button size="sm">保存</Button>
          <Button size="sm" variant="outline">加入班级报告</Button>
        </div>
      </div>
    </div>
  );
}
