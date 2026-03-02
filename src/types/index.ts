// ===== Base Types =====
export interface Term {
  id: string;
  term_name: string;
}

export interface Course {
  id: string;
  course_name: string;
}

export interface ClassSection {
  id: string;
  term_id: string;
  course_id: string;
  section_name: string;
  class_key: string; // computed: term_name + course_name + section_name
}

export interface Student {
  id: string;
  student_code: string;
  name: string;
  major?: string;
  cohort?: string;
  cet_status?: string;
  semester_goal?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_section_id: string;
}

// ===== Scores =====
export interface CourseHistory {
  id: string;
  student_id: string;
  term_id: string;
  course_id: string;
  final_total: number;
}

export interface FormativeScore {
  id: string;
  student_id: string;
  term_id: string;
  course_id: string;
  class_section_id: string;
  qa_score: number;
  group_score: number;
  ideology_score: number;
  speaking_test_score: number;
  listening_test_score: number;
  homework_score: number;
  online_task_score: number;
  homework_score_override?: boolean;
}

export interface FinalExam {
  id: string;
  student_id: string;
  term_id: string;
  course_id: string;
  class_section_id: string;
  vocab: number;
  cloze: number;
  tf: number;
  match: number;
  deep: number;
  translation: number;
  writing: number;
}

export interface Homework {
  id: string;
  student_id: string;
  term_id: string;
  course_id: string;
  class_section_id: string;
  homework_no: number;
  score: number;
  submitted: boolean;
  on_time: boolean;
  revision_count: number;
  comment?: string;
  attachment_url?: string;
}

// ===== Growth Records =====
export interface GrowthType {
  id: string;
  key: string;
  display_name: string;
  is_builtin: boolean;
  is_enabled: boolean;
  sort_order: number;
}

export interface Tag {
  id: string;
  key: string;
  display_name: string;
  group_name: string;
  is_builtin: boolean;
  is_enabled: boolean;
  sort_order: number;
}

export interface GrowthLog {
  id: string;
  student_id: string;
  term_id: string;
  course_id?: string;
  class_section_id?: string;
  record_date: string;
  type_id: string;
  content: string;
  attachment_url?: string;
  tag_ids: string[];
}

// ===== Computed helpers =====
export function calcFormativeTotal(s: FormativeScore): number {
  return +(
    s.qa_score * 0.05 +
    s.group_score * 0.05 +
    s.ideology_score * 0.05 +
    s.speaking_test_score * 0.05 +
    s.listening_test_score * 0.05 +
    s.homework_score * 0.10 +
    s.online_task_score * 0.15
  ).toFixed(1);
}

export function calcFinalExamTotal(e: FinalExam): number {
  return e.vocab + e.cloze + e.tf + e.match + e.deep + e.translation + e.writing;
}

export function calcFinalWeighted(e: FinalExam): number {
  return +(calcFinalExamTotal(e) * 0.5).toFixed(1);
}

export function calcFinalTotal(formativeTotal: number, finalWeighted: number): number {
  return +(formativeTotal + finalWeighted).toFixed(1);
}

export function calcHomeworkAverage(homeworks: Homework[]): number {
  if (homeworks.length === 0) return 0;
  const sum = homeworks.reduce((a, h) => a + h.score, 0);
  return +(sum / homeworks.length).toFixed(1);
}

export function getScoreClass(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.85) return "score-excellent";
  if (pct >= 0.7) return "score-good";
  if (pct >= 0.6) return "score-warning";
  return "score-danger";
}
