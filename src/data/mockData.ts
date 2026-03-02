import type {
  Term, Course, ClassSection, Student, Enrollment,
  CourseHistory, FormativeScore, FinalExam, Homework,
  GrowthType, Tag, GrowthLog,
} from "@/types";

// ===== Terms =====
export const terms: Term[] = [
  { id: "t1", term_name: "2023-2024-1" },
  { id: "t2", term_name: "2023-2024-2" },
  { id: "t3", term_name: "2024-2025-1" },
  { id: "t4", term_name: "2024-2025-2" },
  { id: "t5", term_name: "2025-2026-1" },
  { id: "t6", term_name: "2025-2026-2" },
];

// ===== Courses =====
export const courses: Course[] = [
  { id: "c1", course_name: "大学英语1" },
  { id: "c2", course_name: "大学英语2" },
  { id: "c3", course_name: "大学英语3" },
  { id: "c4", course_name: "大学英语4" },
];

// ===== ClassSections =====
export const classSections: ClassSection[] = [
  { id: "cs1", term_id: "t6", course_id: "c4", section_name: "教学班1", class_key: "2025-2026-2_大学英语4_教学班1" },
  { id: "cs2", term_id: "t6", course_id: "c4", section_name: "教学班2", class_key: "2025-2026-2_大学英语4_教学班2" },
  { id: "cs3", term_id: "t6", course_id: "c4", section_name: "教学班3", class_key: "2025-2026-2_大学英语4_教学班3" },
];

// ===== Students =====
const majors = ["计算机科学", "软件工程", "电子信息", "数据科学", "人工智能", "网络工程"];
const studentNames = [
  "张三", "李四", "王五", "赵六", "孙七", "周八", "吴九", "郑十",
  "冯晓明", "陈雨欣", "林思涵", "黄嘉怡", "杨子轩", "朱浩然", "徐美琪", "马志远",
  "刘思源", "谢雨萌", "何俊杰", "高晓峰", "罗梦瑶", "韩子涵", "唐诗琪", "曹宇航",
];

export const students: Student[] = studentNames.map((name, i) => ({
  id: `s${i + 1}`,
  student_code: `2023${String(i + 1).padStart(4, "0")}`,
  name,
  major: majors[i % majors.length],
  cohort: "2023级",
  cet_status: i % 3 === 0 ? "已过四级" : i % 3 === 1 ? "未过" : "已过六级",
  semester_goal: i % 2 === 0 ? "通过四级+听力提升" : "写作突破+口语提升",
}));

// ===== Enrollments (all students in A班 for simplicity, some in B/C) =====
export const enrollments: Enrollment[] = [
  ...students.slice(0, 8).map((s, i) => ({ id: `e${i + 1}`, student_id: s.id, class_section_id: "cs1" })),
  ...students.slice(8, 16).map((s, i) => ({ id: `e${i + 9}`, student_id: s.id, class_section_id: "cs2" })),
  ...students.slice(16, 24).map((s, i) => ({ id: `e${i + 17}`, student_id: s.id, class_section_id: "cs3" })),
];

// ===== Course History =====
function rng(min: number, max: number) { return Math.round(min + Math.random() * (max - min)); }

export const courseHistories: CourseHistory[] = students.flatMap((s) => [
  { id: `ch${s.id}_c1`, student_id: s.id, term_id: "t3", course_id: "c1", final_total: rng(60, 90) },
  { id: `ch${s.id}_c2`, student_id: s.id, term_id: "t4", course_id: "c2", final_total: rng(62, 92) },
  { id: `ch${s.id}_c3`, student_id: s.id, term_id: "t5", course_id: "c3", final_total: rng(64, 94) },
]);

// ===== Formative Scores =====
export const formativeScores: FormativeScore[] = students.map((s, i) => {
  const csId = i < 8 ? "cs1" : i < 16 ? "cs2" : "cs3";
  return {
    id: `fs${s.id}`,
    student_id: s.id,
    term_id: "t6",
    course_id: "c4",
    class_section_id: csId,
    qa_score: rng(60, 95),
    group_score: rng(65, 98),
    ideology_score: rng(70, 98),
    speaking_test_score: rng(55, 92),
    listening_test_score: rng(50, 90),
    homework_score: rng(60, 95),
    online_task_score: rng(65, 98),
  };
});

// ===== Final Exams =====
export const finalExams: FinalExam[] = students.map((s, i) => {
  const csId = i < 8 ? "cs1" : i < 16 ? "cs2" : "cs3";
  return {
    id: `fe${s.id}`,
    student_id: s.id,
    term_id: "t6",
    course_id: "c4",
    class_section_id: csId,
    vocab: rng(5, 10),
    cloze: rng(5, 10),
    tf: rng(5, 10),
    match: rng(10, 20),
    deep: rng(10, 20),
    translation: rng(8, 15),
    writing: rng(8, 15),
  };
});

