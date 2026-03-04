import * as XLSX from "xlsx";
import Papa from "papaparse";

export type ParsedRow = Record<string, string | number>;

export function parseExcelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<ParsedRow>(worksheet);
        resolve(json);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsBinaryString(file);
  });
}

export function parseCsvFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true, dynamicTyping: true,
      complete: (results) => resolve(results.data as ParsedRow[]),
      error: (err: Error) => reject(err),
    });
  });
}

export function parsePastedText(text: string): ParsedRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter);
    if (values.length === 0 || (values.length === 1 && !values[0].trim())) continue;
    const row: ParsedRow = {};
    headers.forEach((h, idx) => {
      const val = values[idx]?.trim() || "";
      const num = Number(val);
      row[h] = val !== "" && !isNaN(num) ? num : val;
    });
    rows.push(row);
  }
  return rows;
}

export interface ValidationError { row: number; field: string; reason: string; }
export interface ValidationResult { valid: boolean; errors: ValidationError[]; newCount: number; updateCount: number; }

const SCORE_RANGES: Record<string, [number, number]> = {
  qa: [0, 100], group: [0, 100], ideology: [0, 100], speaking: [0, 100],
  listening: [0, 100], homework: [0, 100], online: [0, 100],
  vocab: [0, 10], cloze: [0, 10], tf: [0, 10],
  match: [0, 20], deep: [0, 20], translation: [0, 15], writing: [0, 15],
};

const COMPUTED_FIELDS = ["formative_total", "final_exam_total", "final_weighted", "final_total"];

export function stripComputedFields(rows: ParsedRow[]): ParsedRow[] {
  return rows.map((row) => {
    const cleaned = { ...row };
    COMPUTED_FIELDS.forEach((f) => delete cleaned[f]);
    return cleaned;
  });
}

export function validateStudentImport(rows: ParsedRow[]): ValidationResult {
  const errors: ValidationError[] = [];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const lineNum = i + 2;
    if (!row.student_code || String(row.student_code).trim() === "") errors.push({ row: lineNum, field: "student_code", reason: "学号不能为空" });
    if (!row.name || String(row.name).trim() === "") errors.push({ row: lineNum, field: "name", reason: "姓名不能为空" });
    const code = String(row.student_code || "");
    if (seen.has(code)) errors.push({ row: lineNum, field: "student_code", reason: `学号 ${code} 重复` });
    seen.add(code);
  });
  return { valid: errors.length === 0, errors, newCount: rows.length, updateCount: 0 };
}

export function validateEnrollmentImport(rows: ParsedRow[]): ValidationResult {
  const errors: ValidationError[] = [];
  const required = ["student_code", "term_name", "course_name", "section_name"];
  rows.forEach((row, i) => {
    const lineNum = i + 2;
    required.forEach((f) => {
      if (!row[f] || String(row[f]).trim() === "") errors.push({ row: lineNum, field: f, reason: `${f} 不能为空` });
    });
  });
  return { valid: errors.length === 0, errors, newCount: rows.length, updateCount: 0 };
}

function validateScoreFields(rows: ParsedRow[], scoreFields: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const required = ["student_code", "term_name", "course_name", "section_name"];
  const seen = new Set<string>();
  rows.forEach((row, i) => {
    const lineNum = i + 2;
    required.forEach((f) => {
      if (!row[f] || String(row[f]).trim() === "") errors.push({ row: lineNum, field: f, reason: `${f} 不能为空` });
    });
    scoreFields.forEach((f) => {
      if (row[f] === undefined || row[f] === "") return; // optional in comprehensive
      const val = Number(row[f]);
      const range = SCORE_RANGES[f];
      if (range && (isNaN(val) || val < range[0] || val > range[1])) {
        errors.push({ row: lineNum, field: f, reason: `${f}=${row[f]} 超范围(${range[0]}-${range[1]})` });
      }
    });
    const key = `${row.student_code}_${row.term_name}_${row.course_name}_${row.section_name}`;
    if (seen.has(key)) errors.push({ row: lineNum, field: "student_code", reason: "重复主键(学号+学期+课程+教学班)" });
    seen.add(key);
  });
  return errors;
}

export function validateFormativeImport(rows: ParsedRow[]): ValidationResult {
  const errors = validateScoreFields(rows, ["qa", "group", "ideology", "speaking", "listening", "homework", "online"]);
  return { valid: errors.length === 0, errors, newCount: rows.length, updateCount: 0 };
}

export function validateFinalExamImport(rows: ParsedRow[]): ValidationResult {
  const errors = validateScoreFields(rows, ["vocab", "cloze", "tf", "match", "deep", "translation", "writing"]);
  return { valid: errors.length === 0, errors, newCount: rows.length, updateCount: 0 };
}

export function validateComprehensiveImport(rows: ParsedRow[]): ValidationResult {
  const allScoreFields = ["qa", "group", "ideology", "speaking", "listening", "homework", "online", "vocab", "cloze", "tf", "match", "deep", "translation", "writing"];
  const errors = validateScoreFields(rows, allScoreFields);
  return { valid: errors.length === 0, errors, newCount: rows.length, updateCount: 0 };
}
