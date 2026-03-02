import PageHeader from "@/components/PageHeader";
import KpiCard from "@/components/KpiCard";
import { BookOpen, BarChart3 } from "lucide-react";
import { courses, terms, classSections, formativeScores, finalExams, students } from "@/data/mockData";
import { calcFormativeTotal, calcFinalWeighted, calcFinalTotal } from "@/types";
import { useNavigate } from "react-router-dom";

export default function CoursesPage() {
  const navigate = useNavigate();
  const currentTerm = terms.find(t => t.id === "t6")!;

  const courseStats = courses.map(course => {
    const sections = classSections.filter(cs => cs.course_id === course.id && cs.term_id === currentTerm.id);
    const studentScores = students.map(s => {
      const fs = formativeScores.find(f => f.student_id === s.id && f.course_id === course.id);
      const fe = finalExams.find(f => f.student_id === s.id && f.course_id === course.id);
      if (!fs || !fe) return null;
      return calcFinalTotal(calcFormativeTotal(fs), calcFinalWeighted(fe));
    }).filter((v): v is number => v !== null);

    const avg = studentScores.length > 0
      ? +(studentScores.reduce((a, b) => a + b, 0) / studentScores.length).toFixed(1)
      : 0;

    return { course, sections, studentCount: studentScores.length, avg };
  });

  return (
    <div>
      <PageHeader title="课程中心" description={`${currentTerm.term_name} 学期`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courseStats.map(({ course, sections, studentCount, avg }) => (
          <div
            key={course.id}
            className="bg-card rounded-lg p-5 border border-border hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => sections.length > 0 ? navigate("/sections") : undefined}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{course.course_name}</h3>
                  <p className="text-xs text-muted-foreground">{sections.length} 个教学班 · {studentCount} 名学生</p>
                </div>
              </div>
              {avg > 0 && (
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{avg}</p>
                  <p className="text-xs text-muted-foreground">平均总评</p>
                </div>
              )}
            </div>
            {sections.length > 0 && (
              <div className="flex gap-2 mt-3">
                {sections.map(s => (
                  <span key={s.id} className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                    {s.section_name}
                  </span>
                ))}
              </div>
            )}
            {sections.length === 0 && (
              <p className="text-xs text-muted-foreground italic">本学期暂无教学班</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
