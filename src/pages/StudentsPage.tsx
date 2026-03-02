import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudentRow {
  id: string;
  student_code: string;
  name: string;
  major: string | null;
  section_name?: string;
  section_id?: string;
}

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("student_code");
    if (error) {
      toast({ title: "加载学生失败", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Get enrollment info for each student
    const enriched = await Promise.all(
      (data || []).map(async (s) => {
        const { data: enr } = await supabase
          .from("enrollments")
          .select("class_section_id, class_sections(section_name)")
          .eq("student_id", s.id)
          .limit(1);
        const enrollment = enr?.[0];
        return {
          ...s,
          section_name: (enrollment as any)?.class_sections?.section_name || undefined,
          section_id: enrollment?.class_section_id || undefined,
        };
      })
    );
    setStudents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter(
    (s) => s.name.includes(query) || s.student_code.includes(query)
  );

  const handleDelete = async (id: string, name: string) => {
    await supabase.from("enrollments").delete().eq("student_id", id);
    await supabase.from("formative_scores").delete().eq("student_id", id);
    await supabase.from("final_exams").delete().eq("student_id", id);
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "删除成功", description: `已删除学生「${name}」` });
      await fetchStudents();
    }
  };

  return (
    <div>
      <PageHeader title="学生中心" description="管理学生信息，支持搜索和删除" />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索学号或姓名..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : students.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">暂无学生数据，请通过数据导入添加学生</div>
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
                    <td className="px-4 py-3">
                      {s.section_name && <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{s.section_name}</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => navigate(`/students/${s.id}${s.section_id ? `?section=${s.section_id}` : ""}`)}
                        >
                          查看档案
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除学生？</AlertDialogTitle>
                              <AlertDialogDescription>
                                将删除「{s.name}（{s.student_code}）」及其所有选课和成绩数据，此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(s.id, s.name)}>确认删除</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
