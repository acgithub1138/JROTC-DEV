
export interface RecipientConfig {
  recipient_type: string;
  recipient_field: string;
  static_email: string;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_null' | 'is_not_null';
  value: string;
}

export interface TriggerConditions {
  conditions: TriggerCondition[];
  logic: 'AND' | 'OR';
}

export interface EmailRuleFormData {
  name: string;
  template_id: string;
  source_table: string;
  trigger_event: 'INSERT' | 'UPDATE' | 'DELETE';
  trigger_conditions: TriggerConditions | Record<string, any>;
  recipient_config: RecipientConfig;
  is_active: boolean;
}
