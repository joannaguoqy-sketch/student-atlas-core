import { useSearchParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, Clock, TrendingUp, Users } from "lucide-react";
import {
  classSections, getStudentsBySection, getSectionById, getCourseById, getTermById,
  formativeScores, finalExams, homeworks,
} from "@/data/mockData";
import { calcFormativeTotal, calcFinalWeighted, calcFinalTotal } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalysisPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionId = searchParams.get("section") || "cs1";
  const section = getSectionById(sectionId);
  const course = section ? getCourseById(section.course_id) : undefined;
  const term = section ? getTermById(section.term_id) : undefined;
  const sectionStudents = getStudentsBySection(sectionId);

  const studentData = sectionStudents.map((s) => {
    const fs = formativeScores.find((f) => f.student_id === s.id && f.class_section_id === sectionId);
    const fe = finalExams.find((f) => f.student_id === s.id && f.class_section_id === sectionId);
    const hw = homeworks.filter((h) => h.student_id === s.id && h.class_section_id === sectionId);
    const formativeTotal = fs ? calcFormativeTotal(fs) : 0;
    const finalWeighted = fe ? calcFinalWeighted(fe) : 0;
    const total = calcFinalTotal(formativeTotal, finalWeighted);
    const onTimeRate = hw.length > 0 ? Math.round(hw.filter((h) => h.on_time).length / hw.length * 100) : 0;
    return { ...s, formativeTotal, finalWeighted, total, onTimeRate, listening: fs?.listening_test_score || 0 };
  }).sort((a, b) => b.total - a.total);

  const avg = +(studentData.reduce((a, s) => a + s.total, 0) / studentData.length).toFixed(1);
  const avgFormative = +(studentData.reduce((a, s) => a + s.formativeTotal, 0) / studentData.length).toFixed(1);
  const avgFinal = +(studentData.reduce((a, s) => a + s.finalWeighted, 0) / studentData.length).toFixed(1);
  const avgOnTime = Math.round(studentData.reduce((a, s) => a + s.onTimeRate, 0) / studentData.length);

  const distribution = [
    { range: "90-100", count: studentData.filter((s) => s.total >= 90).length },
    { range: "80-89", count: studentData.filter((s) => s.total >= 80 && s.total < 90).length },
    { range: "70-79", count: studentData.filter((s) => s.total >= 70 && s.total < 80).length },
    { range: "60-69", count: studentData.filter((s) => s.total >= 60 && s.total < 70).length },
    { range: "<60", count: studentData.filter((s) => s.total < 60).length },
  ];

  return (
    <div>
      <PageHeader
        title={`班级分析：${course?.course_name || ""} / ${term?.term_name || ""} / ${section?.section_name || ""}`}
        actions={<Button size="sm" className="gap-1.5"><Download className="h-4 w-4" /> 导出班级报告</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="平均总评" value={avg} icon={<BarChart3 className="h-5 w-5" />} />
        <KpiCard title="形成性均值" value={`${avgFormative}/50`} icon={<TrendingUp className="h-5 w-5" />} />
        <KpiCard title="期末折算均值" value={`${avgFinal}/50`} icon={<Users className="h-5 w-5" />} />
        <KpiCard title="按时率班均" value={`${avgOnTime}%`} icon={<Clock className="h-5 w-5" />} />
      </div>

      <div className="bg-card rounded-lg p-5 border border-border mb-6">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">总评分布</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 87%)" />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(224 60% 38%)" radius={[4, 4, 0, 0]} name="人数" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground">学生列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">学号</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">姓名</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">形成性</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">期末折算</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">总评</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">听力</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">按时率</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {studentData.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{s.student_code}</td>
                  <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-right">{s.formativeTotal}</td>
                  <td className="px-4 py-3 text-right">{s.finalWeighted}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${s.total >= 80 ? "text-success" : s.total >= 60 ? "text-foreground" : "text-destructive"}`}>{s.total}</td>
                  <td className={`px-4 py-3 text-right ${s.listening < 60 ? "text-destructive" : ""}`}>{s.listening}</td>
                  <td className={`px-4 py-3 text-right ${s.onTimeRate < 75 ? "text-warning" : ""}`}>{s.onTimeRate}%</td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary"
                      onClick={() => navigate(`/students/${s.id}?section=${sectionId}`)}
                    >
                      进入档案
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
