
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Terms
CREATE TABLE public.terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to terms" ON public.terms FOR ALL USING (true) WITH CHECK (true);

-- Courses
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

-- Class Sections
CREATE TABLE public.class_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term_id UUID NOT NULL REFERENCES public.terms(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  section_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(term_id, course_id, section_name)
);
ALTER TABLE public.class_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to class_sections" ON public.class_sections FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_class_sections_updated_at BEFORE UPDATE ON public.class_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Students
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  major TEXT,
  cohort TEXT,
  cet_status TEXT,
  semester_goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enrollments
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id),
  class_section_id UUID NOT NULL REFERENCES public.class_sections(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, class_section_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to enrollments" ON public.enrollments FOR ALL USING (true) WITH CHECK (true);

-- Course History
CREATE TABLE public.course_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id),
  term_id UUID NOT NULL REFERENCES public.terms(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  final_total NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, term_id, course_id)
);
ALTER TABLE public.course_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to course_history" ON public.course_history FOR ALL USING (true) WITH CHECK (true);

-- Formative Scores
CREATE TABLE public.formative_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id),
  term_id UUID NOT NULL REFERENCES public.terms(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  class_section_id UUID NOT NULL REFERENCES public.class_sections(id),
  qa_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  group_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  ideology_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  speaking_test_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  listening_test_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  homework_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  online_task_score NUMERIC(5,1) NOT NULL DEFAULT 0,
  homework_score_override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, term_id, course_id, class_section_id)
);
ALTER TABLE public.formative_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to formative_scores" ON public.formative_scores FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_formative_scores_updated_at BEFORE UPDATE ON public.formative_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Final Exams
CREATE TABLE public.final_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id),
  term_id UUID NOT NULL REFERENCES public.terms(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  class_section_id UUID NOT NULL REFERENCES public.class_sections(id),
  vocab NUMERIC(4,1) NOT NULL DEFAULT 0,
  cloze NUMERIC(4,1) NOT NULL DEFAULT 0,
  tf NUMERIC(4,1) NOT NULL DEFAULT 0,
  match NUMERIC(4,1) NOT NULL DEFAULT 0,
  deep NUMERIC(4,1) NOT NULL DEFAULT 0,
  translation NUMERIC(4,1) NOT NULL DEFAULT 0,
  writing NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, term_id, course_id, class_section_id)
);
ALTER TABLE public.final_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to final_exams" ON public.final_exams FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_final_exams_updated_at BEFORE UPDATE ON public.final_exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Homeworks
CREATE TABLE public.homeworks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id),
  term_id UUID NOT NULL REFERENCES public.terms(id),
  course_id UUID NOT NULL REFERENCES public.courses(id),
  class_section_id UUID NOT NULL REFERENCES public.class_sections(id),
  homework_no INTEGER NOT NULL,
  score NUMERIC(5,1) NOT NULL DEFAULT 0,
  submitted BOOLEAN NOT NULL DEFAULT true,
  on_time BOOLEAN NOT NULL DEFAULT true,
  revision_count INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, term_id, course_id, class_section_id, homework_no)
);
ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to homeworks" ON public.homeworks FOR ALL USING (true) WITH CHECK (true);

-- Growth Types
CREATE TABLE public.growth_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.growth_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to growth_types" ON public.growth_types FOR ALL USING (true) WITH CHECK (true);

-- Tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  group_name TEXT NOT NULL,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to tags" ON public.tags FOR ALL USING (true) WITH CHECK (true);

-- Growth Logs
CREATE TABLE public.growth_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id),
  term_id UUID NOT NULL REFERENCES public.terms(id),
  course_id UUID REFERENCES public.courses(id),
  class_section_id UUID REFERENCES public.class_sections(id),
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type_id UUID NOT NULL REFERENCES public.growth_types(id),
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.growth_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to growth_logs" ON public.growth_logs FOR ALL USING (true) WITH CHECK (true);

-- Growth Log Tags (junction table)
CREATE TABLE public.growth_log_tags (
  growth_log_id UUID NOT NULL REFERENCES public.growth_logs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (growth_log_id, tag_id)
);
ALTER TABLE public.growth_log_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to growth_log_tags" ON public.growth_log_tags FOR ALL USING (true) WITH CHECK (true);

-- Insert default growth types
INSERT INTO public.growth_types (key, display_name, is_builtin, is_enabled, sort_order) VALUES
('progress', '进步', true, true, 1),
('issue', '问题', true, true, 2),
('performance', '表现', true, true, 3),
('tutoring', '辅导', true, true, 4),
('work', '作品', true, true, 5);

-- Insert default tags
INSERT INTO public.tags (key, display_name, group_name, is_builtin, is_enabled, sort_order) VALUES
('listening', '听力', '能力维度', true, true, 1),
('reading', '阅读', '能力维度', true, true, 2),
('writing', '写作', '能力维度', true, true, 3),
('speaking', '口语', '能力维度', true, true, 4),
('vocabulary', '词汇', '能力维度', true, true, 5),
('translation', '翻译', '能力维度', true, true, 6),
('attitude', '态度', '学习行为', true, true, 7),
('method', '方法', '方法策略', true, true, 8),
('homework_tag', '作业', '学习行为', true, true, 9),
('online', '线上任务', '学习行为', true, true, 10);
