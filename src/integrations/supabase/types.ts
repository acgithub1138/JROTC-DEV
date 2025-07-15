export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      budget_transactions: {
        Row: {
          active: boolean | null
          amount: number
          archive: boolean
          budget_year: string | null
          category: Database["public"]["Enums"]["budget_transaction_category"]
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          item: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          school_id: string
          status: Database["public"]["Enums"]["expense_status"] | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          amount: number
          archive?: boolean
          budget_year?: string | null
          category: Database["public"]["Enums"]["budget_transaction_category"]
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          item: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          school_id: string
          status?: Database["public"]["Enums"]["expense_status"] | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          amount?: number
          archive?: boolean
          budget_year?: string | null
          category?: Database["public"]["Enums"]["budget_transaction_category"]
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          item?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          school_id?: string
          status?: Database["public"]["Enums"]["expense_status"] | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_event_types: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_event_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_events: {
        Row: {
          cadet_ids: string[]
          competition_id: string
          created_at: string
          event: Database["public"]["Enums"]["comp_event_type"]
          id: string
          school_id: string
          score_sheet: Json
          team_name: string | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          cadet_ids?: string[]
          competition_id: string
          created_at?: string
          event: Database["public"]["Enums"]["comp_event_type"]
          id?: string
          school_id: string
          score_sheet?: Json
          team_name?: string | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          cadet_ids?: string[]
          competition_id?: string
          created_at?: string
          event?: Database["public"]["Enums"]["comp_event_type"]
          id?: string
          school_id?: string
          score_sheet?: Json
          team_name?: string | null
          total_points?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_results: {
        Row: {
          cadet_id: string | null
          competition_id: string
          created_at: string
          id: string
          judge_number: Database["public"]["Enums"]["judge_number"] | null
          notes: string | null
          placement: number | null
          school_id: string
          score: number | null
          team_id: string | null
          team_name: string | null
        }
        Insert: {
          cadet_id?: string | null
          competition_id: string
          created_at?: string
          id?: string
          judge_number?: Database["public"]["Enums"]["judge_number"] | null
          notes?: string | null
          placement?: number | null
          school_id: string
          score?: number | null
          team_id?: string | null
          team_name?: string | null
        }
        Update: {
          cadet_id?: string | null
          competition_id?: string
          created_at?: string
          id?: string
          judge_number?: Database["public"]["Enums"]["judge_number"] | null
          notes?: string | null
          placement?: number | null
          school_id?: string
          score?: number | null
          team_id?: string | null
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_results_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event: Database["public"]["Enums"]["comp_event_type"]
          id: string
          is_active: boolean
          is_global: boolean
          jrotc_program: Database["public"]["Enums"]["jrotc_program"]
          school_id: string | null
          scores: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event: Database["public"]["Enums"]["comp_event_type"]
          id?: string
          is_active?: boolean
          is_global?: boolean
          jrotc_program: Database["public"]["Enums"]["jrotc_program"]
          school_id?: string | null
          scores?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event?: Database["public"]["Enums"]["comp_event_type"]
          id?: string
          is_active?: boolean
          is_global?: boolean
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"]
          school_id?: string | null
          scores?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          armed_color_guard:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_exhibition: Database["public"]["Enums"]["comp_placement"] | null
          armed_inspection: Database["public"]["Enums"]["comp_placement"] | null
          armed_regulation: Database["public"]["Enums"]["comp_placement"] | null
          cadets: string[] | null
          comp_type: Database["public"]["Enums"]["jrotc_program"] | null
          competition_date: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
          overall_armed_placement:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          overall_placement:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          overall_unarmed_placement:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          registration_deadline: string | null
          school_id: string | null
          teams: string[] | null
          unarmed_color_guard:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_exhibition:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_inspection:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_regulation:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          updated_at: string
        }
        Insert: {
          armed_color_guard?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_exhibition?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_inspection?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_regulation?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          cadets?: string[] | null
          comp_type?: Database["public"]["Enums"]["jrotc_program"] | null
          competition_date: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          overall_armed_placement?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          overall_placement?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          overall_unarmed_placement?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          registration_deadline?: string | null
          school_id?: string | null
          teams?: string[] | null
          unarmed_color_guard?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_exhibition?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_inspection?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_regulation?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          updated_at?: string
        }
        Update: {
          armed_color_guard?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_exhibition?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_inspection?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_regulation?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          cadets?: string[] | null
          comp_type?: Database["public"]["Enums"]["jrotc_program"] | null
          competition_date?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          overall_armed_placement?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          overall_placement?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          overall_unarmed_placement?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          registration_deadline?: string | null
          school_id?: string | null
          teams?: string[] | null
          unarmed_color_guard?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_exhibition?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_inspection?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          unarmed_regulation?:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          cadet_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          school_id: string
          status: Database["public"]["Enums"]["contact_status"] | null
          type: Database["public"]["Enums"]["contact_type"] | null
          updated_at: string
        }
        Insert: {
          cadet_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["contact_status"] | null
          type?: Database["public"]["Enums"]["contact_type"] | null
          updated_at?: string
        }
        Update: {
          cadet_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["contact_status"] | null
          type?: Database["public"]["Enums"]["contact_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      default_role_permissions: {
        Row: {
          action_id: string
          created_at: string
          enabled: boolean
          id: string
          module_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          action_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          action_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "default_role_permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "default_role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      email_processing_log: {
        Row: {
          failed_count: number | null
          id: string
          processed_at: string | null
          processed_count: number | null
          request_id: string | null
          status: string | null
        }
        Insert: {
          failed_count?: number | null
          id?: string
          processed_at?: string | null
          processed_count?: number | null
          request_id?: string | null
          status?: string | null
        }
        Update: {
          failed_count?: number | null
          id?: string
          processed_at?: string | null
          processed_count?: number | null
          request_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          body: string
          created_at: string
          error_message: string | null
          id: string
          recipient_email: string
          record_id: string | null
          rule_id: string | null
          scheduled_at: string
          school_id: string
          sent_at: string | null
          source_table: string | null
          status: Database["public"]["Enums"]["email_queue_status"]
          subject: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email: string
          record_id?: string | null
          rule_id?: string | null
          scheduled_at?: string
          school_id: string
          sent_at?: string | null
          source_table?: string | null
          status?: Database["public"]["Enums"]["email_queue_status"]
          subject: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          record_id?: string | null
          rule_id?: string | null
          scheduled_at?: string
          school_id?: string
          sent_at?: string | null
          source_table?: string | null
          status?: Database["public"]["Enums"]["email_queue_status"]
          subject?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          source_table: string
          subject: string
          updated_at: string
          variables_used: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          source_table: string
          subject: string
          updated_at?: string
          variables_used?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          source_table?: string
          subject?: string
          updated_at?: string
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assignments: {
        Row: {
          assignee_id: string
          assignee_type: Database["public"]["Enums"]["assignee_type"]
          created_at: string
          event_id: string
          id: string
          role: string | null
          status: Database["public"]["Enums"]["assignment_status"]
        }
        Insert: {
          assignee_id: string
          assignee_type: Database["public"]["Enums"]["assignee_type"]
          created_at?: string
          event_id: string
          id?: string
          role?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
        }
        Update: {
          assignee_id?: string
          assignee_type?: Database["public"]["Enums"]["assignee_type"]
          created_at?: string
          event_id?: string
          id?: string
          role?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string
          school_id: string | null
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          school_id?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          school_id?: string | null
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_all_day: boolean
          location: string | null
          school_id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_all_day?: boolean
          location?: string | null
          school_id: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_all_day?: boolean
          location?: string | null
          school_id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          budget_id: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          receipt_url: string | null
          school_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          budget_id: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date: string
          id?: string
          receipt_url?: string | null
          school_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          budget_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          school_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_category_options: {
        Row: {
          color_class: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      incident_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          incident_id: string
          is_system_comment: boolean
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          incident_id: string
          is_system_comment?: boolean
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          incident_id?: string
          is_system_comment?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_priority_options: {
        Row: {
          color_class: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      incident_status_options: {
        Row: {
          color_class: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assigned_to_admin: string | null
          category: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          incident_number: string | null
          priority: string
          school_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_admin?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          incident_number?: string | null
          priority?: string
          school_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_admin?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          incident_number?: string | null
          priority?: string
          school_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_admin_fkey"
            columns: ["assigned_to_admin"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_checkout: {
        Row: {
          cadet_id: string
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string
          checked_out_by: string | null
          condition_on_return: string | null
          expected_return_date: string | null
          id: string
          item_id: string
          notes: string | null
        }
        Insert: {
          cadet_id: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string
          checked_out_by?: string | null
          condition_on_return?: string | null
          expected_return_date?: string | null
          id?: string
          item_id: string
          notes?: string | null
        }
        Update: {
          cadet_id?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string
          checked_out_by?: string | null
          condition_on_return?: string | null
          expected_return_date?: string | null
          id?: string
          item_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_checkout_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_checkout_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_checkout_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_checkout_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_history: {
        Row: {
          changed_by: string | null
          created_at: string
          field_name: string
          id: string
          item_id: string
          new_value: string | null
          old_value: string | null
          school_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          item_id: string
          new_value?: string | null
          old_value?: string | null
          school_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          item_id?: string
          new_value?: string | null
          old_value?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          accountable: boolean | null
          category: string | null
          condition: string | null
          created_at: string
          description: string | null
          gender: string | null
          has_serial_number: boolean | null
          id: string
          issued_to: string[] | null
          item: string
          item_id: string | null
          location: string | null
          model_number: string | null
          notes: string | null
          pending_issue_changes: number | null
          pending_updates: number | null
          pending_write_offs: number | null
          purchase_date: string | null
          purchase_price: number | null
          qty_available: number | null
          qty_issued: number | null
          qty_total: number | null
          returnable: boolean | null
          school_id: string
          serial_number: string | null
          size: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          stock_number: string | null
          sub_category: string | null
          unit_of_measure: string | null
          updated_at: string
        }
        Insert: {
          accountable?: boolean | null
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          has_serial_number?: boolean | null
          id?: string
          issued_to?: string[] | null
          item: string
          item_id?: string | null
          location?: string | null
          model_number?: string | null
          notes?: string | null
          pending_issue_changes?: number | null
          pending_updates?: number | null
          pending_write_offs?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          qty_available?: number | null
          qty_issued?: number | null
          qty_total?: number | null
          returnable?: boolean | null
          school_id: string
          serial_number?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          stock_number?: string | null
          sub_category?: string | null
          unit_of_measure?: string | null
          updated_at?: string
        }
        Update: {
          accountable?: boolean | null
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          has_serial_number?: boolean | null
          id?: string
          issued_to?: string[] | null
          item?: string
          item_id?: string | null
          location?: string | null
          model_number?: string | null
          notes?: string | null
          pending_issue_changes?: number | null
          pending_updates?: number | null
          pending_write_offs?: number | null
          purchase_date?: string | null
          purchase_price?: number | null
          qty_available?: number | null
          qty_issued?: number | null
          qty_total?: number | null
          returnable?: boolean | null
          school_id?: string
          serial_number?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          stock_number?: string | null
          sub_category?: string | null
          unit_of_measure?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      job_board: {
        Row: {
          assistant: string | null
          assistant_source_handle: string | null
          assistant_target_handle: string | null
          cadet_id: string
          created_at: string
          id: string
          reports_to: string | null
          reports_to_source_handle: string | null
          reports_to_target_handle: string | null
          role: string
          school_id: string
          updated_at: string
        }
        Insert: {
          assistant?: string | null
          assistant_source_handle?: string | null
          assistant_target_handle?: string | null
          cadet_id: string
          created_at?: string
          id?: string
          reports_to?: string | null
          reports_to_source_handle?: string | null
          reports_to_target_handle?: string | null
          role: string
          school_id: string
          updated_at?: string
        }
        Update: {
          assistant?: string | null
          assistant_source_handle?: string | null
          assistant_target_handle?: string | null
          cadet_id?: string
          created_at?: string
          id?: string
          reports_to?: string | null
          reports_to_source_handle?: string | null
          reports_to_target_handle?: string | null
          role?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_board_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_board_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      job_board_layout_preferences: {
        Row: {
          created_at: string
          id: string
          job_id: string
          position_x: number
          position_y: number
          school_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          position_x: number
          position_y: number
          school_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          position_x?: number
          position_y?: number
          school_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_board_layout_preferences_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_board"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_board_layout_preferences_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_board_layout_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_actions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      permission_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_history: {
        Row: {
          changed_by: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          profile_id: string
          school_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id: string
          school_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          first_name: string
          flight: string | null
          grade: string | null
          id: string
          last_name: string
          password_change_required: boolean
          phone: string | null
          rank: string | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          first_name: string
          flight?: string | null
          grade?: string | null
          id: string
          last_name: string
          password_change_required?: boolean
          phone?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          first_name?: string
          flight?: string | null
          grade?: string | null
          id?: string
          last_name?: string
          password_change_required?: boolean
          phone?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action_id: string
          created_at: string
          enabled: boolean
          id: string
          module_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          action_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          action_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_tracking: {
        Row: {
          column_default: string | null
          column_name: string
          created_at: string
          data_type: string
          id: string
          is_active: boolean
          is_nullable: boolean
          table_name: string
          updated_at: string
        }
        Insert: {
          column_default?: string | null
          column_name: string
          created_at?: string
          data_type: string
          id?: string
          is_active?: boolean
          is_nullable?: boolean
          table_name: string
          updated_at?: string
        }
        Update: {
          column_default?: string | null
          column_name?: string
          created_at?: string
          data_type?: string
          id?: string
          is_active?: boolean
          is_nullable?: boolean
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          competition_module: boolean | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          jrotc_program: Database["public"]["Enums"]["jrotc_program"] | null
          name: string
          notes: string | null
          phone: string | null
          referred_by: string | null
          state: string | null
          subscription_end: string | null
          subscription_start: string | null
          subtask_number: number | null
          task_number: number | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          competition_module?: boolean | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          name: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          state?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subtask_number?: number | null
          task_number?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          competition_module?: boolean | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          name?: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          state?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subtask_number?: number | null
          task_number?: number | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      subtask_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          is_system_comment: boolean
          subtask_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          is_system_comment?: boolean
          subtask_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          is_system_comment?: boolean
          subtask_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtask_comments_subtask_id_fkey"
            columns: ["subtask_id"]
            isOneToOne: false
            referencedRelation: "subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtask_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string
          priority: string
          school_id: string
          status: string
          task_number: string | null
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id: string
          priority?: string
          school_id: string
          status?: string
          task_number?: string | null
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string
          priority?: string
          school_id?: string
          status?: string
          task_number?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subtasks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          is_system_comment: boolean
          task_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          is_system_comment?: boolean
          task_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          is_system_comment?: boolean
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_priority_options: {
        Row: {
          color_class: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      task_status_options: {
        Row: {
          color_class: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          color_class?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          school_id: string
          status: string
          task_number: string | null
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          school_id: string
          status?: string
          task_number?: string | null
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          school_id?: string
          status?: string
          task_number?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          cadet_id: string
          id: string
          joined_at: string
          role: string | null
          team_id: string
        }
        Insert: {
          cadet_id: string
          id?: string
          joined_at?: string
          role?: string | null
          team_id: string
        }
        Update: {
          cadet_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
          team_lead_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
          team_lead_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          team_lead_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_team_lead_id_fkey"
            columns: ["team_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sidebar_preferences: {
        Row: {
          competitions_columns: string[] | null
          created_at: string
          id: string
          inventory_columns: Json | null
          menu_items: Json
          role_management_columns: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competitions_columns?: string[] | null
          created_at?: string
          id?: string
          inventory_columns?: Json | null
          menu_items?: Json
          role_management_columns?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competitions_columns?: string[] | null
          created_at?: string
          id?: string
          inventory_columns?: Json | null
          menu_items?: Json
          role_management_columns?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sidebar_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_trigger_log: {
        Row: {
          email_id: string
          error_message: string | null
          id: string
          response_status: number | null
          status: string
          trigger_fired_at: string | null
        }
        Insert: {
          email_id: string
          error_message?: string | null
          id?: string
          response_status?: number | null
          status: string
          trigger_fired_at?: string | null
        }
        Update: {
          email_id?: string
          error_message?: string | null
          id?: string
          response_status?: number | null
          status?: string
          trigger_fired_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_permission: {
        Args: { user_id: string; module_name: string; action_name: string }
        Returns: boolean
      }
      decrypt_smtp_password: {
        Args: { encrypted_password: string }
        Returns: string
      }
      encrypt_smtp_password: {
        Args: { password_text: string }
        Returns: string
      }
      generate_incident_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_subtask_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_task_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_incident_category_values: {
        Args: Record<PropertyKey, never>
        Returns: {
          value: string
          label: string
        }[]
      }
      get_incident_status_values: {
        Args: Record<PropertyKey, never>
        Returns: {
          value: string
          label: string
        }[]
      }
      get_next_subtask_number: {
        Args: { school_uuid: string }
        Returns: string
      }
      get_next_task_number: {
        Args: { school_uuid: string }
        Returns: string
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      get_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_email_template: {
        Args: { template_content: string; record_data: Json }
        Returns: string
      }
      queue_email: {
        Args: {
          template_id_param: string
          recipient_email_param: string
          source_table_param: string
          record_id_param: string
          school_id_param: string
        }
        Returns: string
      }
      validate_incident_category: {
        Args: { category_value: string }
        Returns: boolean
      }
      validate_incident_priority: {
        Args: { priority_value: string }
        Returns: boolean
      }
      validate_incident_status: {
        Args: { status_value: string }
        Returns: boolean
      }
      validate_role_transition: {
        Args: { user_id: string; old_role: string; new_role: string }
        Returns: boolean
      }
      validate_task_priority: {
        Args: { priority_value: string }
        Returns: boolean
      }
      validate_task_status: {
        Args: { status_value: string }
        Returns: boolean
      }
    }
    Enums: {
      assignee_type: "team" | "cadet"
      assignment_status: "assigned" | "confirmed" | "declined" | "completed"
      budget_category:
        | "equipment"
        | "uniforms"
        | "travel"
        | "competition"
        | "training"
        | "administrative"
        | "other"
      budget_transaction_category: "expense" | "income"
      comp_event_type:
        | "Armed Inspection"
        | "Armed Color Guard"
        | "Armed Exhibition"
        | "Armed Dual Exhibition"
        | "Armed Regulation"
        | "Armed Solo Exhibition"
        | "Unarmed Inspection"
        | "Unarmed Color Guard"
        | "Unarmed Exhibition"
        | "Unarmed Dual Exhibition"
        | "Unarmed Regulation"
      comp_placement:
        | "NA"
        | "1st"
        | "2nd"
        | "3rd"
        | "4th"
        | "5th"
        | "6th"
        | "7th"
        | "8th"
        | "9th"
        | "10th"
      contact_status: "active" | "semi_active" | "not_active"
      contact_type: "parent" | "relative" | "friend"
      email_log_event: "queued" | "sent" | "failed" | "opened" | "clicked"
      email_queue_status: "pending" | "sent" | "failed" | "cancelled"
      email_trigger_event: "INSERT" | "UPDATE" | "DELETE"
      event_type:
        | "training"
        | "competition"
        | "ceremony"
        | "meeting"
        | "drill"
        | "other"
      expense_status: "pending" | "paid" | "not_paid"
      expense_type: "equipment" | "travel" | "meals" | "supplies" | "other"
      incident_category: "issue" | "request" | "enhancement"
      incident_status:
        | "new"
        | "in_progress"
        | "need_information"
        | "on_hold"
        | "resolved"
        | "canceled"
      income_type: "fundraiser" | "donation" | "other"
      inventory_status:
        | "available"
        | "checked_out"
        | "maintenance"
        | "damaged"
        | "lost"
      jrotc_program:
        | "air_force"
        | "army"
        | "coast_guard"
        | "navy"
        | "marine_corps"
        | "space_force"
      judge_number:
        | "Judge 1"
        | "Judge 2"
        | "Judge 3"
        | "Judge 4"
        | "Judge 5"
        | "Judge 6"
        | "Judge 7"
        | "Judge 8"
        | "Judge 9"
        | "Judge 10"
      payment_method: "cash" | "check" | "debit_card" | "credit_card" | "other"
      rank_type:
        | "cadet_private"
        | "cadet_private_first_class"
        | "cadet_corporal"
        | "cadet_sergeant"
        | "cadet_staff_sergeant"
        | "cadet_sergeant_first_class"
        | "cadet_master_sergeant"
        | "cadet_first_sergeant"
        | "cadet_sergeant_major"
        | "cadet_second_lieutenant"
        | "cadet_first_lieutenant"
        | "cadet_captain"
        | "cadet_major"
        | "cadet_lieutenant_colonel"
        | "cadet_colonel"
      user_role: "admin" | "instructor" | "command_staff" | "cadet" | "parent"
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
      assignee_type: ["team", "cadet"],
      assignment_status: ["assigned", "confirmed", "declined", "completed"],
      budget_category: [
        "equipment",
        "uniforms",
        "travel",
        "competition",
        "training",
        "administrative",
        "other",
      ],
      budget_transaction_category: ["expense", "income"],
      comp_event_type: [
        "Armed Inspection",
        "Armed Color Guard",
        "Armed Exhibition",
        "Armed Dual Exhibition",
        "Armed Regulation",
        "Armed Solo Exhibition",
        "Unarmed Inspection",
        "Unarmed Color Guard",
        "Unarmed Exhibition",
        "Unarmed Dual Exhibition",
        "Unarmed Regulation",
      ],
      comp_placement: [
        "NA",
        "1st",
        "2nd",
        "3rd",
        "4th",
        "5th",
        "6th",
        "7th",
        "8th",
        "9th",
        "10th",
      ],
      contact_status: ["active", "semi_active", "not_active"],
      contact_type: ["parent", "relative", "friend"],
      email_log_event: ["queued", "sent", "failed", "opened", "clicked"],
      email_queue_status: ["pending", "sent", "failed", "cancelled"],
      email_trigger_event: ["INSERT", "UPDATE", "DELETE"],
      event_type: [
        "training",
        "competition",
        "ceremony",
        "meeting",
        "drill",
        "other",
      ],
      expense_status: ["pending", "paid", "not_paid"],
      expense_type: ["equipment", "travel", "meals", "supplies", "other"],
      incident_category: ["issue", "request", "enhancement"],
      incident_status: [
        "new",
        "in_progress",
        "need_information",
        "on_hold",
        "resolved",
        "canceled",
      ],
      income_type: ["fundraiser", "donation", "other"],
      inventory_status: [
        "available",
        "checked_out",
        "maintenance",
        "damaged",
        "lost",
      ],
      jrotc_program: [
        "air_force",
        "army",
        "coast_guard",
        "navy",
        "marine_corps",
        "space_force",
      ],
      judge_number: [
        "Judge 1",
        "Judge 2",
        "Judge 3",
        "Judge 4",
        "Judge 5",
        "Judge 6",
        "Judge 7",
        "Judge 8",
        "Judge 9",
        "Judge 10",
      ],
      payment_method: ["cash", "check", "debit_card", "credit_card", "other"],
      rank_type: [
        "cadet_private",
        "cadet_private_first_class",
        "cadet_corporal",
        "cadet_sergeant",
        "cadet_staff_sergeant",
        "cadet_sergeant_first_class",
        "cadet_master_sergeant",
        "cadet_first_sergeant",
        "cadet_sergeant_major",
        "cadet_second_lieutenant",
        "cadet_first_lieutenant",
        "cadet_captain",
        "cadet_major",
        "cadet_lieutenant_colonel",
        "cadet_colonel",
      ],
      user_role: ["admin", "instructor", "command_staff", "cadet", "parent"],
    },
  },
} as const
