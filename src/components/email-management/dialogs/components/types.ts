
export interface RecipientConfig {
  recipient_type: string;
  recipient_field: string;
  static_email: string;
}

export interface EmailRuleFormData {
  name: string;
  template_id: string;
  source_table: string;
  trigger_event: 'INSERT';
  recipient_config: RecipientConfig;
  is_active: boolean;
}
