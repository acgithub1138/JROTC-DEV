
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EmailQueueItem, SmtpSettings } from './types.ts';
import { sendEmailViaSMTP } from './email-service.ts';

export class QueueProcessor {
  private supabaseClient;

  constructor() {
    this.supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async getQueueItems(): Promise<EmailQueueItem[]> {
    const { data: queueItems, error: queueError } = await this.supabaseClient
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10);

    if (queueError) {
      console.error('Error fetching email queue:', queueError);
      throw queueError;
    }

    return queueItems || [];
  }

  async getGlobalSmtpSettings(): Promise<SmtpSettings | null> {
    const { data: globalSmtpSettings, error: smtpError } = await this.supabaseClient
      .from('smtp_settings')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)
      .single();

    if (smtpError && smtpError.code !== 'PGRST116') {
      throw smtpError;
    }

    return globalSmtpSettings;
  }

  async markEmailAsSent(itemId: string): Promise<void> {
    const { error: updateError } = await this.supabaseClient
      .from('email_queue')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) {
      console.error(`Error updating email ${itemId}:`, updateError);
      throw updateError;
    }
  }

  async markEmailAsFailed(itemId: string, errorMessage: string): Promise<void> {
    await this.supabaseClient
      .from('email_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);
  }

  async createEmailLog(queueId: string, eventType: string, eventData: any): Promise<void> {
    const { error: logError } = await this.supabaseClient
      .from('email_logs')
      .insert({
        queue_id: queueId,
        event_type: eventType,
        event_data: eventData
      });

    if (logError) {
      console.error(`Error creating log for email ${queueId}:`, logError);
    }
  }

  async processEmails(queueItems: EmailQueueItem[], smtpSettings: SmtpSettings): Promise<{ processed: number; failed: number }> {
    let processedCount = 0;
    let failedCount = 0;

    for (const item of queueItems) {
      try {
        console.log(`Processing email ${item.id} to ${item.recipient_email} using global SMTP`);
        
        await sendEmailViaSMTP(item, smtpSettings);
        await this.markEmailAsSent(item.id);

        await this.createEmailLog(item.id, 'sent', {
          sent_at: new Date().toISOString(),
          recipient: item.recipient_email,
          subject: item.subject,
          smtp_host: smtpSettings.smtp_host,
          smtp_type: 'global',
          message_id: 'sent'
        });

        processedCount++;
        console.log(`Successfully processed email ${item.id} via global SMTP`);

      } catch (error) {
        console.error(`Failed to process email ${item.id}:`, error);
        
        const errorMessage = this.getSmtpErrorMessage(error, smtpSettings.smtp_host, smtpSettings.smtp_port);
        
        await this.markEmailAsFailed(item.id, errorMessage);
        await this.createEmailLog(item.id, 'failed', {
          error: errorMessage,
          failed_at: new Date().toISOString(),
          smtp_type: 'global',
          smtp_host: smtpSettings.smtp_host,
          original_error: error.message || 'Unknown error occurred'
        });

        failedCount++;
      }
    }

    return { processed: processedCount, failed: failedCount };
  }

  private getSmtpErrorMessage(error: any, smtp_host: string, smtp_port: number): string {
    let errorMessage = 'SMTP email sending failed';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `Cannot connect to SMTP server ${smtp_host}:${smtp_port}. The server may be down or the port may be blocked.`;
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorMessage = `Connection to ${smtp_host}:${smtp_port} timed out. Network Solutions servers may be slow to respond.`;
    } else if (error.code === 'EAUTH' || error.responseCode === 535 || error.message.includes('authentication')) {
      errorMessage = 'SMTP authentication failed. Please verify your username and password are correct for Network Solutions.';
    } else if (error.code === 'ESOCKET' || error.message.includes('TLS') || error.message.includes('SSL')) {
      errorMessage = `TLS/SSL connection failed. Network Solutions requires TLS 1.2+. Please verify the TLS setting is correct for port ${smtp_port}.`;
    } else if (error.responseCode === 550) {
      errorMessage = `SMTP server rejected the connection. Network Solutions may not allow connections from this IP address.`;
    } else if (error.responseCode && error.response) {
      errorMessage = `SMTP server error (${error.responseCode}): ${error.response}`;
    } else if (error.message.includes('certificate')) {
      errorMessage = `SSL certificate verification failed. Network Solutions certificate may not be trusted.`;
    } else if (error.message) {
      errorMessage = `SMTP error: ${error.message}`;
    }

    return errorMessage;
  }

  async handleNoSmtpSettings(queueItems: EmailQueueItem[]): Promise<void> {
    for (const item of queueItems) {
      await this.markEmailAsFailed(item.id, 'No active global SMTP settings configured');
      await this.createEmailLog(item.id, 'failed', {
        error: 'No active global SMTP settings configured',
        failed_at: new Date().toISOString()
      });
    }
  }
}
