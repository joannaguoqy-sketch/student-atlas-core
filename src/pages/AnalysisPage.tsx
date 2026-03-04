import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, TrendingUp, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { exportClassReport } from "@/lib/exportHelpers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface StudentData { id: string; student_code: string; name: string; formativeTotal: number; finalWeighted: number; total: number; }

export default function AnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const sectionId = searchParams.get("section") || "";

  const [terms, setTerms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [studentData, setStudentData] = useState<StudentData[]>([]);
  const [sectionInfo, setSectionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    async function loadSelectors() {
      const [{ data: t }, { data: c }] = await Promise.all([
        supabase.from("terms").select("*").eq("is_deleted", false).order("term_name"),
        supabase.from("courses").select("*").eq("is_deleted", false).order("course_name"),
      ]);
      setTerms(t || []); setCourses(c || []);
      if (sectionId) {
        const { data: sec } = await supabase.from("class_sections").select("*").eq("id", sectionId).single();
        if (sec) { setSelectedTerm(sec.term_id); setSelectedCourse(sec.course_id); }
      } else if (t && t.length > 0) { setSelectedTerm(t[t.length - 1].id); }
      setInitLoading(false);
    }
    loadSelectors();
  }, []);

  useEffect(() => {
    if (!selectedTerm || !selectedCourse) { setSections([]); return; }
    supabase.from("class_sections").select("*").eq("term_id", selectedTerm).eq("course_id", selectedCourse).eq("is_deleted", false)
      .then(({ data }) => setSections(data || []));
  }, [selectedTerm, selectedCourse]);

  useEffect(() => {
    if (!sectionId) { setStudentData([]); setSectionInfo(null); return; }
    async function load() {
      setLoading(true);
      const [{ data: section }, { data: enrollments }, { data: fs }, { data: fe }] = await Promise.all([
        supabase.from("class_sections").select("*, terms(term_name), courses(course_name)").eq("id", sectionId).single(),
        supabase.from("enrollments").select("student_id, students(id, student_code, name)").eq("class_section_id", sectionId).eq("is_deleted", false),
        supabase.from("formative_scores").select("*").eq("class_section_id", sectionId),
        supabase.from("final_exams").select("*").eq("class_section_id", sectionId),
      ]);
      setSectionInfo(section);
      const fsMap = new Map((fs || []).map(f => [f.student_id, f]));
      const feMap = new Map((fe || []).map(f => [f.student_id, f]));
      const data = (enrollments || []).map((e: any) => {
        const student = e.students;
        const f = fsMap.get(e.student_id);
        const ex = feMap.get(e.student_id);
        const formativeTotal = f ? +(f.qa_score * 0.05 + f.group_score * 0.05 + f.ideology_score * 0.05 + f.speaking_test_score * 0.05 + f.listening_test_score * 0.05 + f.homework_score * 0.10 + f.online_task_score * 0.15).toFixed(1) : 0;
        const examTotal = ex ? ex.vocab + ex.cloze + ex.tf + ex.match + ex.deep + ex.translation + ex.writing : 0;
        const finalWeighted = +(examTotal * 0.5).toFixed(1);
        return { id: student?.id || "", student_code: student?.student_code || "", name: student?.name || "", formativeTotal, finalWeighted, total: +(formativeTotal + finalWeighted).toFixed(1) };
      }).sort((a: StudentData, b: StudentData) => b.total - a.total);
      setStudentData(data);
      setLoading(false);
    }
    load();
  }, [sectionId]);

  const handleExport = async () => {
    if (!sectionId) return;
    setExporting(true);
    try { await exportClassReport(sectionId); toast({ title: "导出成功" }); }
    catch (err: any) { toast({ title: "导出失败", description: err.message, variant: "destructive" }); }
    finally { setExporting(false); }
  };

  const selectSection = (id: string) => { setSearchParams({ section: id }); };

  if (initLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const courseName = sectionInfo?.courses?.course_name || "";
  const termName = sectionInfo?.terms?.term_name || "";
  const sectionName = sectionInfo?.section_name || "";
  const avg = studentData.length > 0 ? +(studentData.reduce((a, s) => a + s.total, 0) / studentData.length).toFixed(1) : 0;
  const avgFormative = studentData.length > 0 ? +(studentData.reduce((a, s) => a + s.formativeTotal, 0) / studentData.length).toFixed(1) : 0;
  const avgFinal = studentData.length > 0 ? +(studentData.reduce((a, s) => a + s.finalWeighted, 0) / studentData.length).toFixed(1) : 0;

  const distribution = [
    { range: "90-100", count: studentData.filter(s => s.total >= 90).length },
    { range: "80-89", count: studentData.filter(s => s.total >= 80 && s.total < 90).length },
    { range: "70-79", count: studentData.filter(s => s.total >= 70 && s.total < 80).length },
    { range: "60-69", count: studentData.filter(s => s.total >= 60 && s.total < 70).length },
    { range: "<60", count: studentData.filter(s => s.total < 60).length },
  ];

  const COLORS = ["hsl(152 60% 40%)", "hsl(224 60% 38%)", "hsl(38 92% 50%)", "hsl(0 72% 51%)"];
  const rawPieData = [
    { name: "优秀(≥85)", value: studentData.filter(s => s.total >= 85).length },
    { name: "良好(70-84)", value: studentData.filter(s => s.total >= 70 && s.total < 85).length },
    { name: "及格(60-69)", value: studentData.filter(s => s.total >= 60 && s.total < 70).length },
    { name: "不及格(<60)", value: studentData.filter(s => s.total < 60).length },
  ];
  const pieData = rawPieData.map((d, i) => ({ ...d, color: COLORS[i] })).filter(d => d.value > 0);

  return (
    <div>
      <PageHeader title={sectionId ? `班级分析：${courseName} / ${termName} / ${sectionName}` : "班级分析"} actions={sectionId ? (
        <Button size="sm" className="gap-1.5" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 导出班级报告
        </Button>
      ) : undefined} />

      <div className="bg-card rounded-lg border border-border p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">学期</label>
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={selectedTerm} onChange={(e) => { setSelectedTerm(e.target.value); setSearchParams({}); }}>
            <option value="">-- 选择学期 --</option>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.term_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">课程</label>
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setSearchParams({}); }}>
            <option value="">-- 选择课程 --</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.course_name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">教学班</label>
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={sectionId} onChange={(e) => selectSection(e.target.value)}>
            <option value="">-- 选择教学班 --</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.section_name}</option>)}
          </select>
        </div>
      </div>

      {!sectionId && <div className="text-center py-10 text-muted-foreground">请选择学期、课程和教学班以查看分析</div>}
      {loading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}

      {sectionId && !loading && (
        <>
          {studentData.length === 0 ? <div className="text-center py-10 text-muted-foreground">该教学班暂无学生数据</div> : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <KpiCard title="平均总评" value={avg} icon={<BarChart3 className="h-5 w-5" />} />
                <KpiCard title="形成性均值" value={`${avgFormative}/50`} icon={<TrendingUp className="h-5 w-5" />} />
                <KpiCard title="期末折算均值" value={`${avgFinal}/50`} icon={<Users className="h-5 w-5" />} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-card rounded-lg p-5 border border-border">
                  <h3 className="text-sm font-semibold text-card-foreground mb-4">总评分布</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distribution}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 87%)" /><XAxis dataKey="range" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="count" fill="hsl(224 60% 38%)" radius={[4, 4, 0, 0]} name="人数" /></BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-lg p-5 border border-border">
                  <h3 className="text-sm font-semibold text-card-foreground mb-4">成绩等级占比</h3>
                  {pieData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">暂无数据</p> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>{pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border"><h3 className="text-sm font-semibold text-card-foreground">学生列表（{studentData.length} 人）</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-4 py-3 font-medium text-muted-foreground">学号</th><th className="text-left px-4 py-3 font-medium text-muted-foreground">姓名</th><th className="text-right px-4 py-3 font-medium text-muted-foreground">形成性</th><th className="text-right px-4 py-3 font-medium text-muted-foreground">期末折算</th><th className="text-right px-4 py-3 font-medium text-muted-foreground">总评</th><th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th></tr></thead>
                    <tbody>
                      {studentData.map((s) => (
                        <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">{s.student_code}</td>
                          <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                          <td className="px-4 py-3 text-right">{s.formativeTotal}</td>
                          <td className="px-4 py-3 text-right">{s.finalWeighted}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${s.total >= 80 ? "text-success" : s.total >= 60 ? "text-foreground" : "text-destructive"}`}>{s.total}</td>
                          <td className="px-4 py-3 text-center"><Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate(`/students/${s.id}?section=${sectionId}`)}>进入档案</Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
