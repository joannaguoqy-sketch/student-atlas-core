import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users, BookOpen, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { exportStudentProfile, exportClassReport, exportCourseReport } from "@/lib/exportHelpers";

const exportTypes = [
  { key: "student", label: "学生成长档案", desc: "包含成绩、作业、成长记录", icon: FileText },
  { key: "class", label: "班级质量报告", desc: "班级学生成绩汇总", icon: Users },
  { key: "course", label: "课程报告", desc: "课程级别跨教学班对比", icon: BookOpen },
];

export default function ExportPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const loadData = async (type: string) => {
    setSelected(type); setSelectedTarget(""); setSelectedStudent(""); setSelectedSection("");
    if (type === "class" || type === "student") {
      const { data } = await supabase.from("class_sections").select("*, terms(term_name), courses(course_name)").eq("is_deleted", false);
      setSections(data || []);
    }
    if (type === "student") {
      const { data } = await supabase.from("students").select("*").eq("is_deleted", false).order("student_code");
      setStudents(data || []);
    }
    if (type === "course") {
      const { data } = await supabase.from("courses").select("*").eq("is_deleted", false);
      setCourses(data || []);
    }
  };

  const handleExport = async () => {
    if (!selected || !selectedTarget) { toast({ title: "请选择导出目标", variant: "destructive" }); return; }
    setLoading(true);
    try {
      switch (selected) {
        case "student": {
          const [studentId, sectionId] = selectedTarget.split("|");
          if (!sectionId) { toast({ title: "请选择教学班", variant: "destructive" }); setLoading(false); return; }
          await exportStudentProfile(studentId, sectionId);
          break;
        }
        case "class": await exportClassReport(selectedTarget); break;
        case "course": {
          const { data: sec } = await supabase.from("class_sections").select("term_id").eq("course_id", selectedTarget).eq("is_deleted", false).limit(1).single();
          if (sec) await exportCourseReport(selectedTarget, sec.term_id);
          else { toast({ title: "该课程暂无教学班数据", variant: "destructive" }); setLoading(false); return; }
          break;
        }
      }
      toast({ title: "导出成功", description: "文件已开始下载" });
    } catch (err: any) {
      toast({ title: "导出失败", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="报告导出" description="导出 CSV 格式报告（中文无乱码）" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {exportTypes.map((t) => (
          <div key={t.key} className={`bg-card rounded-lg p-5 border cursor-pointer transition-all ${selected === t.key ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`} onClick={() => loadData(t.key)}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><t.icon className="h-5 w-5 text-primary" /></div>
              <div><h3 className="font-semibold text-card-foreground">{t.label}</h3><p className="text-xs text-muted-foreground mt-1">{t.desc}</p></div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="bg-card rounded-lg border border-border p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">选择导出目标</h3>

          {selected === "class" && (
            <div className="space-y-2 mb-4">
              {sections.length === 0 && <p className="text-sm text-muted-foreground">暂无教学班数据</p>}
              {sections.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="target" value={s.id} checked={selectedTarget === s.id} onChange={() => setSelectedTarget(s.id)} className="accent-primary" />
                  {(s as any).courses?.course_name} / {(s as any).terms?.term_name} / {s.section_name}
                </label>
              ))}
            </div>
          )}

          {selected === "student" && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">选择学生</label>
                <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={selectedStudent} onChange={(e) => { setSelectedStudent(e.target.value); setSelectedTarget(e.target.value + "|" + selectedSection); }}>
                  <option value="">-- 选择学生 --</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.student_code} - {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">选择教学班</label>
                <select className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setSelectedTarget(selectedStudent + "|" + e.target.value); }}>
                  <option value="">-- 选择教学班 --</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{(s as any).courses?.course_name} / {(s as any).terms?.term_name} / {s.section_name}</option>)}
                </select>
              </div>
            </div>
          )}

          {selected === "course" && (
            <div className="space-y-2 mb-4">
              {courses.length === 0 && <p className="text-sm text-muted-foreground">暂无课程数据</p>}
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="target" value={c.id} checked={selectedTarget === c.id} onChange={() => setSelectedTarget(c.id)} className="accent-primary" />
                  {c.course_name}
                </label>
              ))}
            </div>
          )}

          <Button onClick={handleExport} disabled={loading || !selectedTarget} className="gap-1.5">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> 生成中...</> : <><Download className="h-4 w-4" /> 生成并下载</>}
          </Button>
        </div>
      )}
    </div>
  );
}
