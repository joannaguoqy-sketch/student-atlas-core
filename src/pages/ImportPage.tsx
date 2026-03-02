import { useState, useRef, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  parseExcelFile, parseCsvFile, parsePastedText, stripComputedFields,
  validateStudentImport, validateEnrollmentImport, validateFormativeImport, validateFinalExamImport,
  type ParsedRow, type ValidationResult,
} from "@/lib/importHelpers";
import { importStudents, importEnrollments, importFormativeScores, importFinalExams } from "@/lib/dbImport";

const importTypes = [
  {
    key: "student",
    label: "学生名单导入",
    required: ["student_code", "name"],
    optional: ["major"],
    example: "student_code\tname\tmajor\n20230001\t张三\t计算机科学",
  },
  {
    key: "enrollment",
    label: "教学班名单导入",
    required: ["term_name", "course_name", "section_name", "student_code"],
    optional: [],
    example: "student_code\tterm_name\tcourse_name\tsection_name\n20230001\t2025-2026-2\t大学英语4\t教学班1",
  },
  {
    key: "formative",
    label: "形成性评价导入",
    required: ["term_name", "course_name", "section_name", "student_code", "qa", "group", "ideology", "speaking", "listening", "homework", "online"],
    optional: [],
    example: "student_code\tterm_name\tcourse_name\tsection_name\tqa\tgroup\tideology\tspeaking\tlistening\thomework\tonline\n20230001\t2025-2026-2\t大学英语4\t教学班1\t85\t90\t88\t72\t65\t80\t92",
  },
  {
    key: "final",
    label: "期末结构导入",
    required: ["term_name", "course_name", "section_name", "student_code", "vocab", "cloze", "tf", "match", "deep", "translation", "writing"],
    optional: [],
    example: "student_code\tterm_name\tcourse_name\tsection_name\tvocab\tcloze\ttf\tmatch\tdeep\ttranslation\twriting\n20230001\t2025-2026-2\t大学英语4\t教学班1\t8\t7\t9\t16\t15\t12\t13",
  },
];