// ===== Homeworks =====
export const homeworks: Homework[] = students.flatMap((s, i) => {
  const csId = i < 8 ? "cs1" : i < 16 ? "cs2" : "cs3";
  return [1, 2, 3, 4].map((no) => ({
    id: `hw${s.id}_${no}`,
    student_id: s.id,
    term_id: "t6",
    course_id: "c4",
    class_section_id: csId,
    homework_no: no,
    score: rng(55, 98),
    submitted: Math.random() > 0.05,
    on_time: Math.random() > 0.2,
    revision_count: rng(0, 3),
  }));
});

// ===== Growth Types =====
export const growthTypes: GrowthType[] = [
  { id: "gt1", key: "progress", display_name: "进步", is_builtin: true, is_enabled: true, sort_order: 1 },
  { id: "gt2", key: "issue", display_name: "问题", is_builtin: true, is_enabled: true, sort_order: 2 },
  { id: "gt3", key: "performance", display_name: "表现", is_builtin: true, is_enabled: true, sort_order: 3 },
  { id: "gt4", key: "tutoring", display_name: "辅导", is_builtin: true, is_enabled: true, sort_order: 4 },
  { id: "gt5", key: "work", display_name: "作品", is_builtin: true, is_enabled: true, sort_order: 5 },
];

// ===== Tags =====
export const tags: Tag[] = [
  { id: "tag1", key: "listening", display_name: "听力", group_name: "能力维度", is_builtin: true, is_enabled: true, sort_order: 1 },
  { id: "tag2", key: "reading", display_name: "阅读", group_name: "能力维度", is_builtin: true, is_enabled: true, sort_order: 2 },
  { id: "tag3", key: "writing", display_name: "写作", group_name: "能力维度", is_builtin: true, is_enabled: true, sort_order: 3 },
  { id: "tag4", key: "speaking", display_name: "口语", group_name: "能力维度", is_builtin: true, is_enabled: true, sort_order: 4 },
  { id: "tag5", key: "vocabulary", display_name: "词汇", group_name: "能力维度", is_builtin: true, is_enabled: true, sort_order: 5 },
  { id: "tag6", key: "translation", display_name: "翻译", group_name: "能力维度", is_builtin: true, is_enabled: true, sort_order: 6 },
  { id: "tag7", key: "attitude", display_name: "态度", group_name: "学习行为", is_builtin: true, is_enabled: true, sort_order: 7 },
  { id: "tag8", key: "method", display_name: "方法", group_name: "方法策略", is_builtin: true, is_enabled: true, sort_order: 8 },
  { id: "tag9", key: "homework_tag", display_name: "作业", group_name: "学习行为", is_builtin: true, is_enabled: true, sort_order: 9 },
  { id: "tag10", key: "online", display_name: "线上任务", group_name: "学习行为", is_builtin: true, is_enabled: true, sort_order: 10 },
];

// ===== Growth Logs =====
export const growthLogs: GrowthLog[] = [
  { id: "gl1", student_id: "s1", term_id: "t6", course_id: "c4", class_section_id: "cs1", record_date: "2025-03-05", type_id: "gt2", content: "细节信息捕捉不足，听力练习需要加强短对话部分", tag_ids: ["tag1", "tag8"] },
  { id: "gl2", student_id: "s1", term_id: "t6", course_id: "c4", class_section_id: "cs1", record_date: "2025-04-02", type_id: "gt1", content: "听力成绩提升6分，能够抓住关键词", tag_ids: ["tag1"] },
  { id: "gl3", student_id: "s1", term_id: "t6", course_id: "c4", class_section_id: "cs1", record_date: "2025-04-23", type_id: "gt5", content: "作文结构明显改善，论点层次清晰", tag_ids: ["tag3"] },
  { id: "gl4", student_id: "s1", term_id: "t6", course_id: "c4", class_section_id: "cs1", record_date: "2025-05-10", type_id: "gt3", content: "课堂小组讨论中主动发言，表达流畅", tag_ids: ["tag4", "tag7"] },
  { id: "gl5", student_id: "s2", term_id: "t6", course_id: "c4", class_section_id: "cs1", record_date: "2025-03-12", type_id: "gt4", content: "一对一辅导写作技巧，重点练习段落衔接", tag_ids: ["tag3", "tag8"] },
  { id: "gl6", student_id: "s3", term_id: "t6", course_id: "c4", class_section_id: "cs1", record_date: "2025-04-15", type_id: "gt1", content: "词汇量显著增长，阅读速度提升", tag_ids: ["tag5", "tag2"] },
];

// ===== Helper functions =====
export function getStudentsBySection(sectionId: string): Student[] {
  const studentIds = enrollments.filter(e => e.class_section_id === sectionId).map(e => e.student_id);
  return students.filter(s => studentIds.includes(s.id));
}

export function getSectionStudentCount(sectionId: string): number {
  return enrollments.filter(e => e.class_section_id === sectionId).length;
}

export function getTermById(id: string): Term | undefined {
  return terms.find(t => t.id === id);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find(c => c.id === id);
}

export function getSectionById(id: string): ClassSection | undefined {
  return classSections.find(cs => cs.id === id);
}

export function getStudentById(id: string): Student | undefined {
  return students.find(s => s.id === id);
}
