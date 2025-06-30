
export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_table?: string;
  trigger_conditions: any[];
  actions: any[];
  is_active: boolean;
  school_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_executed?: string;
}
