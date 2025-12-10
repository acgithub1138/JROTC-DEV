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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          content: string
          created_at: string
          expire_date: string | null
          id: string
          is_active: boolean
          priority: number
          publish_date: string
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          expire_date?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          publish_date?: string
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          expire_date?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          publish_date?: string
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          record_id: string
          record_type: string
          school_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          record_id: string
          record_type: string
          school_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          record_id?: string
          record_type?: string
          school_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
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
      community_service: {
        Row: {
          cadet_id: string
          created_at: string
          date: string
          event: string | null
          hours: number | null
          id: string
          notes: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          cadet_id: string
          created_at?: string
          date: string
          event?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          cadet_id?: string
          created_at?: string
          date?: string
          event?: string | null
          hours?: number | null
          id?: string
          notes?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_service_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_service_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_event_types: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          initials: string | null
          is_active: boolean
          is_default: boolean
          name: string
          sort_order: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          initials?: string | null
          is_active?: boolean
          is_default?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          initials?: string | null
          is_active?: boolean
          is_default?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          weight?: number | null
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
          cadet_ids: string[] | null
          competition_id: string | null
          created_at: string
          created_by: string | null
          event: string
          id: string
          judge_transcript: string | null
          school_id: string
          score_sheet: Json
          source_competition_id: string | null
          source_type:
            | Database["public"]["Enums"]["competition_source_type"]
            | null
          team_name: string | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          cadet_ids?: string[] | null
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          event: string
          id?: string
          judge_transcript?: string | null
          school_id: string
          score_sheet?: Json
          source_competition_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["competition_source_type"]
            | null
          team_name?: string | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          cadet_ids?: string[] | null
          competition_id?: string | null
          created_at?: string
          created_by?: string | null
          event?: string
          id?: string
          judge_transcript?: string | null
          school_id?: string
          score_sheet?: Json
          source_competition_id?: string | null
          source_type?:
            | Database["public"]["Enums"]["competition_source_type"]
            | null
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
            foreignKeyName: "competition_events_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "competition_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_events_with_templates"
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
      competition_events_history: {
        Row: {
          change_reason: string
          changed_by: string
          competition_event_id: string
          created_at: string
          id: string
          new_values: Json
          old_values: Json
          school_id: string
        }
        Insert: {
          change_reason: string
          changed_by: string
          competition_event_id: string
          created_at?: string
          id?: string
          new_values?: Json
          old_values?: Json
          school_id: string
        }
        Update: {
          change_reason?: string
          changed_by?: string
          competition_event_id?: string
          created_at?: string
          id?: string
          new_values?: Json
          old_values?: Json
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_events_history_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "competition_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_history_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "competition_events_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_history_competition_event_id_fkey"
            columns: ["competition_event_id"]
            isOneToOne: false
            referencedRelation: "judge_score_sheets_view"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_placements: {
        Row: {
          competition_date: string
          competition_id: string
          competition_source: string
          created_at: string | null
          event_name: string
          id: string
          placement: number | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          competition_date: string
          competition_id: string
          competition_source: string
          created_at?: string | null
          event_name: string
          id?: string
          placement?: number | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          competition_date?: string
          competition_id?: string
          competition_source?: string
          created_at?: string | null
          event_name?: string
          id?: string
          placement?: number | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_placements_school_id_fkey"
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
          {
            foreignKeyName: "competition_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event: string
          id: string
          is_active: boolean
          is_global: boolean
          jrotc_program: Database["public"]["Enums"]["jrotc_program"]
          judges: number
          school_id: string | null
          scores: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event: string
          id?: string
          is_active?: boolean
          is_global?: boolean
          jrotc_program: Database["public"]["Enums"]["jrotc_program"]
          judges?: number
          school_id?: string | null
          scores?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event?: string
          id?: string
          is_active?: boolean
          is_global?: boolean
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"]
          judges?: number
          school_id?: string | null
          scores?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_templates_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "competition_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_templates_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_events_with_templates"
            referencedColumns: ["id"]
          },
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
          type_other: string | null
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
          type_other?: string | null
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
          type_other?: string | null
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
      cp_comp_events: {
        Row: {
          competition_id: string
          created_at: string
          created_by: string | null
          end_time: string | null
          event: string | null
          fee: number | null
          id: string
          interval: number | null
          judges_needed: number | null
          location: string | null
          lunch_end_time: string | null
          lunch_start_time: string | null
          max_participants: number | null
          max_points: number | null
          notes: string | null
          required: boolean | null
          school_id: string
          score_sheet: string | null
          sop: string | null
          sop_link: string | null
          sop_text: string | null
          start_time: string | null
          updated_at: string
          updated_by: string | null
          weight: number | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event?: string | null
          fee?: number | null
          id?: string
          interval?: number | null
          judges_needed?: number | null
          location?: string | null
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          max_participants?: number | null
          max_points?: number | null
          notes?: string | null
          required?: boolean | null
          school_id: string
          score_sheet?: string | null
          sop?: string | null
          sop_link?: string | null
          sop_text?: string | null
          start_time?: string | null
          updated_at?: string
          updated_by?: string | null
          weight?: number | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event?: string | null
          fee?: number | null
          id?: string
          interval?: number | null
          judges_needed?: number | null
          location?: string | null
          lunch_end_time?: string | null
          lunch_start_time?: string | null
          max_participants?: number | null
          max_points?: number | null
          notes?: string | null
          required?: boolean | null
          school_id?: string
          score_sheet?: string | null
          sop?: string | null
          sop_link?: string | null
          sop_text?: string | null
          start_time?: string | null
          updated_at?: string
          updated_by?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_comp_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "competition_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_events_with_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_score_sheet_fkey"
            columns: ["score_sheet"]
            isOneToOne: false
            referencedRelation: "competition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_comp_judges: {
        Row: {
          assignment_details: string | null
          competition_id: string
          created_at: string
          created_by: string | null
          end_time: string | null
          event: string | null
          id: string
          judge: string
          location: string | null
          school_id: string
          start_time: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignment_details?: string | null
          competition_id: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event?: string | null
          id?: string
          judge: string
          location?: string | null
          school_id: string
          start_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignment_details?: string | null
          competition_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          event?: string | null
          id?: string
          judge?: string
          location?: string | null
          school_id?: string
          start_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_comp_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_judges_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_comp_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_judges_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_comp_events_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_judges_judge_fkey"
            columns: ["judge"]
            isOneToOne: false
            referencedRelation: "cp_judge_assignment_view"
            referencedColumns: ["judge_id"]
          },
          {
            foreignKeyName: "cp_comp_judges_judge_fkey"
            columns: ["judge"]
            isOneToOne: false
            referencedRelation: "cp_judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_judges_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_comp_resources: {
        Row: {
          assignment_details: string | null
          competition_id: string
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          location: string | null
          resource: string
          school_id: string
          start_time: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assignment_details?: string | null
          competition_id: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          resource: string
          school_id: string
          start_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assignment_details?: string | null
          competition_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          resource?: string
          school_id?: string
          start_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_resources_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_comp_resources_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_resources_resource_fkey"
            columns: ["resource"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_resources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_comp_schools: {
        Row: {
          calendar_event_id: string | null
          color: string | null
          competition_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          paid: boolean
          registration_source: string
          resource: string | null
          school_id: string | null
          school_initials: string | null
          school_name: string | null
          status: string
          total_fee: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          calendar_event_id?: string | null
          color?: string | null
          competition_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          paid?: boolean
          registration_source?: string
          resource?: string | null
          school_id?: string | null
          school_initials?: string | null
          school_name?: string | null
          status?: string
          total_fee?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          calendar_event_id?: string | null
          color?: string | null
          competition_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          paid?: boolean
          registration_source?: string
          resource?: string | null
          school_id?: string | null
          school_initials?: string | null
          school_name?: string | null
          status?: string
          total_fee?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_schools_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_schools_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_comp_schools_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_schools_resource_fkey"
            columns: ["resource"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_competitions: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          fee: number | null
          hosting_school: string | null
          id: string
          is_public: boolean
          latitude: string | null
          location: string
          longitude: string | null
          max_participants: number | null
          name: string
          program: Database["public"]["Enums"]["jrotc_program"] | null
          registration_deadline: string | null
          school_id: string
          sop: string | null
          sop_link: string | null
          sop_text: string | null
          start_date: string
          state: string | null
          status: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          fee?: number | null
          hosting_school?: string | null
          id?: string
          is_public?: boolean
          latitude?: string | null
          location: string
          longitude?: string | null
          max_participants?: number | null
          name: string
          program?: Database["public"]["Enums"]["jrotc_program"] | null
          registration_deadline?: string | null
          school_id: string
          sop?: string | null
          sop_link?: string | null
          sop_text?: string | null
          start_date: string
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          fee?: number | null
          hosting_school?: string | null
          id?: string
          is_public?: boolean
          latitude?: string | null
          location?: string
          longitude?: string | null
          max_participants?: number | null
          name?: string
          program?: Database["public"]["Enums"]["jrotc_program"] | null
          registration_deadline?: string | null
          school_id?: string
          sop?: string | null
          sop_link?: string | null
          sop_text?: string | null
          start_date?: string
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_competitions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_event_registrations: {
        Row: {
          competition_id: string
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          notes: string | null
          preferred_time_request: Json | null
          school_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          notes?: string | null
          preferred_time_request?: Json | null
          school_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          preferred_time_request?: Json | null
          school_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_event_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_event_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_event_schedules: {
        Row: {
          competition_id: string
          created_at: string
          created_by: string | null
          duration: number
          event_id: string
          id: string
          scheduled_time: string
          school_id: string
          school_name: string | null
          updated_at: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          created_by?: string | null
          duration?: number
          event_id: string
          id?: string
          scheduled_time: string
          school_id: string
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          created_by?: string | null
          duration?: number
          event_id?: string
          id?: string
          scheduled_time?: string
          school_id?: string
          school_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cp_event_schedules_competition"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "fk_cp_event_schedules_competition"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cp_event_schedules_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cp_event_schedules_event"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cp_event_schedules_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_events: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          jrotc_program: Database["public"]["Enums"]["jrotc_program"] | null
          name: string
          school_id: string
          score_sheet: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          name: string
          school_id: string
          score_sheet?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          name?: string
          school_id?: string
          score_sheet?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cp_events_score_sheet_fkey"
            columns: ["score_sheet"]
            isOneToOne: false
            referencedRelation: "competition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_judge_competition_registrations: {
        Row: {
          availability_notes: string | null
          competition_id: string
          created_at: string
          created_by: string | null
          decline_reason: string | null
          id: string
          judge_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          availability_notes?: string | null
          competition_id: string
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          id?: string
          judge_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          availability_notes?: string | null
          competition_id?: string
          created_at?: string
          created_by?: string | null
          decline_reason?: string | null
          id?: string
          judge_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_judge_competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_judge_competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_judge_competition_registrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_judge_competition_registrations_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "cp_judge_assignment_view"
            referencedColumns: ["judge_id"]
          },
          {
            foreignKeyName: "cp_judge_competition_registrations_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "cp_judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_judge_competition_registrations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_judges: {
        Row: {
          available: boolean
          bio: string | null
          branch: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          rank: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          available?: boolean
          bio?: string | null
          branch?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          rank?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          available?: boolean
          bio?: string | null
          branch?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          rank?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_judges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      criteria_mappings: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          event_type: string
          id: string
          is_global: boolean
          original_criteria: Json
          school_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          event_type: string
          id?: string
          is_global?: boolean
          original_criteria?: Json
          school_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          event_type?: string
          id?: string
          is_global?: boolean
          original_criteria?: Json
          school_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      default_role_permissions: {
        Row: {
          action_id: string
          created_at: string
          enabled: boolean
          id: string
          module_id: string
          role_id: string | null
        }
        Insert: {
          action_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id: string
          role_id?: string | null
        }
        Update: {
          action_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id?: string
          role_id?: string | null
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
          {
            foreignKeyName: "default_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_processing_lock: {
        Row: {
          id: number
          is_locked: boolean
          last_error: string | null
          last_processed_at: string | null
          locked_at: string | null
          locked_by: string | null
          processor_version: string | null
        }
        Insert: {
          id?: number
          is_locked?: boolean
          last_error?: string | null
          last_processed_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          processor_version?: string | null
        }
        Update: {
          id?: number
          is_locked?: boolean
          last_error?: string | null
          last_processed_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          processor_version?: string | null
        }
        Relationships: []
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
          last_attempt_at: string | null
          max_retries: number | null
          next_retry_at: string | null
          recipient_email: string
          record_id: string | null
          retry_count: number | null
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
          last_attempt_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          recipient_email: string
          record_id?: string | null
          retry_count?: number | null
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
          last_attempt_at?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          recipient_email?: string
          record_id?: string | null
          retry_count?: number | null
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
      email_queue_health: {
        Row: {
          check_timestamp: string | null
          created_at: string | null
          failed_count: number
          health_status: string
          id: string
          pending_count: number
          processing_time_avg_ms: number | null
          school_id: string
          stuck_count: number
        }
        Insert: {
          check_timestamp?: string | null
          created_at?: string | null
          failed_count?: number
          health_status?: string
          id?: string
          pending_count?: number
          processing_time_avg_ms?: number | null
          school_id: string
          stuck_count?: number
        }
        Update: {
          check_timestamp?: string | null
          created_at?: string | null
          failed_count?: number
          health_status?: string
          id?: string
          pending_count?: number
          processing_time_avg_ms?: number | null
          school_id?: string
          stuck_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_health_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      email_rule_usage_log: {
        Row: {
          error_message: string | null
          id: string
          processing_time_ms: number | null
          recipient_email: string
          record_id: string
          rule_id: string
          school_id: string
          success: boolean
          trigger_operation: string
          trigger_table: string
          triggered_at: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          recipient_email: string
          record_id: string
          rule_id: string
          school_id: string
          success?: boolean
          trigger_operation: string
          trigger_table: string
          triggered_at?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          processing_time_ms?: number | null
          recipient_email?: string
          record_id?: string
          rule_id?: string
          school_id?: string
          success?: boolean
          trigger_operation?: string
          trigger_table?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_rule_usage_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "email_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_rule_usage_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      email_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          rule_type: string
          school_id: string
          template_id: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type: string
          school_id: string
          template_id?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          rule_type?: string
          school_id?: string
          template_id?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_rules_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_rules_template_id_fkey"
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
          is_global: boolean | null
          name: string
          recipient_field: string | null
          school_id: string | null
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
          is_global?: boolean | null
          name: string
          recipient_field?: string | null
          school_id?: string | null
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
          is_global?: boolean | null
          name?: string
          recipient_field?: string | null
          school_id?: string | null
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
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          order: number | null
          school_id: string | null
          updated_at: string
          value: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          order?: number | null
          school_id?: string | null
          updated_at?: string
          value: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          order?: number | null
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
          event_type: string | null
          id: string
          is_all_day: boolean
          is_recurring: boolean | null
          location: string | null
          parent_event_id: string | null
          recurrence_end_date: string | null
          recurrence_rule: Json | null
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
          event_type?: string | null
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean | null
          location?: string | null
          parent_event_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: Json | null
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
          event_type?: string | null
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean | null
          location?: string | null
          parent_event_id?: string | null
          recurrence_end_date?: string | null
          recurrence_rule?: Json | null
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
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      icons: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
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
          cadet_id: string | null
          connections: Json | null
          created_at: string
          email_address: string | null
          id: string
          reports_to: string | null
          role: string
          school_id: string
          updated_at: string
        }
        Insert: {
          assistant?: string | null
          cadet_id?: string | null
          connections?: Json | null
          created_at?: string
          email_address?: string | null
          id?: string
          reports_to?: string | null
          role: string
          school_id: string
          updated_at?: string
        }
        Update: {
          assistant?: string | null
          cadet_id?: string | null
          connections?: Json | null
          created_at?: string
          email_address?: string | null
          id?: string
          reports_to?: string | null
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
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          position_x: number
          position_y: number
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          position_x?: number
          position_y?: number
          school_id?: string
          updated_at?: string
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
        ]
      }
      permission_actions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_widget: boolean
          label: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_widget?: boolean
          label: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_widget?: boolean
          label?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      permission_modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_competition_portal: boolean | null
          is_tab: boolean
          label: string
          name: string
          parent_module: string | null
          path: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_competition_portal?: boolean | null
          is_tab?: boolean
          label: string
          name: string
          parent_module?: string | null
          path?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_competition_portal?: boolean | null
          is_tab?: boolean
          label?: string
          name?: string
          parent_module?: string | null
          path?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_modules_parent_module_fkey"
            columns: ["parent_module"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
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
          school_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id: string
          school_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id?: string
          school_id?: string | null
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
          cadet_year: Database["public"]["Enums"]["cadet_year"] | null
          created_at: string
          email: string
          first_name: string
          flight: string | null
          grade: string | null
          id: string
          job_role_email: string | null
          last_name: string | null
          password_change_required: boolean
          phone: string | null
          rank: string | null
          role: string
          role_id: string | null
          school_id: string | null
          start_year: number | null
          temp_pswd: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cadet_year?: Database["public"]["Enums"]["cadet_year"] | null
          created_at?: string
          email: string
          first_name: string
          flight?: string | null
          grade?: string | null
          id: string
          job_role_email?: string | null
          last_name?: string | null
          password_change_required?: boolean
          phone?: string | null
          rank?: string | null
          role: string
          role_id?: string | null
          school_id?: string | null
          start_year?: number | null
          temp_pswd?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cadet_year?: Database["public"]["Enums"]["cadet_year"] | null
          created_at?: string
          email?: string
          first_name?: string
          flight?: string | null
          grade?: string | null
          id?: string
          job_role_email?: string | null
          last_name?: string | null
          password_change_required?: boolean
          phone?: string | null
          rank?: string | null
          role?: string
          role_id?: string | null
          school_id?: string | null
          start_year?: number | null
          temp_pswd?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      pt_tests: {
        Row: {
          cadet_id: string
          created_at: string
          date: string
          id: string
          mile_time: number | null
          plank_time: number | null
          push_ups: number | null
          school_id: string
          sit_ups: number | null
          updated_at: string
        }
        Insert: {
          cadet_id: string
          created_at?: string
          date: string
          id?: string
          mile_time?: number | null
          plank_time?: number | null
          push_ups?: number | null
          school_id: string
          sit_ups?: number | null
          updated_at?: string
        }
        Update: {
          cadet_id?: string
          created_at?: string
          date?: string
          id?: string
          mile_time?: number | null
          plank_time?: number | null
          push_ups?: number | null
          school_id?: string
          sit_ups?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pt_tests_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pt_tests_school_id_fkey"
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
          role_id: string | null
          updated_at: string
        }
        Insert: {
          action_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id: string
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          action_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          module_id?: string
          role_id?: string | null
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
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
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
          app_access: Json | null
          ccc_portal: boolean | null
          city: string | null
          comp_analytics: boolean | null
          comp_basic: boolean
          comp_hosting: boolean | null
          contact: string | null
          created_at: string
          email: string | null
          id: string
          initials: string | null
          jrotc_program: Database["public"]["Enums"]["jrotc_program"] | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          referred_by: string | null
          shared_pictures_url: string | null
          state: string | null
          subscription_end: string | null
          subscription_start: string | null
          subtask_number: number | null
          task_number: number | null
          timezone: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          app_access?: Json | null
          ccc_portal?: boolean | null
          city?: string | null
          comp_analytics?: boolean | null
          comp_basic?: boolean
          comp_hosting?: boolean | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string | null
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          shared_pictures_url?: string | null
          state?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subtask_number?: number | null
          task_number?: number | null
          timezone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          app_access?: Json | null
          ccc_portal?: boolean | null
          city?: string | null
          comp_analytics?: boolean | null
          comp_basic?: boolean
          comp_hosting?: boolean | null
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          initials?: string | null
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          referred_by?: string | null
          shared_pictures_url?: string | null
          state?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subtask_number?: number | null
          task_number?: number | null
          timezone?: string | null
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
      subtask_overdue_reminders: {
        Row: {
          created_at: string
          email_queue_id: string | null
          id: string
          reminder_type: string
          school_id: string
          sent_at: string
          subtask_id: string
        }
        Insert: {
          created_at?: string
          email_queue_id?: string | null
          id?: string
          reminder_type: string
          school_id: string
          sent_at?: string
          subtask_id: string
        }
        Update: {
          created_at?: string
          email_queue_id?: string | null
          id?: string
          reminder_type?: string
          school_id?: string
          sent_at?: string
          subtask_id?: string
        }
        Relationships: []
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
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_overdue_reminders: {
        Row: {
          created_at: string
          email_queue_id: string | null
          id: string
          reminder_type: string
          school_id: string
          sent_at: string
          task_id: string
        }
        Insert: {
          created_at?: string
          email_queue_id?: string | null
          id?: string
          reminder_type: string
          school_id: string
          sent_at?: string
          task_id: string
        }
        Update: {
          created_at?: string
          email_queue_id?: string | null
          id?: string
          reminder_type?: string
          school_id?: string
          sent_at?: string
          task_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
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
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
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
      themes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          jrotc_program: Database["public"]["Enums"]["jrotc_program"]
          link_hover: string | null
          link_selected_text: string | null
          link_text: string | null
          primary_color: string
          school_id: string | null
          secondary_color: string
          theme_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          jrotc_program: Database["public"]["Enums"]["jrotc_program"]
          link_hover?: string | null
          link_selected_text?: string | null
          link_text?: string | null
          primary_color?: string
          school_id?: string | null
          secondary_color?: string
          theme_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"]
          link_hover?: string | null
          link_selected_text?: string | null
          link_text?: string | null
          primary_color?: string
          school_id?: string | null
          secondary_color?: string
          theme_image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      uniform_inspections: {
        Row: {
          cadet_id: string
          created_at: string
          date: string
          grade: number | null
          id: string
          notes: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          cadet_id: string
          created_at?: string
          date: string
          grade?: number | null
          id?: string
          notes?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          cadet_id?: string
          created_at?: string
          date?: string
          grade?: number | null
          id?: string
          notes?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "uniform_inspections_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uniform_inspections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          admin_only: boolean
          created_at: string
          id: string
          is_active: boolean
          role_label: string
          role_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          admin_only?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          role_label: string
          role_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          admin_only?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          role_label?: string
          role_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
      competition_events_unified: {
        Row: {
          cadet_ids: string[] | null
          competition_date: string | null
          competition_id: string | null
          competition_location: string | null
          competition_name: string | null
          created_at: string | null
          created_by: string | null
          event: string | null
          id: string | null
          judge_transcript: string | null
          school_id: string | null
          score_sheet: Json | null
          source_competition_id: string | null
          source_type:
            | Database["public"]["Enums"]["competition_source_type"]
            | null
          team_name: string | null
          total_points: number | null
          unified_competition_id: string | null
          updated_at: string | null
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
            foreignKeyName: "competition_events_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "competition_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_events_with_templates"
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
      competition_events_with_registrations: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          jrotc_program: Database["public"]["Enums"]["jrotc_program"] | null
          name: string | null
          registration_count: number | null
          school_id: string | null
          score_sheet: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          name?: string | null
          registration_count?: never
          school_id?: string | null
          score_sheet?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          jrotc_program?: Database["public"]["Enums"]["jrotc_program"] | null
          name?: string | null
          registration_count?: never
          school_id?: string | null
          score_sheet?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_events_score_sheet_fkey"
            columns: ["score_sheet"]
            isOneToOne: false
            referencedRelation: "competition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_registration_email_data: {
        Row: {
          base_fee: number | null
          base_fee_formatted: string | null
          competition_address: string | null
          competition_base_fee: number | null
          competition_city: string | null
          competition_description: string | null
          competition_end_date: string | null
          competition_id: string | null
          competition_location: string | null
          competition_name: string | null
          competition_start_date: string | null
          competition_state: string | null
          competition_zip: string | null
          event_fees_formatted: string | null
          hosting_school: string | null
          paid_status: boolean | null
          registered_events_count: number | null
          registered_events_json: Json | null
          registered_events_text: string | null
          registration_date: string | null
          registration_deadline: string | null
          registration_id: string | null
          registration_notes: string | null
          registration_source: string | null
          registration_status: string | null
          school_calculated_total: number | null
          school_id: string | null
          school_initials: string | null
          school_name: string | null
          total_cost: number | null
          total_cost_formatted: string | null
          total_event_fees: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_comp_events_detailed: {
        Row: {
          competition_id: string | null
          created_at: string | null
          end_time: string | null
          event: string | null
          event_description: string | null
          event_name: string | null
          fee: number | null
          id: string | null
          interval: number | null
          location: string | null
          max_participants: number | null
          notes: string | null
          registration_count: number | null
          school_id: string | null
          score_sheet: string | null
          start_time: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_comp_events_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "competition_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_events_with_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_score_sheet_fkey"
            columns: ["score_sheet"]
            isOneToOne: false
            referencedRelation: "competition_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_event_time_requests: {
        Row: {
          competition_id: string | null
          event_id: string | null
          event_initials: string | null
          event_name: string | null
          event_type_id: string | null
          id: string | null
          preferred_time_request: Json | null
          school_id: string | null
          school_initials: string | null
          school_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_events_event_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "competition_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_events_event_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "cp_events_with_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_event_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_event_registrations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_events_with_templates: {
        Row: {
          id: string | null
          jrotc_program: Database["public"]["Enums"]["jrotc_program"] | null
          name: string | null
        }
        Relationships: []
      }
      cp_judge_assignment_view: {
        Row: {
          assignment_details: string | null
          assignment_id: string | null
          competition_end_date: string | null
          competition_id: string | null
          competition_location: string | null
          competition_name: string | null
          competition_start_date: string | null
          competition_status: string | null
          created_at: string | null
          event_end_time: string | null
          event_id: string | null
          event_location: string | null
          event_name: string | null
          event_start_time: string | null
          judge_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competition_registration_email_data"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "cp_comp_judges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "cp_competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_judges_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_comp_judges_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cp_comp_events_detailed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cp_judges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cp_resource_locations: {
        Row: {
          location: string | null
          school_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cp_comp_resources_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_stats: {
        Row: {
          active_incidents: number | null
          active_tasks: number | null
          community_service_hours: number | null
          community_service_records: number | null
          in_stock_count: number | null
          net_budget: number | null
          out_of_stock_count: number | null
          overdue_incidents: number | null
          overdue_tasks: number | null
          school_id: string | null
          total_cadets: number | null
          total_expenses: number | null
          total_income: number | null
          total_inventory: number | null
          total_issued: number | null
          urgent_critical_incidents: number | null
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
      judge_score_sheets_view: {
        Row: {
          competition_end_date: string | null
          competition_location: string | null
          competition_name: string | null
          competition_start_date: string | null
          competition_status: string | null
          created_at: string | null
          created_by: string | null
          event: string | null
          event_name: string | null
          id: string | null
          school_id: string | null
          school_initials: string | null
          school_name: string | null
          score_sheet: Json | null
          source_competition_id: string | null
          total_points: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_events_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "competition_event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_events_event_type_id_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "cp_events_with_templates"
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
      parent_cadet_tasks: {
        Row: {
          cadet_id: string | null
          cadet_name: string | null
          due_date: string | null
          id: string | null
          is_subtask: boolean | null
          parent_email: string | null
          parent_task_title: string | null
          priority: string | null
          school_id: string | null
          status: string | null
          task_number: string | null
          task_type: string | null
          title: string | null
        }
        Relationships: []
      }
      role_permission_details: {
        Row: {
          action_id: string | null
          enabled: boolean | null
          module_id: string | null
          role_id: string | null
          role_name: string | null
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
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_competitions: {
        Row: {
          armed_color_guard:
            | Database["public"]["Enums"]["comp_placement"]
            | null
          armed_exhibition: Database["public"]["Enums"]["comp_placement"] | null
          armed_inspection: Database["public"]["Enums"]["comp_placement"] | null
          armed_regulation: Database["public"]["Enums"]["comp_placement"] | null
          cadets: string[] | null
          comp_type: Database["public"]["Enums"]["jrotc_program"] | null
          competition_date: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location: string | null
          name: string | null
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
          source_competition_id: string | null
          source_type: string | null
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
          updated_at: string | null
        }
        Relationships: []
      }
      tasks_with_profiles: {
        Row: {
          assigned_by: string | null
          assigned_by_email: string | null
          assigned_by_first_name: string | null
          assigned_by_last_name: string | null
          assigned_to: string | null
          assigned_to_email: string | null
          assigned_to_first_name: string | null
          assigned_to_last_name: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string | null
          priority: string | null
          school_id: string | null
          status: string | null
          task_number: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
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
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_with_members"
            referencedColumns: ["id"]
          },
        ]
      }
      teams_with_members: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          member_count: number | null
          name: string | null
          school_id: string | null
          team_lead_email: string | null
          team_lead_first_name: string | null
          team_lead_id: string | null
          team_lead_last_name: string | null
          team_members: Json | null
          updated_at: string | null
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
    }
    Functions: {
      add_user_role_to_table: {
        Args: {
          admin_only_param?: boolean
          role_label_param?: string
          role_name_param: string
        }
        Returns: string
      }
      can_judge_access: {
        Args: { action_name: string; module_name: string }
        Returns: boolean
      }
      can_link_attachment_to_competition_event: {
        Args: { _record_id: string; _school_id: string }
        Returns: boolean
      }
      can_manage_user_role: {
        Args: { target_role_name: string }
        Returns: boolean
      }
      can_update_profile_role: {
        Args: {
          new_role: string
          new_role_id: string
          target_profile_id: string
        }
        Returns: boolean
      }
      can_update_profile_role1: {
        Args: {
          new_role: string
          new_role_id: string
          target_profile_id: string
        }
        Returns: boolean
      }
      can_user_access: {
        Args: { action_name: string; module_name: string }
        Returns: boolean
      }
      can_user_global: {
        Args: { action_name: string; module_name: string }
        Returns: boolean
      }
      check_email_queue_health: {
        Args: never
        Returns: {
          failed_count: number
          health_status: string
          pending_count: number
          processing_time_avg_ms: number
          school_id: string
          stuck_count: number
        }[]
      }
      check_judge_permission: {
        Args: { action_name: string; module_name: string; user_id: string }
        Returns: boolean
      }
      check_user_permission: {
        Args: { action_name: string; module_name: string; user_id: string }
        Returns: boolean
      }
      clear_password_change_requirement: { Args: never; Returns: undefined }
      clear_stale_email_processing_locks: { Args: never; Returns: number }
      create_email_rules_for_school: {
        Args: { school_uuid: string }
        Returns: undefined
      }
      crosstab: { Args: { "": string }; Returns: Record<string, unknown>[] }
      crosstab2: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["tablefunc_crosstab_2"][]
        SetofOptions: {
          from: "*"
          to: "tablefunc_crosstab_2"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      crosstab3: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["tablefunc_crosstab_3"][]
        SetofOptions: {
          from: "*"
          to: "tablefunc_crosstab_3"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      crosstab4: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["tablefunc_crosstab_4"][]
        SetofOptions: {
          from: "*"
          to: "tablefunc_crosstab_4"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      current_user_has_permission: {
        Args: { action_name: string; module_name: string }
        Returns: boolean
      }
      deactivate_expired_announcements: { Args: never; Returns: Json }
      find_similar_criteria: {
        Args: { criteria_text: string; event_type_param: string }
        Returns: {
          display_name: string
          id: string
          original_criteria: Json
          similarity_score: number
          usage_count: number
        }[]
      }
      generate_incident_number: { Args: never; Returns: string }
      get_all_roles: {
        Args: never
        Returns: {
          can_be_assigned: boolean
          role_label: string
          role_name: string
        }[]
      }
      get_assignable_roles: {
        Args: never
        Returns: {
          can_be_assigned: boolean
          role_label: string
          role_name: string
        }[]
      }
      get_cadet_info_for_parent_registration: {
        Args: { email_param: string }
        Returns: {
          cadet_exists: boolean
          cadet_id: string
          school_id: string
        }[]
      }
      get_current_user_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_current_user_school_id_safe: { Args: never; Returns: string }
      get_incident_category_values: {
        Args: never
        Returns: {
          label: string
          value: string
        }[]
      }
      get_incident_status_values: {
        Args: never
        Returns: {
          label: string
          value: string
        }[]
      }
      get_next_subtask_number: {
        Args: { school_uuid: string }
        Returns: string
      }
      get_next_task_number: { Args: { school_uuid: string }; Returns: string }
      get_permission_modules_simple: {
        Args: {
          is_active_param?: boolean
          is_tab_param?: boolean
          parent_module_param?: string
        }
        Returns: {
          icon: string
          id: string
          is_competition_portal: boolean
          is_tab: boolean
          label: string
          name: string
          parent_module: string
          path: string
          sort_order: number
        }[]
      }
      get_stuck_emails: {
        Args: { threshold_time?: string }
        Returns: {
          body: string
          created_at: string
          id: string
          last_attempt_at: string
          recipient_email: string
          retry_count: number
          school_id: string
          subject: string
        }[]
      }
      get_table_columns: {
        Args: { table_name: string }
        Returns: {
          column_name: string
          data_type: string
        }[]
      }
      get_user_school_id: { Args: never; Returns: string }
      increment_mapping_usage: {
        Args: { mapping_id: string }
        Returns: undefined
      }
      is_current_user_admin_role: { Args: never; Returns: boolean }
      is_user_in_school: {
        Args: { target_school_id: string }
        Returns: boolean
      }
      log_email_rule_usage: {
        Args: {
          p_error_message?: string
          p_processing_time_ms?: number
          p_recipient_email: string
          p_record_id: string
          p_rule_id: string
          p_school_id?: string
          p_success?: boolean
          p_trigger_operation: string
          p_trigger_table: string
        }
        Returns: undefined
      }
      populate_comp_schools_names: { Args: never; Returns: undefined }
      process_comment_email_notification: {
        Args: {
          commenter_id_param: string
          record_id_param: string
          school_id_param: string
          source_table_param: string
        }
        Returns: Json
      }
      process_delayed_comp_registration_emails: { Args: never; Returns: Json }
      process_email_batch: {
        Args: { batch_size?: number }
        Returns: {
          details: Json
          failed_count: number
          processed_count: number
        }[]
      }
      process_email_rules_manual: {
        Args: {
          operation_type_param: string
          record_id_param: string
          school_id_param: string
          source_table_param: string
        }
        Returns: Json
      }
      process_email_template: {
        Args: { record_data: Json; template_content: string }
        Returns: string
      }
      process_overdue_task_reminders: { Args: never; Returns: Json }
      queue_delayed_comp_registration_email: { Args: never; Returns: undefined }
      queue_email: {
        Args: {
          recipient_email_param: string
          record_id_param: string
          rule_id_param?: string
          school_id_param: string
          source_table_param: string
          template_id_param: string
        }
        Returns: string
      }
      replace_template_variables: {
        Args: { data_json: Json; template_text: string }
        Returns: string
      }
      resolve_user_email_with_job_priority: {
        Args: { school_id_param: string; user_id_param: string }
        Returns: {
          email: string
          source: string
        }[]
      }
      retry_stuck_emails: {
        Args: { max_age_minutes?: number }
        Returns: {
          email_id: string
          retry_count: number
          school_id: string
        }[]
      }
      setup_role_permissions: {
        Args: { role_name: string }
        Returns: undefined
      }
      update_competition_statuses: { Args: never; Returns: Json }
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
        Args: { new_role_id: string; old_role_id: string; user_id: string }
        Returns: boolean
      }
      validate_task_priority: {
        Args: { priority_value: string }
        Returns: boolean
      }
      validate_task_status: { Args: { status_value: string }; Returns: boolean }
      verify_cadet_email_exists: {
        Args: { email_param: string }
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
      cadet_year: "1st" | "2nd" | "3rd" | "4th"
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
      competition_source_type: "internal" | "portal"
      contact_status: "active" | "semi_active" | "not_active"
      contact_type: "parent" | "relative" | "friend" | "other"
      email_log_event: "queued" | "sent" | "failed" | "opened" | "clicked"
      email_queue_status:
        | "pending"
        | "processing"
        | "sent"
        | "failed"
        | "cancelled"
        | "rate_limited"
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
    }
    CompositeTypes: {
      tablefunc_crosstab_2: {
        row_name: string | null
        category_1: string | null
        category_2: string | null
      }
      tablefunc_crosstab_3: {
        row_name: string | null
        category_1: string | null
        category_2: string | null
        category_3: string | null
      }
      tablefunc_crosstab_4: {
        row_name: string | null
        category_1: string | null
        category_2: string | null
        category_3: string | null
        category_4: string | null
      }
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
      cadet_year: ["1st", "2nd", "3rd", "4th"],
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
      competition_source_type: ["internal", "portal"],
      contact_status: ["active", "semi_active", "not_active"],
      contact_type: ["parent", "relative", "friend", "other"],
      email_log_event: ["queued", "sent", "failed", "opened", "clicked"],
      email_queue_status: [
        "pending",
        "processing",
        "sent",
        "failed",
        "cancelled",
        "rate_limited",
      ],
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
    },
  },
} as const
