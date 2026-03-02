import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Upload, Download, Pencil, Check, X } from "lucide-react";
import { classSections, getSectionStudentCount, getTermById, getCourseById } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function SectionsPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState(classSections.filter(cs => cs.term_id === "t6"));
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleStartRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const handleConfirmRename = (id: string) => {
    if (!renameValue.trim()) {
      toast({ title: "名称不能为空", variant: "destructive" });
      return;
    }
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, section_name: renameValue.trim() } : s
    ));
    setRenamingId(null);
    toast({ title: "重命名成功", description: `教学班已重命名为「${renameValue.trim()}」` });
  };

  const handleAddSection = () => {
    const nextNum = sections.length + 1;
    const newSection = {
      id: `cs_new_${Date.now()}`,
      term_id: "t6",
      course_id: "c4",
      section_name: `教学班${nextNum}`,
      class_key: `2025-2026-2_大学英语4_教学班${nextNum}`,
    };
    setSections(prev => [...prev, newSection]);
    toast({ title: "创建成功", description: `已创建「教学班${nextNum}」` });
  };

  return (
    <div>
      <PageHeader
        title="教学班管理"
        description="2025-2026-2 学期 · 大学英语4"
        actions={
          <Button size="sm" className="gap-1.5" onClick={handleAddSection}>
            <Plus className="h-4 w-4" /> 新建教学班
          </Button>
        }
      />

      <div className="space-y-3">
        {sections.map((section) => {
          const term = getTermById(section.term_id);
          const course = getCourseById(section.course_id);
          const count = getSectionStudentCount(section.id);
          const isRenaming = renamingId === section.id;

          return (
            <div key={section.id} className="bg-card rounded-lg p-5 border border-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{section.section_name.charAt(0)}</span>
                </div>
                <div>
                  {isRenaming ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-8 w-40 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmRename(section.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleConfirmRename(section.id)}>
                        <Check className="h-4 w-4 text-success" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setRenamingId(null)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <h3 className="font-semibold text-card-foreground">{section.section_name}</h3>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {course?.course_name} · {term?.term_name} · {count} 名学生
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleStartRename(section.id, section.section_name)}>
                  <Pencil className="h-3.5 w-3.5" /> 重命名
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/analysis?section=${section.id}`)}>
                  <Eye className="h-3.5 w-3.5" /> 查看
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/import")}>
                  <Upload className="h-3.5 w-3.5" /> 导入
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate("/export")}>
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
