import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { BookOpen, Plus, Users, Loader2, Trash2, Pencil, Check, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

interface CourseStats {
  id: string;
  course_name: string;
  is_deleted: boolean;
  sectionCount: number;
  studentCount: number;
  avg: number;
  sections: { id: string; section_name: string; term_name: string }[];
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [newCourseOpen, setNewCourseOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const { data: courses } = await supabase.from("courses").select("*").order("course_name");
    if (!courses) { setLoading(false); return; }

    const stats: CourseStats[] = await Promise.all(
      courses.map(async (course) => {
        const { data: sections } = await supabase
          .from("class_sections").select("id, section_name, terms(term_name)")
          .eq("course_id", course.id).eq("is_deleted", false);
        const sectionIds = (sections || []).map((s) => s.id);
        let studentCount = 0;
        if (sectionIds.length > 0) {
          const { count } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).in("class_section_id", sectionIds).eq("is_deleted", false);
          studentCount = count || 0;
        }
        // avg calculation simplified - just show 0 if no data
        return {
          id: course.id,
          course_name: course.course_name,
          is_deleted: (course as any).is_deleted || false,
          sectionCount: sections?.length || 0,
          studentCount,
          avg: 0,
          sections: (sections || []).map((s: any) => ({ id: s.id, section_name: s.section_name, term_name: s.terms?.term_name || "" })),
        };
      })
    );
    setCourseStats(stats);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) return;
    const { data: existing } = await supabase.from("courses").select("id").eq("course_name", newCourseName.trim()).maybeSingle();
    if (existing) { toast({ title: "课程已存在", variant: "destructive" }); return; }
    const { error } = await supabase.from("courses").insert({ course_name: newCourseName.trim() });
    if (error) { toast({ title: "创建失败", description: error.message, variant: "destructive" }); return; }
    toast({ title: "课程创建成功" });
    setNewCourseOpen(false); setNewCourseName("");
    await fetchData();
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("courses").update({ course_name: editName.trim() }).eq("id", id);
    if (error) toast({ title: "重命名失败", description: error.message, variant: "destructive" });
    else { toast({ title: "已更新" }); setEditingId(null); await fetchData(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("courses").update({ is_deleted: true }).eq("id", id);
    toast({ title: "课程已删除" });
    await fetchData();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("courses").update({ is_deleted: false }).eq("id", id);
    toast({ title: "课程已恢复" });
    await fetchData();
  };

  const handleAddSection = async (courseId: string) => {
    setAdding(courseId);
    let termId: string;
    const { data: terms } = await supabase.from("terms").select("id").eq("is_deleted", false).limit(1);
    if (terms && terms.length > 0) { termId = terms[0].id; }
    else {
      const { data: nt, error } = await supabase.from("terms").insert({ term_name: "2025-2026-2" }).select("id").single();
      if (error || !nt) { toast({ title: "创建学期失败", variant: "destructive" }); setAdding(null); return; }
      termId = nt.id;
    }
    const cs = courseStats.find((c) => c.id === courseId);
    const nextNum = (cs?.sectionCount || 0) + 1;
    const { error } = await supabase.from("class_sections").insert({ term_id: termId, course_id: courseId, section_name: `教学班${nextNum}` });
    if (error) toast({ title: "创建教学班失败", description: error.message, variant: "destructive" });
    else { toast({ title: "教学班创建成功" }); await fetchData(); }
    setAdding(null);
  };

  const filtered = courseStats.filter(c => showDeleted ? c.is_deleted : !c.is_deleted);

  if (loading) return <div><PageHeader title="课程中心" description="管理课程与教学班" /><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></div>;

  return (
    <div>
      <PageHeader title="课程中心" description="管理课程与教学班" actions={
        <div className="flex gap-2">
          <Button size="sm" variant={showDeleted ? "secondary" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
            {showDeleted ? "显示正常" : "回收站"}
          </Button>
          <Dialog open={newCourseOpen} onOpenChange={setNewCourseOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> 新增课程</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>新增课程</DialogTitle></DialogHeader>
              <Input placeholder="课程名称，如：大学英语3" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} />
              <DialogFooter><Button onClick={handleAddCourse} disabled={!newCourseName.trim()}>确认创建</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      } />

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">{showDeleted ? "回收站为空" : "暂无课程，请点击「新增课程」或通过数据导入创建"}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((cs) => (
            <div key={cs.id} className={`bg-card rounded-lg p-5 border ${cs.is_deleted ? "border-destructive/30 opacity-70" : "border-border"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
                  <div>
                    {editingId === cs.id ? (
                      <div className="flex items-center gap-1">
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 w-40 text-sm" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleRename(cs.id); if (e.key === "Escape") setEditingId(null); }} />
                        <Button variant="ghost" size="sm" onClick={() => handleRename(cs.id)}><Check className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-card-foreground">{cs.course_name}</h3>
                    )}
                    <p className="text-xs text-muted-foreground">{cs.sectionCount} 个教学班 · {cs.studentCount} 名学生</p>
                  </div>
                </div>
                {cs.avg > 0 ? (
                  <div className="text-right"><p className="text-lg font-bold text-primary">{cs.avg}</p><p className="text-xs text-muted-foreground">平均总评</p></div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">暂无成绩</p>
                )}
              </div>

              {cs.sections.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {cs.sections.map((s) => (
                    <button key={s.id} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" onClick={() => navigate(`/analysis?section=${s.id}`)}>
                      {s.section_name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                {cs.is_deleted ? (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleRestore(cs.id)}><RotateCcw className="h-3.5 w-3.5" /> 恢复</Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/sections")}><Users className="h-3.5 w-3.5" /> 管理教学班</Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleAddSection(cs.id)} disabled={adding === cs.id}>
                      {adding === cs.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} 新建教学班
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(cs.id); setEditName(cs.course_name); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>确认删除课程？</AlertDialogTitle><AlertDialogDescription>将软删除「{cs.course_name}」，可在回收站恢复</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(cs.id)}>确认删除</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
