import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText, Users, BookOpen, GraduationCap } from "lucide-react";

const exportTypes = [
  { key: "student", label: "学生成长档案", desc: "单个学生的完整成长档案，包含评价、作业、成长记录和评语", icon: FileText, formats: ["PDF", "Word"] },
  { key: "class", label: "班级质量报告", desc: "教学班整体分析报告，包含KPI、分布图和学生列表", icon: Users, formats: ["PDF"] },
  { key: "course", label: "课程报告", desc: "课程级别分析，跨教学班对比", icon: BookOpen, formats: ["PDF"] },
  { key: "college", label: "学院报告", desc: "学院全局总览报告", icon: GraduationCap, formats: ["PDF"] },
];

export default function ExportPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="报告导出" description="生成真实文件并触发下载" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportTypes.map((t) => (
          <div
            key={t.key}
            className={`bg-card rounded-lg p-5 border cursor-pointer transition-all ${
              selected === t.key ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"
            }`}
            onClick={() => setSelected(t.key)}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <t.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground">{t.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                <div className="flex gap-2 mt-3">
                  {t.formats.map((f) => (
                    <Button key={f} size="sm" variant={selected === t.key ? "default" : "outline"} className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> {f}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
