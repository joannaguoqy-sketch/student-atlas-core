import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Upload, Download } from "lucide-react";
import { classSections, getSectionStudentCount, getTermById, getCourseById } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

export default function SectionsPage() {
  const navigate = useNavigate();
  const currentSections = classSections.filter(cs => cs.term_id === "t6");

  return (
    <div>
      <PageHeader
        title="教学班管理"
        description="2025-2026-2 学期 · 大学英语4"
        actions={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> 新建教学班
          </Button>
        }
      />

      <div className="space-y-3">
        {currentSections.map((section) => {
          const term = getTermById(section.term_id);
          const course = getCourseById(section.course_id);
          const count = getSectionStudentCount(section.id);
          return (
            <div key={section.id} className="bg-card rounded-lg p-5 border border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{section.section_name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{section.section_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {course?.course_name} · {term?.term_name} · {count} 名学生
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/analysis?section=${section.id}`)}>
                  <Eye className="h-3.5 w-3.5" /> 查看
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/import")}>
                  <Upload className="h-3.5 w-3.5" /> 导入
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> 导出报告
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
