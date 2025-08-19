
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

// SmtpSettings interface removed - no longer needed with Supabase email system

export interface ProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  total: number;
  error?: string;
}
