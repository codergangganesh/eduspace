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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          advisor: string | null
          assignment_reminders: boolean | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          course_announcements: boolean | null
          created_at: string
          credits_completed: number | null
          credits_required: number | null
          date_of_birth: string | null
          department: string | null
          email: string | null
          email_notifications: boolean | null
          enrollment_date: string | null
          expected_graduation: string | null
          full_name: string | null
          gpa: number | null
          grade_updates: boolean | null
          id: string
          language: string | null
          phone: string | null
          program: string | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          state: string | null
          street: string | null
          student_id: string | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          weekly_digest: boolean | null
          year: string | null
          zip_code: string | null
        }
        Insert: {
          advisor?: string | null
          assignment_reminders?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          course_announcements?: boolean | null
          created_at?: string
          credits_completed?: number | null
          credits_required?: number | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          email_notifications?: boolean | null
          enrollment_date?: string | null
          expected_graduation?: string | null
          full_name?: string | null
          gpa?: number | null
          grade_updates?: boolean | null
          id?: string
          language?: string | null
          phone?: string | null
          program?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          state?: string | null
          street?: string | null
          student_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          weekly_digest?: boolean | null
          year?: string | null
          zip_code?: string | null
        }
        Update: {
          advisor?: string | null
          assignment_reminders?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          course_announcements?: boolean | null
          created_at?: string
          credits_completed?: number | null
          credits_required?: number | null
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          email_notifications?: boolean | null
          enrollment_date?: string | null
          expected_graduation?: string | null
          full_name?: string | null
          gpa?: number | null
          grade_updates?: boolean | null
          id?: string
          language?: string | null
          phone?: string | null
          program?: string | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          state?: string | null
          street?: string | null
          student_id?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          weekly_digest?: boolean | null
          year?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          course_name: string | null
          due_date: string | null
          status: 'pending' | 'completed' | 'submitted'
          student_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          course_name?: string | null
          due_date?: string | null
          status?: 'pending' | 'completed' | 'submitted'
          student_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          course_name?: string | null
          due_date?: string | null
          status?: 'pending' | 'completed' | 'submitted'
          student_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          attachment_name: string | null
          attachment_url: string | null
          attachment_size: string | null
          attachment_type: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          receiver_id: string
          content: string
          attachment_name?: string | null
          attachment_url?: string | null
          attachment_size?: string | null
          attachment_type?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          attachment_name?: string | null
          attachment_url?: string | null
          attachment_size?: string | null
          attachment_type?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          participant_1: string
          participant_2: string
          last_message: string | null
          last_message_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          participant_1: string
          participant_2: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          participant_1?: string
          participant_2?: string
          last_message?: string | null
          last_message_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'assignment' | 'schedule' | 'message' | 'grade' | 'announcement'
          related_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'assignment' | 'schedule' | 'message' | 'grade' | 'announcement'
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'assignment' | 'schedule' | 'message' | 'grade' | 'announcement'
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          id: string
          title: string
          course_code: string | null
          type: 'lecture' | 'lab' | 'tutorial' | 'exam'
          start_time: string
          end_time: string
          day_of_week: number
          location: string | null
          instructor: string | null
          color: string | null
          student_id: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          course_code?: string | null
          type: 'lecture' | 'lab' | 'tutorial' | 'exam'
          start_time: string
          end_time: string
          day_of_week: number
          location?: string | null
          instructor?: string | null
          color?: string | null
          student_id: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          course_code?: string | null
          type?: 'lecture' | 'lab' | 'tutorial' | 'exam'
          start_time?: string
          end_time?: string
          day_of_week?: number
          location?: string | null
          instructor?: string | null
          color?: string | null
          student_id?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "lecturer" | "admin"
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
    Enums: {
      app_role: ["student", "lecturer", "admin"],
    },
  },
} as const
