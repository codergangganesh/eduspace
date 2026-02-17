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
      access_requests: {
        Row: {
          class_id: string
          id: string
          invitation_email_sent: boolean | null
          invitation_email_sent_at: string | null
          lecturer_id: string
          responded_at: string | null
          sent_at: string | null
          status: string | null
          student_email: string
          student_email_id: string | null
          student_id: string | null
        }
        Insert: {
          class_id: string
          id?: string
          invitation_email_sent?: boolean | null
          invitation_email_sent_at?: string | null
          lecturer_id: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          student_email: string
          student_email_id?: string | null
          student_id?: string | null
        }
        Update: {
          class_id?: string
          id?: string
          invitation_email_sent?: boolean | null
          invitation_email_sent_at?: string | null
          lecturer_id?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          student_email?: string
          student_email_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_student_email_id_fkey"
            columns: ["student_email_id"]
            isOneToOne: false
            referencedRelation: "class_all_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_student_email_id_fkey"
            columns: ["student_email_id"]
            isOneToOne: false
            referencedRelation: "student_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean | null
          share_token: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          share_token?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          share_token?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: Json
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: Json
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: Json
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          attachment_name: string | null
          attachment_url: string | null
          class_id: string | null
          content: string | null
          feedback: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          grade: number | null
          graded_at: string | null
          id: string
          register_number: string | null
          status: string | null
          student_id: string | null
          submission_text: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          class_id?: string | null
          content?: string | null
          feedback?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          register_number?: string | null
          status?: string | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          class_id?: string | null
          content?: string | null
          feedback?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          id?: string
          register_number?: string | null
          status?: string | null
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          class_id: string | null
          course_id: string | null
          course_name: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          lecturer_id: string | null
          max_points: number | null
          status: string | null
          student_id: string | null
          subject_id: string | null
          subject_name: string | null
          title: string
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          class_id?: string | null
          course_id?: string | null
          course_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          lecturer_id?: string | null
          max_points?: number | null
          status?: string | null
          student_id?: string | null
          subject_id?: string | null
          subject_name?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          class_id?: string | null
          course_id?: string | null
          course_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          lecturer_id?: string | null
          max_points?: number | null
          status?: string | null
          student_id?: string | null
          subject_id?: string | null
          subject_name?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "chat_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_polls: {
        Row: {
          allow_multiple: boolean | null
          conversation_id: string
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          is_closed: boolean | null
          options: Json
          question: string
        }
        Insert: {
          allow_multiple?: boolean | null
          conversation_id: string
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          is_closed?: boolean | null
          options: Json
          question: string
        }
        Update: {
          allow_multiple?: boolean | null
          conversation_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          is_closed?: boolean | null
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_polls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_students: {
        Row: {
          added_at: string | null
          class_id: string
          course: string | null
          department: string | null
          email: string
          id: string
          import_source: string | null
          phone: string | null
          register_number: string
          section: string | null
          student_email_id: string | null
          student_id: string | null
          student_image_url: string | null
          student_name: string
          year: string | null
        }
        Insert: {
          added_at?: string | null
          class_id: string
          course?: string | null
          department?: string | null
          email: string
          id?: string
          import_source?: string | null
          phone?: string | null
          register_number: string
          section?: string | null
          student_email_id?: string | null
          student_id?: string | null
          student_image_url?: string | null
          student_name: string
          year?: string | null
        }
        Update: {
          added_at?: string | null
          class_id?: string
          course?: string | null
          department?: string | null
          email?: string
          id?: string
          import_source?: string | null
          phone?: string | null
          register_number?: string
          section?: string | null
          student_email_id?: string | null
          student_id?: string | null
          student_image_url?: string | null
          student_name?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_email_id_fkey"
            columns: ["student_email_id"]
            isOneToOne: false
            referencedRelation: "class_all_students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_students_student_email_id_fkey"
            columns: ["student_email_id"]
            isOneToOne: false
            referencedRelation: "student_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          class_image_url: string | null
          class_name: string | null
          course_code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          lecturer_department: string | null
          lecturer_id: string
          lecturer_name: string | null
          lecturer_profile_image: string | null
          semester: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          class_image_url?: string | null
          class_name?: string | null
          course_code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lecturer_department?: string | null
          lecturer_id: string
          lecturer_name?: string | null
          lecturer_profile_image?: string | null
          semester?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          class_image_url?: string | null
          class_name?: string | null
          course_code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lecturer_department?: string | null
          lecturer_id?: string
          lecturer_name?: string | null
          lecturer_profile_image?: string | null
          semester?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          auto_delete_settings: Json | null
          class_id: string | null
          cleared_at: Json | null
          created_at: string | null
          id: string
          is_class_conversation: boolean | null
          last_message: string | null
          last_message_at: string | null
          participant_1: string | null
          participant_2: string | null
          visible_to: string[] | null
        }
        Insert: {
          auto_delete_settings?: Json | null
          class_id?: string | null
          cleared_at?: Json | null
          created_at?: string | null
          id?: string
          is_class_conversation?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          participant_1?: string | null
          participant_2?: string | null
          visible_to?: string[] | null
        }
        Update: {
          auto_delete_settings?: Json | null
          class_id?: string | null
          cleared_at?: Json | null
          created_at?: string | null
          id?: string
          is_class_conversation?: boolean | null
          last_message?: string | null
          last_message_at?: string | null
          participant_1?: string | null
          participant_2?: string | null
          visible_to?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          course_id: string | null
          enrolled_at: string | null
          grade: string | null
          id: string
          status: string | null
          student_id: string | null
        }
        Insert: {
          course_id?: string | null
          enrolled_at?: string | null
          grade?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
        }
        Update: {
          course_id?: string | null
          enrolled_at?: string | null
          grade?: string | null
          id?: string
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_code: string
          created_at: string | null
          credits: number | null
          department: string | null
          description: string | null
          id: string
          is_active: boolean | null
          lecturer_id: string | null
          max_students: number | null
          schedule_info: string | null
          semester: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_code: string
          created_at?: string | null
          credits?: number | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lecturer_id?: string | null
          max_students?: number | null
          schedule_info?: string | null
          semester?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_code?: string
          created_at?: string | null
          credits?: number | null
          department?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          lecturer_id?: string | null
          max_students?: number | null
          schedule_info?: string | null
          semester?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          created_at: string
          id: string
          message: string | null
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_token: string | null
          invited_by: string
          role: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by: string
          role: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string
          role?: string
          status?: string | null
        }
        Relationships: []
      }
      knowledge_links: {
        Row: {
          created_at: string
          id: string
          link_type: string | null
          source_node_id: string | null
          target_node_id: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          link_type?: string | null
          source_node_id?: string | null
          target_node_id?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string | null
          source_node_id?: string | null
          target_node_id?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_links_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_links_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_nodes: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          keywords: string[] | null
          label: string
          metadata: Json | null
          source_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          keywords?: string[] | null
          label: string
          metadata?: Json | null
          source_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          keywords?: string[] | null
          label?: string
          metadata?: Json | null
          source_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lecturer_profiles: {
        Row: {
          assignment_notifications: boolean | null
          bio: string | null
          created_at: string | null
          department: string
          email: string
          email_notifications: boolean | null
          full_name: string
          id: string
          message_notifications: boolean | null
          office_hours: string | null
          office_location: string | null
          phone: string | null
          profile_image: string | null
          specialization: string | null
          submission_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_notifications?: boolean | null
          bio?: string | null
          created_at?: string | null
          department: string
          email: string
          email_notifications?: boolean | null
          full_name: string
          id?: string
          message_notifications?: boolean | null
          office_hours?: string | null
          office_location?: string | null
          phone?: string | null
          profile_image?: string | null
          specialization?: string | null
          submission_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_notifications?: boolean | null
          bio?: string | null
          created_at?: string | null
          department?: string
          email?: string
          email_notifications?: boolean | null
          full_name?: string
          id?: string
          message_notifications?: boolean | null
          office_hours?: string | null
          office_location?: string | null
          phone?: string | null
          profile_image?: string | null
          specialization?: string | null
          submission_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_size: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          edit_count: number | null
          id: string
          is_edited: boolean | null
          is_read: boolean | null
          last_edited_at: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          edit_count?: number | null
          id?: string
          is_edited?: boolean | null
          is_read?: boolean | null
          last_edited_at?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          edit_count?: number | null
          id?: string
          is_edited?: boolean | null
          is_read?: boolean | null
          last_edited_at?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_type: string | null
          class_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          recipient_id: string
          related_id: string | null
          sender_id: string | null
          title: string
          type: string
        }
        Insert: {
          action_type?: string | null
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          recipient_id: string
          related_id?: string | null
          sender_id?: string | null
          title: string
          type: string
        }
        Update: {
          action_type?: string | null
          class_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          recipient_id?: string
          related_id?: string | null
          sender_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          verified: boolean | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          verified?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_call: Json | null
          advisor: string | null
          assignment_reminders: boolean | null
          avatar_url: string | null
          batch: string | null
          bio: string | null
          city: string | null
          country: string | null
          course_announcements: boolean | null
          cookie_consent_at: string | null
          cookie_consent_choice: string | null
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
          hod_name: string | null
          id: string
          language: string | null
          last_feedback_prompt_at: string | null
          last_selected_class_id: string | null
          message_notifications: boolean | null
          notifications_enabled: boolean | null
          phone: string | null
          program: string | null
          push_notifications: boolean | null
          sidebar_mode: string | null
          sms_notifications: boolean | null
          state: string | null
          street: string | null
          student_id: string | null
          theme: string | null
          timezone: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
          verified: boolean | null
          weekly_digest: boolean | null
          year: string | null
          zip_code: string | null
        }
        Insert: {
          active_call?: Json | null
          advisor?: string | null
          assignment_reminders?: boolean | null
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          course_announcements?: boolean | null
          cookie_consent_at?: string | null
          cookie_consent_choice?: string | null
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
          hod_name?: string | null
          id?: string
          language?: string | null
          last_feedback_prompt_at?: string | null
          last_selected_class_id?: string | null
          message_notifications?: boolean | null
          notifications_enabled?: boolean | null
          phone?: string | null
          program?: string | null
          push_notifications?: boolean | null
          sidebar_mode?: string | null
          sms_notifications?: boolean | null
          state?: string | null
          street?: string | null
          student_id?: string | null
          theme?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          weekly_digest?: boolean | null
          year?: string | null
          zip_code?: string | null
        }
        Update: {
          active_call?: Json | null
          advisor?: string | null
          assignment_reminders?: boolean | null
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          course_announcements?: boolean | null
          cookie_consent_at?: string | null
          cookie_consent_choice?: string | null
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
          hod_name?: string | null
          id?: string
          language?: string | null
          last_feedback_prompt_at?: string | null
          last_selected_class_id?: string | null
          message_notifications?: boolean | null
          notifications_enabled?: boolean | null
          phone?: string | null
          program?: string | null
          push_notifications?: boolean | null
          sidebar_mode?: string | null
          sms_notifications?: boolean | null
          state?: string | null
          street?: string | null
          student_id?: string | null
          theme?: string | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          weekly_digest?: boolean | null
          year?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_selected_class_id_fkey"
            columns: ["last_selected_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          credits_completed: number | null
          credits_required: number | null
          department: string | null
          email: string | null
          expected_graduation: string | null
          full_name: string | null
          gpa: string | null
          id: string
          last_updated: string | null
          phone: string | null
          program: string | null
          role: string | null
          user_id: string
          verified: boolean | null
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          credits_completed?: number | null
          credits_required?: number | null
          department?: string | null
          email?: string | null
          expected_graduation?: string | null
          full_name?: string | null
          gpa?: string | null
          id?: string
          last_updated?: string | null
          phone?: string | null
          program?: string | null
          role?: string | null
          user_id: string
          verified?: boolean | null
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          credits_completed?: number | null
          credits_required?: number | null
          department?: string | null
          email?: string | null
          expected_graduation?: string | null
          full_name?: string | null
          gpa?: string | null
          id?: string
          last_updated?: string | null
          phone?: string | null
          program?: string | null
          role?: string | null
          user_id?: string
          verified?: boolean | null
          year?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          notification_enabled: boolean
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          notification_enabled?: boolean
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          notification_enabled?: boolean
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          correct_option_id: string | null
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
          submission_id: string
        }
        Insert: {
          correct_option_id?: string | null
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option: string
          submission_id: string
        }
        Update: {
          correct_option_id?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "quiz_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_drafts: {
        Row: {
          class_id: string
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_drafts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          marks: number
          options: Json
          order_index: number
          question_text: string
          question_type: string | null
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json
          order_index?: number
          question_text: string
          question_type?: string | null
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          marks?: number
          options?: Json
          order_index?: number
          question_text?: string
          question_type?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          id: string
          is_archived: boolean | null
          quiz_id: string
          quiz_version: number
          started_at: string | null
          status: string
          student_id: string
          submitted_at: string
          time_taken: number | null
          total_obtained: number
        }
        Insert: {
          id?: string
          is_archived?: boolean | null
          quiz_id: string
          quiz_version?: number
          started_at?: string | null
          status?: string
          student_id: string
          submitted_at?: string
          time_taken?: number | null
          total_obtained?: number
        }
        Update: {
          id?: string
          is_archived?: boolean | null
          quiz_id?: string
          quiz_version?: number
          started_at?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
          time_taken?: number | null
          total_obtained?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          pass_percentage: number
          status: string
          title: string
          total_marks: number
          version: number
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          pass_percentage?: number
          status?: string
          title: string
          total_marks?: number
          version?: number
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          pass_percentage?: number
          status?: string
          title?: string
          total_marks?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          class_id: string | null
          color: string | null
          course_code: string | null
          course_id: string | null
          created_at: string | null
          created_by: string | null
          day_of_week: number | null
          end_time: string
          id: string
          instructor: string | null
          is_recurring: boolean | null
          lecturer_id: string | null
          lecturer_name: string | null
          location: string | null
          notes: string | null
          specific_date: string | null
          start_time: string
          student_id: string | null
          subject_id: string | null
          subject_name: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          color?: string | null
          course_code?: string | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          end_time: string
          id?: string
          instructor?: string | null
          is_recurring?: boolean | null
          lecturer_id?: string | null
          lecturer_name?: string | null
          location?: string | null
          notes?: string | null
          specific_date?: string | null
          start_time: string
          student_id?: string | null
          subject_id?: string | null
          subject_name?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          color?: string | null
          course_code?: string | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          day_of_week?: number | null
          end_time?: string
          id?: string
          instructor?: string | null
          is_recurring?: boolean | null
          lecturer_id?: string | null
          lecturer_name?: string | null
          location?: string | null
          notes?: string | null
          specific_date?: string | null
          start_time?: string
          student_id?: string | null
          subject_id?: string | null
          subject_name?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_emails: {
        Row: {
          added_at: string | null
          class_id: string
          course: string | null
          department: string | null
          email: string
          id: string
          import_source: string | null
          is_linked: boolean | null
          lecturer_id: string
          linked_at: string | null
          linked_student_id: string | null
          linked_user_id: string | null
          phone: string | null
          register_number: string | null
          section: string | null
          student_name: string | null
          updated_at: string | null
          year: string | null
        }
        Insert: {
          added_at?: string | null
          class_id: string
          course?: string | null
          department?: string | null
          email: string
          id?: string
          import_source?: string | null
          is_linked?: boolean | null
          lecturer_id: string
          linked_at?: string | null
          linked_student_id?: string | null
          linked_user_id?: string | null
          phone?: string | null
          register_number?: string | null
          section?: string | null
          student_name?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Update: {
          added_at?: string | null
          class_id?: string
          course?: string | null
          department?: string | null
          email?: string
          id?: string
          import_source?: string | null
          is_linked?: boolean | null
          lecturer_id?: string
          linked_at?: string | null
          linked_student_id?: string | null
          linked_user_id?: string | null
          phone?: string | null
          register_number?: string | null
          section?: string | null
          student_name?: string | null
          updated_at?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_emails_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          assignment_reminders: boolean | null
          bio: string | null
          course: string | null
          created_at: string | null
          department: string | null
          email: string
          email_notifications: boolean | null
          full_name: string
          grade_updates: boolean | null
          id: string
          message_notifications: boolean | null
          phone: string | null
          profile_image: string | null
          register_number: string | null
          schedule_updates: boolean | null
          section: string | null
          updated_at: string | null
          user_id: string
          year: string | null
        }
        Insert: {
          assignment_reminders?: boolean | null
          bio?: string | null
          course?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          email_notifications?: boolean | null
          full_name: string
          grade_updates?: boolean | null
          id?: string
          message_notifications?: boolean | null
          phone?: string | null
          profile_image?: string | null
          register_number?: string | null
          schedule_updates?: boolean | null
          section?: string | null
          updated_at?: string | null
          user_id: string
          year?: string | null
        }
        Update: {
          assignment_reminders?: boolean | null
          bio?: string | null
          course?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          email_notifications?: boolean | null
          full_name?: string
          grade_updates?: boolean | null
          id?: string
          message_notifications?: boolean | null
          phone?: string | null
          profile_image?: string | null
          register_number?: string | null
          schedule_updates?: boolean | null
          section?: string | null
          updated_at?: string | null
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_id: string
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
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
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan_type: string | null
          status: string | null
          current_period_end: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: string | null
          status?: string | null
          current_period_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan_type?: string | null
          status?: string | null
          current_period_end?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      class_all_students: {
        Row: {
          added_at: string | null
          bio: string | null
          class_id: string | null
          course: string | null
          department: string | null
          email: string | null
          id: string | null
          import_source: string | null
          is_linked: boolean | null
          lecturer_id: string | null
          linked_at: string | null
          linked_student_id: string | null
          phone: string | null
          profile_image: string | null
          register_number: string | null
          section: string | null
          status: string | null
          student_name: string | null
          year: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_emails_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      change_poll_vote: {
        Args: {
          p_new_option_index: number
          p_poll_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      check_student_quiz_access: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      cleanup_expired_push_subscriptions: { Args: never; Returns: undefined }
      delete_expired_otps: { Args: never; Returns: undefined }
      delete_old_ai_chats: { Args: never; Returns: undefined }
      delete_old_chat_messages: { Args: never; Returns: undefined }
      delete_old_notifications: { Args: never; Returns: undefined }
      delete_old_notifications_test: { Args: never; Returns: undefined }
      edit_message: {
        Args: {
          editing_user_id: string
          message_id: string
          new_content: string
        }
        Returns: Json
      }
      expire_old_invitations: { Args: never; Returns: undefined }
      get_active_student_submission: {
        Args: { p_quiz_id: string; p_student_id: string }
        Returns: Json
      }
      get_assignment_submissions_for_lecturer: {
        Args: { p_assignment_id: string }
        Returns: {
          assignment_id: string | null
          attachment_name: string | null
          attachment_url: string | null
          class_id: string | null
          content: string | null
          feedback: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          grade: number | null
          graded_at: string | null
          id: string
          register_number: string | null
          status: string | null
          student_id: string | null
          submission_text: string | null
          submitted_at: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "assignment_submissions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_auth_email: { Args: never; Returns: string }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_lecturer: { Args: { _class_id: string }; Returns: boolean }
      is_student_enrolled_in_class: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      migrate_class_students_to_emails: { Args: never; Returns: undefined }
      toggle_ai_conversation_pin: {
        Args: { conv_id: string }
        Returns: boolean
      }
      toggle_ai_conversation_share: {
        Args: { conv_id: string }
        Returns: string
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
