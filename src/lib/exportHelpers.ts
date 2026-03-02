import jsPDF from "jspdf";
import "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

// Extend jsPDF with autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Helper to draw Chinese text (jsPDF default font doesn't support CJK well, we use a workaround)
function setupPdf(): jsPDF {
  const doc = new jsPDF();
  // Use helvetica as fallback; for full CJK support, a custom font would be needed
  doc.setFont("helvetica");
  return doc;
}

export async function exportStudentProfile(studentId: string, sectionId: string): Promise<void> {
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!student) throw new Error("Student not found");

  const { data: section } = await supabase
    .from("class_sections")
    .select("*, terms(term_name), courses(course_name)")
    .eq("id", sectionId)
    .single();

  const { data: fs } = await supabase
    .from("formative_scores")
    .select("*")
    .eq("student_id", studentId)
    .eq("class_section_id", sectionId)
    .maybeSingle();

  const { data: fe } = await supabase
    .from("final_exams")
    .select("*")
    .eq("student_id", studentId)
    .eq("class_section_id", sectionId)
    .maybeSingle();

  const doc = setupPdf();
  let y = 20;

  // Title
  doc.setFontSize(16);
  doc.text("Student Growth Profile", 14, y);
  y += 10;
  doc.setFontSize(10);
  doc.text(`Student: ${student.name} (${student.student_code})`, 14, y);
  y += 6;
  const termName = (section as any)?.terms?.term_name || "";
  const courseName = (section as any)?.courses?.course_name || "";
  doc.text(`${courseName} / ${termName} / ${section?.section_name || ""}`, 14, y);
  y += 6;
  if (student.major) doc.text(`Major: ${student.major}`, 14, y);
  y += 10;

  // Formative scores
  if (fs) {
    doc.setFontSize(12);
    doc.text("Formative Assessment (50%)", 14, y);
    y += 6;
    const formativeTotal = +(
      fs.qa_score * 0.05 + fs.group_score * 0.05 + fs.ideology_score * 0.05 +
      fs.speaking_test_score * 0.05 + fs.listening_test_score * 0.05 +
      fs.homework_score * 0.10 + fs.online_task_score * 0.15
    ).toFixed(1);

    doc.autoTable({
      startY: y,
      head: [["Item", "Score (0-100)", "Weight"]],
      body: [
        ["QA", String(fs.qa_score), "5%"],
        ["Group", String(fs.group_score), "5%"],
        ["Ideology", String(fs.ideology_score), "5%"],
        ["Speaking", String(fs.speaking_test_score), "5%"],
        ["Listening", String(fs.listening_test_score), "5%"],
        ["Homework", String(fs.homework_score), "10%"],
        ["Online", String(fs.online_task_score), "15%"],
        ["Total", String(formativeTotal) + "/50", "50%"],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Final exam
  if (fe) {
    doc.setFontSize(12);
    doc.text("Final Exam (50%)", 14, y);
    y += 6;
    const examTotal = fe.vocab + fe.cloze + fe.tf + fe.match + fe.deep + fe.translation + fe.writing;
    const weighted = +(examTotal * 0.5).toFixed(1);

    doc.autoTable({
      startY: y,
      head: [["Item", "Score", "Max"]],
      body: [
        ["Vocab", String(fe.vocab), "10"],
        ["Cloze", String(fe.cloze), "10"],
        ["T/F", String(fe.tf), "10"],
        ["Match", String(fe.match), "20"],
        ["Deep Reading", String(fe.deep), "20"],
        ["Translation", String(fe.translation), "15"],
        ["Writing", String(fe.writing), "15"],
        ["Total", String(examTotal) + "/100", ""],
        ["Weighted", String(weighted) + "/50", ""],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Final total
  if (fs && fe) {
    const formativeTotal = +(
      fs.qa_score * 0.05 + fs.group_score * 0.05 + fs.ideology_score * 0.05 +
      fs.speaking_test_score * 0.05 + fs.listening_test_score * 0.05 +
      fs.homework_score * 0.10 + fs.online_task_score * 0.15
    ).toFixed(1);
    const examTotal = fe.vocab + fe.cloze + fe.tf + fe.match + fe.deep + fe.translation + fe.writing;
    const weighted = +(examTotal * 0.5).toFixed(1);
    const total = +(formativeTotal + weighted).toFixed(1);
    
    doc.setFontSize(14);
    doc.text(`Final Total: ${total}/100`, 14, y);
  }

  const fileName = `Student_Profile_${student.name}_${termName}.pdf`;
  doc.save(fileName);
}

export async function exportClassReport(sectionId: string): Promise<void> {
  const { data: section } = await supabase
    .from("class_sections")
    .select("*, terms(term_name), courses(course_name)")
    .eq("id", sectionId)
    .single();

  if (!section) throw new Error("Section not found");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, students(name, student_code)")
    .eq("class_section_id", sectionId);

  const studentIds = enrollments?.map((e) => e.student_id) || [];

  const { data: formativeData } = await supabase
    .from("formative_scores")
    .select("*")
    .eq("class_section_id", sectionId);

  const { data: finalData } = await supabase
    .from("final_exams")
    .select("*")
    .eq("class_section_id", sectionId);

  const doc = setupPdf();
  let y = 20;

  const termName = (section as any)?.terms?.term_name || "";
  const courseName = (section as any)?.courses?.course_name || "";

  doc.setFontSize(16);
  doc.text("Class Quality Report", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`${courseName} / ${termName} / ${section.section_name}`, 14, y);
  y += 6;
  doc.text(`Students: ${studentIds.length}`, 14, y);
  y += 10;

  // Student scores table
  const rows = (enrollments || []).map((e) => {
    const student = (e as any).students;
    const fs = formativeData?.find((f) => f.student_id === e.student_id);
    const fe = finalData?.find((f) => f.student_id === e.student_id);
    
    let formativeTotal = 0;
    let examWeighted = 0;
    
    if (fs) {
      formativeTotal = +(
        fs.qa_score * 0.05 + fs.group_score * 0.05 + fs.ideology_score * 0.05 +
        fs.speaking_test_score * 0.05 + fs.listening_test_score * 0.05 +
        fs.homework_score * 0.10 + fs.online_task_score * 0.15
      ).toFixed(1);
    }
    
    if (fe) {
      const total = fe.vocab + fe.cloze + fe.tf + fe.match + fe.deep + fe.translation + fe.writing;
      examWeighted = +(total * 0.5).toFixed(1);
    }

    const finalTotal = +(formativeTotal + examWeighted).toFixed(1);

    return [
      student?.student_code || "",
      student?.name || "",
      String(formativeTotal),
      String(examWeighted),
      String(finalTotal),
    ];
  });

  doc.autoTable({
    startY: y,
    head: [["Student Code", "Name", "Formative/50", "Final/50", "Total/100"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 8 },
  });

  const fileName = `Class_Report_${courseName}_${section.section_name}.pdf`;
  doc.save(fileName);
}

export async function exportCourseReport(courseId: string, termId: string): Promise<void> {
  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  const { data: term } = await supabase.from("terms").select("*").eq("id", termId).single();
  const { data: sections } = await supabase
    .from("class_sections")
    .select("*")
    .eq("course_id", courseId)
    .eq("term_id", termId);

  const doc = setupPdf();
  let y = 20;
  doc.setFontSize(16);
  doc.text("Course Report", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`${course?.course_name || ""} / ${term?.term_name || ""}`, 14, y);
  y += 6;
  doc.text(`Sections: ${sections?.length || 0}`, 14, y);
  y += 10;

  for (const section of sections || []) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_section_id", section.id);

    doc.setFontSize(11);
    doc.text(`${section.section_name}: ${enrollments?.length || 0} students`, 14, y);
    y += 8;
  }

  doc.save(`Course_Report_${course?.course_name || "course"}_${term?.term_name || ""}.pdf`);
}
