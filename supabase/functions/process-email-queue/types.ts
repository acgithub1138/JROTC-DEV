
export interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  template_id: string;
  rule_id: string;
  record_id: string;
  source_table: string;
  school_id: string;
}

export interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
  is_global: boolean;
}

export interface ProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  total: number;
  error?: string;
}
