import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { BarChart3, Users, BookOpen, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface ScoreEntry { student_id: string; formativeTotal: number; finalWeighted: number; total: number; }

export default function Dashboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ count: sc }, { count: sec }, { data: fs }, { data: fe }] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("is_deleted", false),
        supabase.from("class_sections").select("*", { count: "exact", head: true }).eq("is_deleted", false),
        supabase.from("formative_scores").select("*"),
        supabase.from("final_exams").select("*"),
      ]);
      setStudentCount(sc || 0);
      setSectionCount(sec || 0);

      const fsMap = new Map((fs || []).map(f => [f.student_id, f]));
      const feMap = new Map((fe || []).map(f => [f.student_id, f]));
      const allIds = new Set([...fsMap.keys(), ...feMap.keys()]);
      const entries: ScoreEntry[] = [];
      allIds.forEach(id => {
        const f = fsMap.get(id);
        const e = feMap.get(id);
        const formativeTotal = f ? +(f.qa_score * 0.05 + f.group_score * 0.05 + f.ideology_score * 0.05 + f.speaking_test_score * 0.05 + f.listening_test_score * 0.05 + f.homework_score * 0.10 + f.online_task_score * 0.15).toFixed(1) : 0;
        const examTotal = e ? e.vocab + e.cloze + e.tf + e.match + e.deep + e.translation + e.writing : 0;
        const finalWeighted = +(examTotal * 0.5).toFixed(1);
        entries.push({ student_id: id, formativeTotal, finalWeighted, total: +(formativeTotal + finalWeighted).toFixed(1) });
      });
      setScores(entries);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div><PageHeader title="学院总览" description="大学英语课程学生成长评价与管理平台" /><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></div>;

  const avg = scores.length > 0 ? +(scores.reduce((a, s) => a + s.total, 0) / scores.length).toFixed(1) : 0;
  const above80 = scores.filter(s => s.total >= 80).length;
  const below60 = scores.filter(s => s.total < 60).length;

  const distribution = [
    { range: "90-100", count: scores.filter(s => s.total >= 90).length },
    { range: "80-89", count: scores.filter(s => s.total >= 80 && s.total < 90).length },
    { range: "70-79", count: scores.filter(s => s.total >= 70 && s.total < 80).length },
    { range: "60-69", count: scores.filter(s => s.total >= 60 && s.total < 70).length },
    { range: "<60", count: scores.filter(s => s.total < 60).length },
  ];

  const COLORS = ["hsl(152 60% 40%)", "hsl(224 60% 38%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)"];
  const rawPieData = [
    { name: "优秀(≥85)", value: scores.filter(s => s.total >= 85).length },
    { name: "良好(70-84)", value: scores.filter(s => s.total >= 70 && s.total < 85).length },
    { name: "及格(60-69)", value: scores.filter(s => s.total >= 60 && s.total < 70).length },
    { name: "不及格(<60)", value: scores.filter(s => s.total < 60).length },
  ];
  const pieData = rawPieData.map((d, i) => ({ ...d, color: COLORS[i] })).filter(d => d.value > 0);

  return (
    <div>
      <PageHeader title="学院总览" description="大学英语课程学生成长评价与管理平台" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="学生总数" value={studentCount} icon={<Users className="h-5 w-5" />} subtitle={`${sectionCount} 个教学班`} />
        <KpiCard title="平均总评" value={avg} icon={<BarChart3 className="h-5 w-5" />} subtitle={scores.length > 0 ? `${scores.length} 人有成绩` : "暂无数据"} />
        <KpiCard title="优良人数" value={above80} icon={<TrendingUp className="h-5 w-5" />} subtitle={scores.length > 0 ? `占比 ${((above80 / scores.length) * 100).toFixed(0)}%` : "-"} />
        <KpiCard title="不及格人数" value={below60} icon={<BookOpen className="h-5 w-5" />} subtitle={below60 > 0 ? "需要关注" : "全部及格"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">总评分数分布</h3>
          {scores.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">暂无成绩数据</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distribution}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 87%)" /><XAxis dataKey="range" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" fill="hsl(224 60% 38%)" radius={[4, 4, 0, 0]} name="人数" /></BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">成绩等级占比</h3>
          {pieData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">暂无成绩数据</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>{pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
