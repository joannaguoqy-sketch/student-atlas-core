import { supabase } from "@/integrations/supabase/client";
import type { ParsedRow } from "./importHelpers";

async function getOrCreateTerm(termName: string): Promise<string> {
  const { data: existing } = await supabase.from("terms").select("id").eq("term_name", termName).eq("is_deleted", false).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from("terms").insert({ term_name: termName }).select("id").single();
  if (error) throw new Error(`创建学期失败: ${error.message}`);
  return created.id;
}

async function getOrCreateCourse(courseName: string): Promise<string> {
  const { data: existing } = await supabase.from("courses").select("id").eq("course_name", courseName).eq("is_deleted", false).maybeSingle();
  if (existing) return existing.id;
  // Also check deleted and restore
  const { data: deleted } = await supabase.from("courses").select("id").eq("course_name", courseName).eq("is_deleted", true).maybeSingle();
  if (deleted) {
    await supabase.from("courses").update({ is_deleted: false }).eq("id", deleted.id);
    return deleted.id;
  }
  const { data: created, error } = await supabase.from("courses").insert({ course_name: courseName }).select("id").single();
  if (error) throw new Error(`创建课程失败: ${error.message}`);
  return created.id;
}

async function getOrCreateSection(termId: string, courseId: string, sectionName: string): Promise<string> {
  const { data: existing } = await supabase.from("class_sections").select("id").eq("term_id", termId).eq("course_id", courseId).eq("section_name", sectionName).eq("is_deleted", false).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from("class_sections").insert({ term_id: termId, course_id: courseId, section_name: sectionName }).select("id").single();
  if (error) throw new Error(`创建教学班失败: ${error.message}`);
  return created.id;
}

async function getOrCreateStudent(code: string, name?: string, major?: string): Promise<string> {
  const { data: existing } = await supabase.from("students").select("id").eq("student_code", String(code)).maybeSingle();
  if (existing) {
    // Update if name/major provided
    const updates: any = {};
    if (name) updates.name = name;
    if (major) updates.major = major;
    updates.is_deleted = false;
    if (Object.keys(updates).length > 0) {
      await supabase.from("students").update(updates).eq("id", existing.id);
    }
    return existing.id;
  }
  const { data: created, error } = await supabase.from("students").insert({ student_code: String(code), name: name || String(code), major: major || null }).select("id").single();
  if (error) throw new Error(`创建学生失败: ${error.message}`);
  return created.id;
}

async function upsertEnrollment(studentId: string, sectionId: string) {
  // Check existing (including deleted)
  const { data: existing } = await supabase.from("enrollments").select("id, is_deleted").eq("student_id", studentId).eq("class_section_id", sectionId).maybeSingle();
  if (existing) {
    if (existing.is_deleted) {
      await supabase.from("enrollments").update({ is_deleted: false }).eq("id", existing.id);
    }
    return;
  }
  const { error } = await supabase.from("enrollments").insert({ student_id: studentId, class_section_id: sectionId });
  if (error && !error.message.includes("duplicate")) throw error;
}

// Import students
export async function importStudents(rows: ParsedRow[]): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];
  for (const row of rows) {
    try {
      await getOrCreateStudent(String(row.student_code).trim(), row.name ? String(row.name).trim() : undefined, row.major ? String(row.major).trim() : undefined);
      inserted++;
    } catch (e: any) {
      errors.push(`学号${row.student_code}: ${e.message}`);
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
      const studentId = await getOrCreateStudent(String(row.student_code), row.name ? String(row.name).trim() : undefined);
      await upsertEnrollment(studentId, sectionId);
      inserted++;
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
      const studentId = await getOrCreateStudent(String(row.student_code), row.name ? String(row.name).trim() : undefined);
      await upsertEnrollment(studentId, sectionId);
      const { error } = await supabase.from("formative_scores").upsert({
        student_id: studentId, term_id: termId, course_id: courseId, class_section_id: sectionId,
        qa_score: Number(row.qa) || 0, group_score: Number(row.group) || 0, ideology_score: Number(row.ideology) || 0,
        speaking_test_score: Number(row.speaking) || 0, listening_test_score: Number(row.listening) || 0,
        homework_score: Number(row.homework) || 0, online_task_score: Number(row.online) || 0,
      }, { onConflict: "student_id,term_id,course_id,class_section_id" });
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
      const studentId = await getOrCreateStudent(String(row.student_code), row.name ? String(row.name).trim() : undefined);
      await upsertEnrollment(studentId, sectionId);
      const { error } = await supabase.from("final_exams").upsert({
        student_id: studentId, term_id: termId, course_id: courseId, class_section_id: sectionId,
        vocab: Number(row.vocab) || 0, cloze: Number(row.cloze) || 0, tf: Number(row.tf) || 0,
        match: Number(row.match) || 0, deep: Number(row.deep) || 0,
        translation: Number(row.translation) || 0, writing: Number(row.writing) || 0,
      }, { onConflict: "student_id,term_id,course_id,class_section_id" });
      if (error) errors.push(`学号${row.student_code}: ${error.message}`);
      else inserted++;
    } catch (e: any) {
      errors.push(`学号${row.student_code}: ${e.message}`);
    }
  }
  return { inserted, errors };
}

// Comprehensive import - handles all types in one file
export async function importComprehensive(rows: ParsedRow[]): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const termId = await getOrCreateTerm(String(row.term_name));
      const courseId = await getOrCreateCourse(String(row.course_name));
      const sectionId = await getOrCreateSection(termId, courseId, String(row.section_name));
      const studentId = await getOrCreateStudent(
        String(row.student_code).trim(),
        row.name ? String(row.name).trim() : undefined,
        row.major ? String(row.major).trim() : undefined,
      );
      await upsertEnrollment(studentId, sectionId);

      // Check if formative fields exist
      const hasFormative = ["qa", "group", "ideology", "speaking", "listening", "homework", "online"].some(f => row[f] !== undefined && row[f] !== "");
      if (hasFormative) {
        const { error } = await supabase.from("formative_scores").upsert({
          student_id: studentId, term_id: termId, course_id: courseId, class_section_id: sectionId,
          qa_score: Number(row.qa) || 0, group_score: Number(row.group) || 0, ideology_score: Number(row.ideology) || 0,
          speaking_test_score: Number(row.speaking) || 0, listening_test_score: Number(row.listening) || 0,
          homework_score: Number(row.homework) || 0, online_task_score: Number(row.online) || 0,
        }, { onConflict: "student_id,term_id,course_id,class_section_id" });
        if (error) errors.push(`学号${row.student_code} 形成性: ${error.message}`);
      }

      // Check if final exam fields exist
      const hasFinal = ["vocab", "cloze", "tf", "match", "deep", "translation", "writing"].some(f => row[f] !== undefined && row[f] !== "");
      if (hasFinal) {
        const { error } = await supabase.from("final_exams").upsert({
          student_id: studentId, term_id: termId, course_id: courseId, class_section_id: sectionId,
          vocab: Number(row.vocab) || 0, cloze: Number(row.cloze) || 0, tf: Number(row.tf) || 0,
          match: Number(row.match) || 0, deep: Number(row.deep) || 0,
          translation: Number(row.translation) || 0, writing: Number(row.writing) || 0,
        }, { onConflict: "student_id,term_id,course_id,class_section_id" });
        if (error) errors.push(`学号${row.student_code} 期末: ${error.message}`);
      }

      inserted++;
    } catch (e: any) {
      errors.push(`学号${row.student_code}: ${e.message}`);
    }
  }
  return { inserted, errors };
}
