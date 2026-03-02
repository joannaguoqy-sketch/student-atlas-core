import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const importTypes = [
  { key: "term", label: "Term 学期", required: ["term_name"] },
  { key: "course", label: "Course 课程", required: ["course_name"] },
  { key: "section", label: "ClassSection 教学班", required: ["term_name", "course_name", "section_name"] },
  { key: "student", label: "Student 学生", required: ["student_code", "name"] },
  { key: "enrollment", label: "Enrollment 选课名单", required: ["student_code", "term_name", "course_name", "section_name"] },
  { key: "history", label: "CourseHistory 历史总评", required: ["student_code", "term_name", "course_name", "final_total"] },
  { key: "formative", label: "FormativeScore 形成性", required: ["student_code", "term_name", "course_name", "section_name", "qa_score", "group_score", "ideology_score", "speaking_test_score", "listening_test_score", "online_task_score"] },
  { key: "final", label: "FinalExam 期末结构", required: ["student_code", "term_name", "course_name", "section_name", "vocab", "cloze", "tf", "match", "deep", "translation", "writing"] },
  { key: "homework", label: "Homework 作业明细", required: ["student_code", "term_name", "course_name", "section_name", "homework_no", "score"] },
];

export default function ImportPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const selected = importTypes.find((t) => t.key === selectedType);

  return (
    <div>
      <PageHeader title="数据导入" description="强校验模式：所有成绩类必须包含 student_code + term_name + course_name + section_name" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1 */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-3">① 选择导入类型</h3>
            <div className="space-y-1.5">
              {importTypes.map((t) => (
                <button
                  key={t.key}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedType === t.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-card-foreground"
                  }`}
                  onClick={() => { setSelectedType(t.key); setStep(2); }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Steps 2-5 */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              {/* Upload */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">② 上传文件</h3>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">拖拽 Excel/CSV 文件到此处</p>
                  <p className="text-xs text-muted-foreground mt-1">或点击选择文件</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1.5">
                    <FileSpreadsheet className="h-4 w-4" /> 选择文件
                  </Button>
                </div>
              </div>

              {/* Field mapping */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">③ 必填字段</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.required.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">{f}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">计算字段（formative_total / final_total 等）导入时自动忽略</p>
              </div>

              {/* Preview */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">④ 预览校验报告</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                    <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="text-lg font-bold text-success">0</p>
                    <p className="text-xs text-muted-foreground">新增</p>
                  </div>
                  <div className="p-3 rounded-lg bg-info/10 border border-info/20 text-center">
                    <CheckCircle2 className="h-5 w-5 text-info mx-auto mb-1" />
                    <p className="text-lg font-bold text-info">0</p>
                    <p className="text-xs text-muted-foreground">更新</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                    <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-1" />
                    <p className="text-lg font-bold text-warning">0</p>
                    <p className="text-xs text-muted-foreground">无法匹配</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                    <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                    <p className="text-lg font-bold text-destructive">0</p>
                    <p className="text-xs text-muted-foreground">异常值</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">上传文件后系统将自动校验，异常/缺失/重复将阻止导入</p>
              </div>

              {/* Strategy */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">⑤ 导入策略</h3>
                <div className="flex gap-4 mb-3">
                  {["仅新增", "仅更新", "合并(推荐)"].map((s, i) => (
                    <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="strategy" defaultChecked={i === 2} className="accent-primary" />
                      {s}
                    </label>
                  ))}
                </div>
                <Button disabled className="gap-1.5">
                  <Upload className="h-4 w-4" /> 开始导入
                </Button>
                <p className="text-xs text-muted-foreground mt-2">仅当无法匹配=0 且异常=0 时可点击</p>
              </div>
            </>
          )}

          {!selected && (
            <div className="bg-card rounded-lg border border-border p-10 text-center">
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">请先选择导入类型</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
