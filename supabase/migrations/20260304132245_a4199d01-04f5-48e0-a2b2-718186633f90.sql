
-- Add is_deleted columns to key tables
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.class_sections ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.growth_logs ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.homeworks ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
ALTER TABLE public.terms ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Add unique constraint for class_sections (term_id + course_id + section_name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_sections_unique ON public.class_sections(term_id, course_id, section_name) WHERE is_deleted = false;

-- Add unique constraint for enrollments (student_id + class_section_id)  
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique ON public.enrollments(student_id, class_section_id) WHERE is_deleted = false;
