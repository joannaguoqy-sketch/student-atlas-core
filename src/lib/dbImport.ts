import { supabase } from "@/integrations/supabase/client";
import type { ParsedRow } from "./importHelpers";

// Helper: get or create term
async function getOrCreateTerm(termName: string): Promise<string> {
  const { data: existing } = await supabase
    .from("terms")
    .select("id")
    .eq("term_name", termName)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("terms")
    .insert({ term_name: termName })
    .select("id")
    .single();
  if (error) throw new Error(`创建学期失败: ${error.message}`);
  return created.id;
}

// Helper: get or create course
async function getOrCreateCourse(courseName: string): Promise<string> {
  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("course_name", courseName)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("courses")
    .insert({ course_name: courseName })
    .select("id")
    .single();
  if (error) throw new Error(`创建课程失败: ${error.message}`);
  return created.id;
}

// Helper: get or create class section
async function getOrCreateSection(
  termId: string,
  courseId: string,
  sectionName: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("class_sections")
    .select("id")
    .eq("term_id", termId)
    .eq("course_id", courseId)
    .eq("section_name", sectionName)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("class_sections")
    .insert({ term_id: termId, course_id: courseId, section_name: sectionName })
    .select("id")
    .single();
  if (error) throw new Error(`创建教学班失败: ${error.message}`);
  return created.id;
}

// Helper: get student by code
async function getStudentByCode(code: string): Promise<string | null> {
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("student_code", String(code))
    .maybeSingle();
  return data?.id || null;
}

// Import students
export async function importStudents(rows: ParsedRow[]): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const code = String(row.student_code).trim();
    const name = String(row.name).trim();
    const major = row.major ? String(row.major).trim() : null;

    const existing = await getStudentByCode(code);
    if (existing) {
      // Update existing
      const { error } = await supabase
        .from("students")
        .update({ name, major })
        .eq("id", existing);
      if (error) errors.push(`学号${code}: ${error.message}`);
      else inserted++;
    } else {
      const { error } = await supabase
        .from("students")
        .insert({ student_code: code, name, major });
      if (error) errors.push(`学号${code}: ${error.message}`);
      else inserted++;
    }
  }

  return { inserted, errors };
}

// Import enrollments
export async function importEnrollments(rows: ParsedRow[]): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const termId = await getOrCreateTerm(String(row.term_name));
      const courseId = await getOrCreateCourse(String(row.course_name));
      const sectionId = await getOrCreateSection(termId, courseId, String(row.section_name));
      const studentId = await getStudentByCode(String(row.student_code));

      if (!studentId) {
        errors.push(`学号${row.student_code}: 学生不存在，请先导入学生名单`);
        continue;
      }

      const { error } = await supabase.from("enrollments").upsert(
        { student_id: studentId, class_section_id: sectionId },
        { onConflict: "student_id,class_section_id" }
      );
      if (error) errors.push(`学号${row.student_code}: ${error.message}`);
      else inserted++;
    } catch (e: any) {
      errors.push(`学号${row.student_code}: ${e.message}`);
    }
  }

  return { inserted, errors };
}

// Import formative scores
export async function importFormativeScores(rows: ParsedRow[]): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const termId = await getOrCreateTerm(String(row.term_name));
      const courseId = await getOrCreateCourse(String(row.course_name));
      const sectionId = await getOrCreateSection(termId, courseId, String(row.section_name));
      const studentId = await getStudentByCode(String(row.student_code));

      if (!studentId) {
        errors.push(`学号${row.student_code}: 学生不存在`);
        continue;
      }

      const { error } = await supabase.from("formative_scores").upsert(
        {
          student_id: studentId,
          term_id: termId,
          course_id: courseId,
          class_section_id: sectionId,
          qa_score: Number(row.qa),
          group_score: Number(row.group),
          ideology_score: Number(row.ideology),
          speaking_test_score: Number(row.speaking),
          listening_test_score: Number(row.listening),
          homework_score: Number(row.homework),
          online_task_score: Number(row.online),
        },
        { onConflict: "student_id,term_id,course_id,class_section_id" }
      );
      if (error) errors.push(`学号${row.student_code}: ${error.message}`);
      else inserted++;
    } catch (e: any) {
      errors.push(`学号${row.student_code}: ${e.message}`);
    }
  }

  return { inserted, errors };
}

// Import final exams
export async function importFinalExams(rows: ParsedRow[]): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const termId = await getOrCreateTerm(String(row.term_name));
      const courseId = await getOrCreateCourse(String(row.course_name));
      const sectionId = await getOrCreateSection(termId, courseId, String(row.section_name));
      const studentId = await getStudentByCode(String(row.student_code));

      if (!studentId) {
        errors.push(`学号${row.student_code}: 学生不存在`);
        continue;
      }

      const { error } = await supabase.from("final_exams").upsert(
        {
          student_id: studentId,
          term_id: termId,
          course_id: courseId,
          class_section_id: sectionId,
          vocab: Number(row.vocab),
          cloze: Number(row.cloze),
          tf: Number(row.tf),
          match: Number(row.match),
          deep: Number(row.deep),
          translation: Number(row.translation),
          writing: Number(row.writing),
        },
        { onConflict: "student_id,term_id,course_id,class_section_id" }
      );
      if (error) errors.push(`学号${row.student_code}: ${error.message}`);
      else inserted++;
    } catch (e: any) {
      errors.push(`学号${row.student_code}: ${e.message}`);
    }
  }

  return { inserted, errors };
}
