import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Check, X, Trash2, Loader2, BarChart3, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SectionRow {
  id: string; term_id: string; course_id: string; section_name: string; is_deleted: boolean;
  terms?: { term_name: string }; courses?: { course_name: string }; student_count?: number;
}

export default function SectionsPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("class_sections").select("*, terms(term_name), courses(course_name)");
    if (error) { toast({ title: "加载失败", description: error.message, variant: "destructive" }); setLoading(false); return; }
    const enriched = await Promise.all(
      (data || []).map(async (s: any) => {
        const { count } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("class_section_id", s.id).eq("is_deleted", false);
        return { ...s, student_count: count || 0 };
      })
    );
    setSections(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchSections(); }, []);

  const handleAddSection = async () => {
    setAdding(true);
    let termId: string, courseId: string;
    const { data: et } = await supabase.from("terms").select("id").eq("is_deleted", false).limit(1);
    if (et && et.length > 0) termId = et[0].id;
    else {
      const { data: nt, error } = await supabase.from("terms").insert({ term_name: "2025-2026-2" }).select("id").single();
      if (error || !nt) { toast({ title: "创建学期失败", variant: "destructive" }); setAdding(false); return; }
      termId = nt.id;
    }
    const { data: ec } = await supabase.from("courses").select("id").eq("is_deleted", false).limit(1);
    if (ec && ec.length > 0) courseId = ec[0].id;
    else {
      const { data: nc, error } = await supabase.from("courses").insert({ course_name: "大学英语4" }).select("id").single();
      if (error || !nc) { toast({ title: "创建课程失败", variant: "destructive" }); setAdding(false); return; }
      courseId = nc.id;
    }
    const activeSections = sections.filter(s => !s.is_deleted);
    const nextNum = activeSections.length + 1;
    const { error } = await supabase.from("class_sections").insert({ term_id: termId, course_id: courseId, section_name: `教学班${nextNum}` });
    if (error) toast({ title: "创建失败", description: error.message, variant: "destructive" });
    else { toast({ title: "创建成功" }); await fetchSections(); }
    setAdding(false);
  };

  const handleConfirmRename = async (id: string) => {
    if (!renameValue.trim()) { toast({ title: "名称不能为空", variant: "destructive" }); return; }
    const { error } = await supabase.from("class_sections").update({ section_name: renameValue.trim() }).eq("id", id);
    if (error) toast({ title: "重命名失败", description: error.message, variant: "destructive" });
    else { toast({ title: "重命名成功" }); setRenamingId(null); await fetchSections(); }
  };

  const handleDelete = async (id: string, name: string) => {
    await supabase.from("enrollments").update({ is_deleted: true }).eq("class_section_id", id);
    await supabase.from("class_sections").update({ is_deleted: true }).eq("id", id);
    toast({ title: "已删除", description: `「${name}」已移至回收站` });
    await fetchSections();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("class_sections").update({ is_deleted: false }).eq("id", id);
    toast({ title: "已恢复" });
    await fetchSections();
  };

  const filtered = sections.filter(s => showDeleted ? s.is_deleted : !s.is_deleted);

  return (
    <div>
      <PageHeader title="教学班管理" description="管理教学班，支持新建、重命名和删除" actions={
        <div className="flex gap-2">
          <Button size="sm" variant={showDeleted ? "secondary" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
            {showDeleted ? "显示正常" : "回收站"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleAddSection} disabled={adding}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} 新建教学班
          </Button>
        </div>
      } />

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">{showDeleted ? "回收站为空" : "暂无教学班，请新建或通过数据导入创建"}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((section) => {
            const isRenaming = renamingId === section.id;
            return (
              <div key={section.id} className={`bg-card rounded-lg p-5 border flex items-center justify-between ${section.is_deleted ? "border-destructive/30 opacity-70" : "border-border"}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{section.section_name.charAt(0)}</span>
                  </div>
                  <div>
                    {isRenaming ? (
                      <div className="flex items-center gap-2">
                        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="h-8 w-40 text-sm" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleConfirmRename(section.id); if (e.key === "Escape") setRenamingId(null); }} />
                        <Button variant="ghost" size="sm" onClick={() => handleConfirmRename(section.id)}><Check className="h-4 w-4 text-success" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setRenamingId(null)}><X className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-card-foreground">{section.section_name}</h3>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {(section as any).courses?.course_name} · {(section as any).terms?.term_name} · {section.student_count ?? 0} 名学生
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {section.is_deleted ? (
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleRestore(section.id)}><RotateCcw className="h-3.5 w-3.5" /> 恢复</Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setRenamingId(section.id); setRenameValue(section.section_name); }}><Pencil className="h-3.5 w-3.5" /> 重命名</Button>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/analysis?section=${section.id}`)}><BarChart3 className="h-3.5 w-3.5" /> 班级分析</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> 删除</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>确认删除教学班？</AlertDialogTitle><AlertDialogDescription>将软删除「{section.section_name}」及其选课记录，可在回收站恢复</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(section.id, section.section_name)}>确认删除</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
