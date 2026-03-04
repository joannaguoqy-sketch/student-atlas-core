import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentRow {
  id: string; student_code: string; name: string; major: string | null; is_deleted: boolean;
  section_name?: string; section_id?: string;
}

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("students").select("*").order("student_code");
    if (error) { toast({ title: "加载失败", description: error.message, variant: "destructive" }); setLoading(false); return; }
    const enriched = await Promise.all(
      (data || []).map(async (s: any) => {
        const { data: enr } = await supabase.from("enrollments").select("class_section_id, class_sections(section_name)").eq("student_id", s.id).eq("is_deleted", false).limit(1);
        const enrollment = enr?.[0];
        return { ...s, section_name: (enrollment as any)?.class_sections?.section_name || undefined, section_id: enrollment?.class_section_id || undefined };
      })
    );
    setStudents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students
    .filter(s => showDeleted ? s.is_deleted : !s.is_deleted)
    .filter(s => s.name.includes(query) || s.student_code.includes(query));

  const handleDelete = async (id: string, name: string) => {
    await supabase.from("enrollments").update({ is_deleted: true }).eq("student_id", id);
    await supabase.from("students").update({ is_deleted: true }).eq("id", id);
    toast({ title: "已删除", description: `「${name}」已移至回收站` });
    await fetchStudents();
  };

  const handleRestore = async (id: string) => {
    await supabase.from("students").update({ is_deleted: false }).eq("id", id);
    toast({ title: "已恢复" });
    await fetchStudents();
  };

  return (
    <div>
      <PageHeader title="学生中心" description="管理学生信息" actions={
        <Button size="sm" variant={showDeleted ? "secondary" : "outline"} onClick={() => setShowDeleted(!showDeleted)}>
          {showDeleted ? "显示正常" : "回收站"}
        </Button>
      } />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="搜索学号或姓名..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">{showDeleted ? "回收站为空" : "暂无学生数据，请通过数据导入添加"}</div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">学号</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">姓名</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">专业</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">教学班</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{s.student_code}</td>
                    <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.major || "-"}</td>
                    <td className="px-4 py-3">{s.section_name && <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{s.section_name}</span>}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.is_deleted ? (
                          <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleRestore(s.id)}><RotateCcw className="h-3.5 w-3.5 mr-1" /> 恢复</Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate(`/students/${s.id}${s.section_id ? `?section=${s.section_id}` : ""}`)}>查看档案</Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>确认删除学生？</AlertDialogTitle><AlertDialogDescription>将软删除「{s.name}（{s.student_code}）」及其选课记录，可在回收站恢复</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(s.id, s.name)}>确认删除</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
