export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      class_sections: {
        Row: {
          course_id: string
          created_at: string
          id: string
          section_name: string
          term_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          section_name: string
          term_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          section_name?: string
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sections_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sections_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      course_history: {
        Row: {
          course_id: string
          created_at: string
          final_total: number
          id: string
          student_id: string
          term_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          final_total?: number
          id?: string
          student_id: string
          term_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          final_total?: number
          id?: string
          student_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_history_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_name: string
          created_at: string
          id: string
        }
        Insert: {
          course_name: string
          created_at?: string
          id?: string
        }
        Update: {
          course_name?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_section_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_section_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_section_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_section_id_fkey"
            columns: ["class_section_id"]
            isOneToOne: false
            referencedRelation: "class_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      final_exams: {
        Row: {
          class_section_id: string
          cloze: number
          course_id: string
          created_at: string
          deep: number
          id: string
          match: number
          student_id: string
          term_id: string
          tf: number
          translation: number
          updated_at: string
          vocab: number
          writing: number
        }
        Insert: {
          class_section_id: string
          cloze?: number
          course_id: string
          created_at?: string
          deep?: number
          id?: string
          match?: number
          student_id: string
          term_id: string
          tf?: number
          translation?: number
          updated_at?: string
          vocab?: number
          writing?: number
        }
        Update: {
          class_section_id?: string
          cloze?: number
          course_id?: string
          created_at?: string
          deep?: number
          id?: string
          match?: number
          student_id?: string
          term_id?: string
          tf?: number
          translation?: number
          updated_at?: string
          vocab?: number
          writing?: number
        }
        Relationships: [
          {
            foreignKeyName: "final_exams_class_section_id_fkey"
            columns: ["class_section_id"]
            isOneToOne: false
            referencedRelation: "class_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "final_exams_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      formative_scores: {
        Row: {
          class_section_id: string
          course_id: string
          created_at: string
          group_score: number
          homework_score: number
          homework_score_override: boolean
          id: string
          ideology_score: number
          listening_test_score: number
          online_task_score: number
          qa_score: number
          speaking_test_score: number
          student_id: string
          term_id: string
          updated_at: string
        }
        Insert: {
          class_section_id: string
          course_id: string
          created_at?: string
          group_score?: number
          homework_score?: number
          homework_score_override?: boolean
          id?: string
          ideology_score?: number
          listening_test_score?: number
          online_task_score?: number
          qa_score?: number
          speaking_test_score?: number
          student_id: string
          term_id: string
          updated_at?: string
        }
        Update: {
          class_section_id?: string
          course_id?: string
          created_at?: string
          group_score?: number
          homework_score?: number
          homework_score_override?: boolean
          id?: string
          ideology_score?: number
          listening_test_score?: number
          online_task_score?: number
          qa_score?: number
          speaking_test_score?: number
          student_id?: string
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "formative_scores_class_section_id_fkey"
            columns: ["class_section_id"]
            isOneToOne: false
            referencedRelation: "class_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formative_scores_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formative_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formative_scores_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_log_tags: {
        Row: {
          growth_log_id: string
          tag_id: string
        }
        Insert: {
          growth_log_id: string
          tag_id: string
        }
        Update: {
          growth_log_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_log_tags_growth_log_id_fkey"
            columns: ["growth_log_id"]
            isOneToOne: false
            referencedRelation: "growth_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_log_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_logs: {
        Row: {
          attachment_url: string | null
          class_section_id: string | null
          content: string
          course_id: string | null
          created_at: string
          id: string
          record_date: string
          student_id: string
          term_id: string
          type_id: string
        }
        Insert: {
          attachment_url?: string | null
          class_section_id?: string | null
          content: string
          course_id?: string | null
          created_at?: string
          id?: string
          record_date?: string
          student_id: string
          term_id: string
          type_id: string
        }
        Update: {
          attachment_url?: string | null
          class_section_id?: string | null
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          record_date?: string
          student_id?: string
          term_id?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_logs_class_section_id_fkey"
            columns: ["class_section_id"]
            isOneToOne: false
            referencedRelation: "class_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_logs_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "growth_logs_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "growth_types"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_types: {
        Row: {
          display_name: string
          id: string
          is_builtin: boolean
          is_enabled: boolean
          key: string
          sort_order: number
        }
        Insert: {
          display_name: string
          id?: string
          is_builtin?: boolean
          is_enabled?: boolean
          key: string
          sort_order?: number
        }
        Update: {
          display_name?: string
          id?: string
          is_builtin?: boolean
          is_enabled?: boolean
          key?: string
          sort_order?: number
        }
        Relationships: []
      }
      homeworks: {
        Row: {
          attachment_url: string | null
          class_section_id: string
          comment: string | null
          course_id: string
          created_at: string
          homework_no: number
          id: string
          on_time: boolean
          revision_count: number
          score: number
          student_id: string
          submitted: boolean
          term_id: string
        }
        Insert: {
          attachment_url?: string | null
          class_section_id: string
          comment?: string | null
          course_id: string
          created_at?: string
          homework_no: number
          id?: string
          on_time?: boolean
          revision_count?: number
          score?: number
          student_id: string
          submitted?: boolean
          term_id: string
        }
        Update: {
          attachment_url?: string | null
          class_section_id?: string
          comment?: string | null
          course_id?: string
          created_at?: string
          homework_no?: number
          id?: string
          on_time?: boolean
          revision_count?: number
          score?: number
          student_id?: string
          submitted?: boolean
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeworks_class_section_id_fkey"
            columns: ["class_section_id"]
            isOneToOne: false
            referencedRelation: "class_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homeworks_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          cet_status: string | null
          cohort: string | null
          created_at: string
          id: string
          major: string | null
          name: string
          semester_goal: string | null
          student_code: string
          updated_at: string
        }
        Insert: {
          cet_status?: string | null
          cohort?: string | null
          created_at?: string
          id?: string
          major?: string | null
          name: string
          semester_goal?: string | null
          student_code: string
          updated_at?: string
        }
        Update: {
          cet_status?: string | null
          cohort?: string | null
          created_at?: string
          id?: string
          major?: string | null
          name?: string
          semester_goal?: string | null
          student_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          display_name: string
          group_name: string
          id: string
          is_builtin: boolean
          is_enabled: boolean
          key: string
          sort_order: number
        }
        Insert: {
          display_name: string
          group_name: string
          id?: string
          is_builtin?: boolean
          is_enabled?: boolean
          key: string
          sort_order?: number
        }
        Update: {
          display_name?: string
          group_name?: string
          id?: string
          is_builtin?: boolean
          is_enabled?: boolean
          key?: string
          sort_order?: number
        }
        Relationships: []
      }
      terms: {
        Row: {
          created_at: string
          id: string
          term_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          term_name: string
        }
        Update: {
          created_at?: string
          id?: string
          term_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
