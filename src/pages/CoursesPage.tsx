import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { BookOpen, Plus, Users, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface CourseStats {
  id: string;
  course_name: string;
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

  const fetchData = async () => {
    setLoading(true);
    const { data: courses } = await supabase.from("courses").select("*").order("course_name");
    if (!courses) { setLoading(false); return; }

    const stats: CourseStats[] = await Promise.all(
      courses.map(async (course) => {
        const { data: sections } = await supabase
          .from("class_sections")
          .select("id, section_name, terms(term_name)")
          .eq("course_id", course.id);

        const sectionIds = (sections || []).map((s) => s.id);
        let studentCount = 0;
        if (sectionIds.length > 0) {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .in("class_section_id", sectionIds);
          studentCount = count || 0;
        }

        // Calculate avg final_total
        let avg = 0;
        if (sectionIds.length > 0) {
          const { data: fs } = await supabase.from("formative_scores").select("*").in("class_section_id", sectionIds);
          const { data: fe } = await supabase.from("final_exams").select("*").in("class_section_id", sectionIds);
          const fsMap = new Map((fs || []).map((f) => [f.student_id, f]));
          const scores: number[] = [];
          (fe || []).forEach((e) => {
            const f = fsMap.get(e.student_id);
            const formativeTotal = f
              ? +(f.qa_score * 0.05 + f.group_score * 0.05 + f.ideology_score * 0.05 +
                  f.speaking_test_score * 0.05 + f.listening_test_score * 0.05 +
                  f.homework_score * 0.10 + f.online_task_score * 0.15).toFixed(1)
              : 0;
            const examTotal = e.vocab + e.cloze + e.tf + e.match + e.deep + e.translation + e.writing;
            scores.push(+(formativeTotal + examTotal * 0.5).toFixed(1));
          });
          if (scores.length > 0) avg = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        }

        return {
          id: course.id,
          course_name: course.course_name,
          sectionCount: sections?.length || 0,
          studentCount,
          avg,
          sections: (sections || []).map((s: any) => ({
            id: s.id,
            section_name: s.section_name,
            term_name: s.terms?.term_name || "",
          })),
        };
      })
    );
    setCourseStats(stats);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddSection = async (courseId: string) => {
    setAdding(courseId);
    // Get or create default term
    let termId: string;
    const { data: terms } = await supabase.from("terms").select("id").limit(1);
    if (terms && terms.length > 0) {
      termId = terms[0].id;
    } else {
      const { data: nt, error } = await supabase.from("terms").insert({ term_name: "2025-2026-2" }).select("id").single();
      if (error || !nt) { toast({ title: "创建学期失败", variant: "destructive" }); setAdding(null); return; }
      termId = nt.id;
    }

    const cs = courseStats.find((c) => c.id === courseId);
    const nextNum = (cs?.sectionCount || 0) + 1;
    const sectionName = `教学班${nextNum}`;

    const { error } = await supabase.from("class_sections").insert({
      term_id: termId,
      course_id: courseId,
      section_name: sectionName,
    });
    if (error) {
      toast({ title: "创建教学班失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "创建成功", description: `已创建「${sectionName}」` });
      await fetchData();
    }
    setAdding(null);
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="课程中心" description="管理课程与教学班" />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="课程中心" description="管理课程与教学班" />
      {courseStats.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">暂无课程数据，请通过数据导入创建</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courseStats.map((cs) => (
            <div key={cs.id} className="bg-card rounded-lg p-5 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{cs.course_name}</h3>
                    <p className="text-xs text-muted-foreground">{cs.sectionCount} 个教学班 · {cs.studentCount} 名学生</p>
                  </div>
                </div>
                {cs.avg > 0 ? (
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{cs.avg}</p>
                    <p className="text-xs text-muted-foreground">平均总评</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">暂无成绩</p>
                )}
              </div>

              {cs.sections.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {cs.sections.map((s) => (
                    <button
                      key={s.id}
                      className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                      onClick={() => navigate(`/analysis?section=${s.id}`)}
                    >
                      {s.section_name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/sections")}>
                  <Users className="h-3.5 w-3.5" /> 管理教学班
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleAddSection(cs.id)}
                  disabled={adding === cs.id}
                >
                  {adding === cs.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  新建教学班
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
