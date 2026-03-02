import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { students, courseHistories, formativeScores, finalExams, enrollments, classSections } from "@/data/mockData";
import { calcFormativeTotal, calcFinalWeighted, calcFinalTotal } from "@/types";

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const filtered = students.filter(
    (s) => s.name.includes(query) || s.student_code.includes(query)
  );

  const getLatestScore = (studentId: string) => {
    const fs = formativeScores.find((f) => f.student_id === studentId);
    const fe = finalExams.find((f) => f.student_id === studentId);
    if (!fs || !fe) return null;
    return calcFinalTotal(calcFormativeTotal(fs), calcFinalWeighted(fe));
  };

  const getTrend = (studentId: string) => {
    const history = courseHistories
      .filter((h) => h.student_id === studentId)
      .sort((a, b) => a.term_id.localeCompare(b.term_id));
    if (history.length < 2) return "neutral";
    return history[history.length - 1].final_total > history[history.length - 2].final_total ? "up" : "down";
  };

  const getSection = (studentId: string) => {
    const enrollment = enrollments.find(e => e.student_id === studentId);
    if (!enrollment) return null;
    return classSections.find(cs => cs.id === enrollment.class_section_id);
  };

  return (
    <div>
      <PageHeader title="学生中心" description="搜索学生，查看跨课程/跨学期轨迹" />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索学号或姓名..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">学号</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">姓名</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">专业</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">教学班</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">最近总评</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">趋势</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const score = getLatestScore(s.id);
                const trend = getTrend(s.id);
                const section = getSection(s.id);
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{s.student_code}</td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.major || "-"}</td>
                    <td className="px-4 py-3">
                      {section && <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{section.section_name}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{score ?? "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"}>
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary"
                        onClick={() => navigate(`/students/${s.id}${section ? `?section=${section.id}` : ""}`)}
                      >
                        查看档案
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