export default function ImportPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);
  const [inputMethod, setInputMethod] = useState("paste");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = importTypes.find((t) => t.key === selectedType);

  const handleValidate = useCallback((rows: ParsedRow[]) => {
    const cleaned = stripComputedFields(rows);
    setParsedData(cleaned);
    
    if (!selectedType) return;
    
    let result: ValidationResult;
    switch (selectedType) {
      case "student": result = validateStudentImport(cleaned); break;
      case "enrollment": result = validateEnrollmentImport(cleaned); break;
      case "formative": result = validateFormativeImport(cleaned); break;
      case "final": result = validateFinalExamImport(cleaned); break;
      default: return;
    }
    setValidation(result);
  }, [selectedType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      let rows: ParsedRow[];
      if (file.name.endsWith(".csv")) {
        rows = await parseCsvFile(file);
      } else {
        rows = await parseExcelFile(file);
      }
      handleValidate(rows);
      toast({ title: "文件解析成功", description: `共 ${rows.length} 行数据` });
    } catch (err: any) {
      toast({ title: "文件解析失败", description: err.message, variant: "destructive" });
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = () => {
    if (!pasteText.trim()) {
      toast({ title: "请粘贴数据", variant: "destructive" });
      return;
    }
    const rows = parsePastedText(pasteText);
    if (rows.length === 0) {
      toast({ title: "未解析到有效数据", description: "请检查格式（制表符或逗号分隔）", variant: "destructive" });
      return;
    }
    handleValidate(rows);
    toast({ title: "粘贴解析成功", description: `共 ${rows.length} 行数据` });
  };

  const handleImport = async () => {
    if (!selectedType || parsedData.length === 0 || !validation?.valid) return;
    
    setImporting(true);
    try {
      let result: { inserted: number; errors: string[] };
      switch (selectedType) {
        case "student": result = await importStudents(parsedData); break;
        case "enrollment": result = await importEnrollments(parsedData); break;
        case "formative": result = await importFormativeScores(parsedData); break;
        case "final": result = await importFinalExams(parsedData); break;
        default: return;
      }
      
      if (result.errors.length > 0) {
        toast({
          title: `导入完成，${result.errors.length} 个错误`,
          description: result.errors.slice(0, 3).join("; "),
          variant: "destructive",
        });
      } else {
        toast({ title: "导入成功", description: `成功处理 ${result.inserted} 条记录` });
      }
      // Reset
      setParsedData([]);
      setValidation(null);
      setPasteText("");
    } catch (err: any) {
      toast({ title: "导入失败", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <PageHeader title="数据导入" description="强校验模式：所有成绩类必须包含 student_code + term_name + course_name + section_name" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Type selection */}
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
                  onClick={() => {
                    setSelectedType(t.key);
                    setParsedData([]);
                    setValidation(null);
                    setPasteText("");
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Steps 2-5 */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              {/* Required fields */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">② 必填字段</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.required.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">{f}</span>
                  ))}
                  {selected.optional.map((f) => (
                    <span key={f} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-medium">{f}(可选)</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">计算字段（formative_total / final_total 等）导入时自动忽略</p>
              </div>

              {/* Data input */}
              <div className="bg-card rounded-lg border border-border p-5">
                <h3 className="text-sm font-semibold text-card-foreground mb-3">③ 输入数据</h3>
                <Tabs value={inputMethod} onValueChange={setInputMethod}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="paste">直接粘贴表格</TabsTrigger>
                    <TabsTrigger value="excel">上传 Excel</TabsTrigger>
                    <TabsTrigger value="csv">上传 CSV</TabsTrigger>
                  </TabsList>

                  <TabsContent value="paste">
                    <Textarea
                      placeholder={`从 Excel 复制数据后粘贴到此处（Ctrl+V），系统自动识别制表符分隔\n\n示例：\n${selected.example}`}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      className="min-h-[180px] font-mono text-xs"
                    />
                    <Button size="sm" className="mt-3 gap-1.5" onClick={handlePaste}>
                      <FileSpreadsheet className="h-4 w-4" /> 解析粘贴数据
                    </Button>
                  </TabsContent>

                  <TabsContent value="excel">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">选择 .xlsx / .xls 文件</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <FileSpreadsheet className="h-4 w-4" /> 选择文件
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="csv">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">选择 .csv 文件</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <FileSpreadsheet className="h-4 w-4" /> 选择文件
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Data preview */}
              {parsedData.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-card-foreground mb-3">④ 数据预览（前5行）</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">#</th>
                          {Object.keys(parsedData[0]).map((k) => (
                            <th key={k} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="px-2 py-1.5">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">共 {parsedData.length} 行</p>
                </div>
              )}

              {/* Validation report */}
              {validation && (
                <div className="bg-card rounded-lg border border-border p-5">
                  <h3 className="text-sm font-semibold text-card-foreground mb-3">⑤ 校验报告</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                      <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                      <p className="text-lg font-bold text-success">{validation.newCount}</p>
                      <p className="text-xs text-muted-foreground">待处理</p>
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                      <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
                      <p className="text-lg font-bold text-destructive">{validation.errors.length}</p>
                      <p className="text-xs text-muted-foreground">校验错误</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${validation.valid ? "bg-success/10 border border-success/20" : "bg-warning/10 border border-warning/20"}`}>
                      {validation.valid ? (
                        <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-1" />
                      )}
                      <p className={`text-lg font-bold ${validation.valid ? "text-success" : "text-warning"}`}>
                        {validation.valid ? "通过" : "未通过"}
                      </p>
                      <p className="text-xs text-muted-foreground">校验状态</p>
                    </div>
                  </div>

                  {validation.errors.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-2 py-1 text-left font-medium text-muted-foreground">行号</th>
                            <th className="px-2 py-1 text-left font-medium text-muted-foreground">字段</th>
                            <th className="px-2 py-1 text-left font-medium text-muted-foreground">原因</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validation.errors.map((e, i) => (
                            <tr key={i} className="border-b border-border last:border-0">
                              <td className="px-2 py-1 text-destructive">{e.row}</td>
                              <td className="px-2 py-1 font-medium">{e.field}</td>
                              <td className="px-2 py-1 text-muted-foreground">{e.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4">
                    <Button
                      disabled={!validation.valid || importing}
                      onClick={handleImport}
                      className="gap-1.5"
                    >
                      {importing ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> 导入中...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> 开始导入</>
                      )}
                    </Button>
                    {!validation.valid && (
                      <p className="text-xs text-destructive mt-2">校验未通过，请修正错误后重新上传</p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
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
