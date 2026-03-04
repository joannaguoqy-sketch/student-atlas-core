import { supabase } from "@/integrations/supabase/client";
import { calcFormativeTotal, calcFinalExamTotal, calcFinalWeighted, calcFinalTotal } from "@/types";
import type { FormativeScore, FinalExam } from "@/types";

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const BOM = "\uFEFF";
  const csv = BOM + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportStudentProfile(studentId: string, sectionId: string): Promise<void> {
  const [{ data: student }, { data: section }, { data: fs }, { data: fe }, { data: logs }, { data: hws }] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase.from("class_sections").select("*, terms(term_name), courses(course_name)").eq("id", sectionId).single(),
    supabase.from("formative_scores").select("*").eq("student_id", studentId).eq("class_section_id", sectionId).maybeSingle(),
    supabase.from("final_exams").select("*").eq("student_id", studentId).eq("class_section_id", sectionId).maybeSingle(),
    supabase.from("growth_logs").select("*, growth_types(display_name)").eq("student_id", studentId).eq("is_deleted", false).order("record_date", { ascending: false }),
    supabase.from("homeworks").select("*").eq("student_id", studentId).eq("class_section_id", sectionId).eq("is_deleted", false).order("homework_no"),
  ]);

  if (!student) throw new Error("学生未找到");

  const termName = (section as any)?.terms?.term_name || "";
  const courseName = (section as any)?.courses?.course_name || "";
  const sectionName = section?.section_name || "";

  const formativeTotal = fs ? calcFormativeTotal(fs as any) : 0;
  const finalExamTotal = fe ? calcFinalExamTotal(fe as any) : 0;
  const finalWeighted = fe ? calcFinalWeighted(fe as any) : 0;
  const total = calcFinalTotal(formativeTotal, finalWeighted);

  const headers = ["项目", "数值", "备注"];
  const rows: string[][] = [
    ["大学英语课程学生成长评价与管理平台 - 学生成长档案", "", ""],
    ["学生姓名", student.name, ""],
    ["学号", student.student_code, ""],
    ["专业", student.major || "-", ""],
    ["课程", courseName, ""],
    ["学期", termName, ""],
    ["教学班", sectionName, ""],
    ["", "", ""],
    ["=== 形成性评价（50%）===", "", ""],
  ];

  if (fs) {
    const f = fs as any;
    rows.push(
      ["个人问答", String(f.qa_score), "权重5%"],
      ["小组协作", String(f.group_score), "权重5%"],
      ["思想素养", String(f.ideology_score), "权重5%"],
      ["口语", String(f.speaking_test_score), "权重5%"],
      ["听力", String(f.listening_test_score), "权重5%"],
      ["作业", String(f.homework_score), "权重10%"],
      ["线上任务", String(f.online_task_score), "权重15%"],
      ["形成性总分", String(formativeTotal) + "/50", ""],
    );
  } else {
    rows.push(["暂无形成性评价数据", "", ""]);
  }

  rows.push(["", "", ""], ["=== 期末考试（50%）===", "", ""]);
  if (fe) {
    const e = fe as any;
    rows.push(
      ["词汇", String(e.vocab), "满分10"],
      ["选词填空", String(e.cloze), "满分10"],
      ["判断正误", String(e.tf), "满分10"],
      ["信息匹配", String(e.match), "满分20"],
      ["深度阅读", String(e.deep), "满分20"],
      ["翻译", String(e.translation), "满分15"],
      ["写作", String(e.writing), "满分15"],
      ["期末原始总分", String(finalExamTotal) + "/100", ""],
      ["期末折算", String(finalWeighted) + "/50", ""],
    );
  } else {
    rows.push(["暂无期末考试数据", "", ""]);
  }

  rows.push(["", "", ""], ["总评", String(total) + "/100", "形成性 + 期末折算"]);

  // Homework section
  if (hws && hws.length > 0) {
    rows.push(["", "", ""], ["=== 作业明细 ===", "", ""]);
    rows.push(["作业序号", "分数", "是否按时"]);
    hws.forEach((hw: any) => {
      rows.push([`作业${hw.homework_no}`, String(hw.score), hw.on_time ? "是" : "否"]);
    });
  }

  // Growth logs section
  if (logs && logs.length > 0) {
    rows.push(["", "", ""], ["=== 成长记录 ===", "", ""]);
    rows.push(["日期", "类型", "内容"]);
    for (const log of logs) {
      const { data: logTags } = await supabase
        .from("growth_log_tags")
        .select("tags(display_name)")
        .eq("growth_log_id", log.id);
      const tagNames = (logTags || []).map((t: any) => t.tags?.display_name).filter(Boolean).join("、");
      const typeName = (log as any).growth_types?.display_name || "";
      rows.push([log.record_date, typeName + (tagNames ? ` [${tagNames}]` : ""), log.content]);
    }
  }

  downloadCsv(`学生档案_${student.name}_${termName}.csv`, headers, rows);
}

export async function exportClassReport(sectionId: string): Promise<void> {
  const [{ data: section }, { data: enrollments }, { data: fs }, { data: fe }] = await Promise.all([
    supabase.from("class_sections").select("*, terms(term_name), courses(course_name)").eq("id", sectionId).single(),
    supabase.from("enrollments").select("student_id, students(name, student_code)").eq("class_section_id", sectionId).eq("is_deleted", false),
    supabase.from("formative_scores").select("*").eq("class_section_id", sectionId),
    supabase.from("final_exams").select("*").eq("class_section_id", sectionId),
  ]);

  if (!section) throw new Error("教学班未找到");

  const termName = (section as any)?.terms?.term_name || "";
  const courseName = (section as any)?.courses?.course_name || "";
  const fsMap = new Map((fs || []).map((f: any) => [f.student_id, f]));
  const feMap = new Map((fe || []).map((f: any) => [f.student_id, f]));

  const headers = ["学号", "姓名", "形成性/50", "期末折算/50", "总评/100"];
  const rows = (enrollments || []).map((e: any) => {
    const stu = e.students;
    const f = fsMap.get(e.student_id);
    const ex = feMap.get(e.student_id);
    const ft = f ? calcFormativeTotal(f as any) : 0;
    const fw = ex ? calcFinalWeighted(ex as any) : 0;
    const t = calcFinalTotal(ft, fw);
    return [stu?.student_code || "", stu?.name || "", String(ft), String(fw), String(t)];
  });

  downloadCsv(`班级报告_${courseName}_${section.section_name}_${termName}.csv`, headers, rows);
}

export async function exportCourseReport(courseId: string, termId: string): Promise<void> {
  const [{ data: course }, { data: term }, { data: sections }] = await Promise.all([
    supabase.from("courses").select("*").eq("id", courseId).single(),
    supabase.from("terms").select("*").eq("id", termId).single(),
    supabase.from("class_sections").select("*").eq("course_id", courseId).eq("term_id", termId).eq("is_deleted", false),
  ]);

  const headers = ["教学班", "学生数", "平均总评"];
  const rows: string[][] = [];

  for (const sec of sections || []) {
    const { count } = await supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("class_section_id", sec.id).eq("is_deleted", false);
    rows.push([sec.section_name, String(count || 0), "-"]);
  }

  downloadCsv(`课程报告_${course?.course_name || ""}_${term?.term_name || ""}.csv`, headers, rows);
}
