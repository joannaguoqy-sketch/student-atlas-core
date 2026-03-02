import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { BarChart3, Users, BookOpen, TrendingUp } from "lucide-react";
import { students, formativeScores, finalExams, classSections } from "@/data/mockData";
import { calcFormativeTotal, calcFinalWeighted, calcFinalTotal } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function getAllScores() {
  return students.map((s) => {
    const fs = formativeScores.find((f) => f.student_id === s.id);
    const fe = finalExams.find((f) => f.student_id === s.id);
    if (!fs || !fe) return { student: s, total: 0 };
    const ft = calcFormativeTotal(fs);
    const fw = calcFinalWeighted(fe);
    return { student: s, total: calcFinalTotal(ft, fw) };
  });
}

export default function Dashboard() {
  const scores = getAllScores();
  const avg = +(scores.reduce((a, s) => a + s.total, 0) / scores.length).toFixed(1);
  const above80 = scores.filter((s) => s.total >= 80).length;
  const below60 = scores.filter((s) => s.total < 60).length;

  const distribution = [
    { range: "90-100", count: scores.filter((s) => s.total >= 90).length },
    { range: "80-89", count: scores.filter((s) => s.total >= 80 && s.total < 90).length },
    { range: "70-79", count: scores.filter((s) => s.total >= 70 && s.total < 80).length },
    { range: "60-69", count: scores.filter((s) => s.total >= 60 && s.total < 70).length },
    { range: "<60", count: scores.filter((s) => s.total < 60).length },
  ];

  const pieData = [
    { name: "优秀(≥85)", value: scores.filter(s => s.total >= 85).length },
    { name: "良好(70-84)", value: scores.filter(s => s.total >= 70 && s.total < 85).length },
    { name: "及格(60-69)", value: scores.filter(s => s.total >= 60 && s.total < 70).length },
    { name: "不及格(<60)", value: scores.filter(s => s.total < 60).length },
  ];

  const COLORS = [
    "hsl(152 60% 40%)", "hsl(224 60% 38%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)"
  ];

  return (
    <div>
      <PageHeader title="学院总览" description="2025-2026-2 学期 · 大学英语4" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="学生总数" value={students.length} icon={<Users className="h-5 w-5" />} subtitle={`${classSections.length} 个教学班`} />
        <KpiCard title="平均总评" value={avg} icon={<BarChart3 className="h-5 w-5" />} trend="up" trendValue="较上学期+2.3" />
        <KpiCard title="优良人数" value={above80} icon={<TrendingUp className="h-5 w-5" />} subtitle={`占比 ${((above80 / students.length) * 100).toFixed(0)}%`} />
        <KpiCard title="不及格人数" value={below60} icon={<BookOpen className="h-5 w-5" />} subtitle={below60 > 0 ? "需要关注" : "全部及格"} trend={below60 > 0 ? "down" : "neutral"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">总评分数分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 87%)" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(224 60% 38%)" radius={[4, 4, 0, 0]} name="人数" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">成绩等级占比</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
