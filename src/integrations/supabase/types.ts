export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budget: {
        Row: {
          allocated_amount: number
          category: Database["public"]["Enums"]["budget_category"]
          created_at: string
          created_by: string | null
          description: string | null
          fiscal_year: number
          id: string
          name: string
          school_id: string
          spent_amount: number
          updated_at: string
        }
        Insert: {
          allocated_amount?: number
          category: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          fiscal_year: number
          id?: string
          name: string
          school_id: string
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          category?: Database["public"]["Enums"]["budget_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          fiscal_year?: number
          id?: string
          name?: string
          school_id?: string
          spent_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      business_rule_logs: {
        Row: {
          action_details: Json
          action_type: string
          after_values: Json | null
          before_values: Json | null
          business_rule_id: string
          error_message: string | null
          executed_at: string
          execution_time_ms: number | null
          id: string
          school_id: string
          success: boolean
          target_record_id: string | null
          target_table: string
          trigger_event: string
        }
        Insert: {
          action_details?: Json
          action_type: string
          after_values?: Json | null
          before_values?: Json | null
          business_rule_id: string
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          id?: string
          school_id: string
          success?: boolean
          target_record_id?: string | null
          target_table: string
          trigger_event: string
        }
        Update: {
          action_details?: Json
          action_type?: string
          after_values?: Json | null
          before_values?: Json | null
          business_rule_id?: string
          error_message?: string | null
          executed_at?: string
          execution_time_ms?: number | null
          id?: string
          school_id?: string
          success?: boolean
          target_record_id?: string | null
          target_table?: string
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_rule_logs_business_rule_id_fkey"
            columns: ["business_rule_id"]
            isOneToOne: false
            referencedRelation: "business_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_rule_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      business_rules: {
        Row: {
          actions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          last_executed: string | null
          name: string
          school_id: string
          trigger_conditions: Json
          trigger_table: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_executed?: string | null
          name: string
          school_id: string
          trigger_conditions?: Json
          trigger_table?: string | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          last_executed?: string | null
          name?: string
          school_id?: string
          trigger_conditions?: Json
          trigger_table?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cadets: {
        Row: {
          attendance_percentage: number | null
          cadet_id: string
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          enlistment_date: string | null
          gpa: number | null
          grade_level: number | null
          graduation_date: string | null
          id: string
          medical_conditions: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          profile_id: string
          school_id: string
          uniform_size: string | null
          updated_at: string
        }
        Insert: {
          attendance_percentage?: number | null
          cadet_id: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enlistment_date?: string | null
          gpa?: number | null
          grade_level?: number | null
          graduation_date?: string | null
          id?: string
          medical_conditions?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          profile_id: string
          school_id: string
          uniform_size?: string | null
          updated_at?: string
        }
        Update: {
          attendance_percentage?: number | null
          cadet_id?: string
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          enlistment_date?: string | null
          gpa?: number | null
          grade_level?: number | null
          graduation_date?: string | null
          id?: string
          medical_conditions?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          profile_id?: string
          school_id?: string
          uniform_size?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadets_school_id_fkey"
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
          notes: string | null
          placement: number | null
          school_id: string
          score: number | null
          team_id: string | null
        }
        Insert: {
          cadet_id?: string | null
          competition_id: string
          created_at?: string
          id?: string
          notes?: string | null
          placement?: number | null
          school_id: string
          score?: number | null
          team_id?: string | null
        }
        Update: {
          cadet_id?: string | null
          competition_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          placement?: number | null
          school_id?: string
          score?: number | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_results_cadet_id_fkey"
            columns: ["cadet_id"]
            isOneToOne: false
            referencedRelation: "cadets"
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
      competitions: {
        Row: {
          competition_date: string
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
          registration_deadline: string | null
          type: Database["public"]["Enums"]["competition_type"]
          updated_at: string
        }
        Insert: {
          competition_date: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          registration_deadline?: string | null
          type: Database["public"]["Enums"]["competition_type"]
          updated_at?: string
        }
        Update: {
          competition_date?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          registration_deadline?: string | null
          type?: Database["public"]["Enums"]["competition_type"]
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          organization: string | null
          phone: string | null
          school_id: string
          state: string | null
          title: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          school_id: string
          state?: string | null
          title?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          school_id?: string
          state?: string | null
          title?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
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
            foreignKeyName: "expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budget"
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
            referencedRelation: "cadets"
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
      inventory_items: {
        Row: {
          category: string | null
          condition: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          school_id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          updated_at: string
        }
        Insert: {
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          school_id: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          updated_at?: string
        }
        Update: {
          category?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          school_id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
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
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          rank: Database["public"]["Enums"]["rank_type"] | null
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          rank?: Database["public"]["Enums"]["rank_type"] | null
          role?: Database["public"]["Enums"]["user_role"]
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          rank?: Database["public"]["Enums"]["rank_type"] | null
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
          created_at: string
          district: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
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
          priority: Database["public"]["Enums"]["task_priority"]
          school_id: string
          status: Database["public"]["Enums"]["task_status"]
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
          priority?: Database["public"]["Enums"]["task_priority"]
          school_id: string
          status?: Database["public"]["Enums"]["task_status"]
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
          priority?: Database["public"]["Enums"]["task_priority"]
          school_id?: string
          status?: Database["public"]["Enums"]["task_status"]
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
            referencedRelation: "cadets"
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
          created_at: string
          id: string
          menu_items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_items?: Json
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      budget_category:
        | "equipment"
        | "uniforms"
        | "travel"
        | "competition"
        | "training"
        | "administrative"
        | "other"
      competition_type:
        | "drill"
        | "marksmanship"
        | "academic"
        | "leadership"
        | "physical_fitness"
        | "inspection"
      inventory_status:
        | "available"
        | "checked_out"
        | "maintenance"
        | "damaged"
        | "lost"
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
      task_priority: "low" | "medium" | "high" | "urgent" | "critical"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "cancelled"
        | "not_started"
        | "working_on_it"
        | "stuck"
        | "done"
        | "canceled"
      user_role: "admin" | "instructor" | "command_staff" | "cadet" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      budget_category: [
        "equipment",
        "uniforms",
        "travel",
        "competition",
        "training",
        "administrative",
        "other",
      ],
      competition_type: [
        "drill",
        "marksmanship",
        "academic",
        "leadership",
        "physical_fitness",
        "inspection",
      ],
      inventory_status: [
        "available",
        "checked_out",
        "maintenance",
        "damaged",
        "lost",
      ],
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
      task_priority: ["low", "medium", "high", "urgent", "critical"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "cancelled",
        "not_started",
        "working_on_it",
        "stuck",
        "done",
        "canceled",
      ],
      user_role: ["admin", "instructor", "command_staff", "cadet", "parent"],
    },
  },
} as const
