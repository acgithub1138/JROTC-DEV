import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: string;
  retry_count: number;
  max_retries: number;
  last_attempt_at: string | null;
  created_at: string;
  school_id: string;
}

class BackupEmailProcessor {
  private supabase;
  private resend;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    this.resend = resendApiKey ? new Resend(resendApiKey) : null;
  }

  async findStuckEmails(): Promise<EmailQueueItem[]> {
    console.log('🔍 Looking for stuck emails...');
    
    // Find emails that are:
    // 1. Status = 'pending'
    // 2. Created more than 30 seconds ago
    // 3. retry_count = 0 or last_attempt_at is null (never processed)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    
    const { data: stuckEmails, error } = await this.supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', thirtySecondsAgo)
      .or('retry_count.eq.0,last_attempt_at.is.null');

    if (error) {
      console.error('❌ Error finding stuck emails:', error);
      return [];
    }

    console.log(`📧 Found ${stuckEmails?.length || 0} stuck emails`);
    return stuckEmails || [];
  }

  async tryWebhookFirst(emailId: string): Promise<boolean> {
    console.log(`🔗 Attempting to trigger webhook for email ${emailId}...`);
    
    try {
      const response = await fetch('https://vpiwfabbzaebfkadmmgd.supabase.co/functions/v1/email-queue-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          email_id: emailId,
          retry_count: 0,
          manual_trigger: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Webhook triggered successfully for ${emailId}:`, result);
        return result.success === true;
      } else {
        console.log(`⚠️ Webhook failed for ${emailId}, status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`⚠️ Webhook error for ${emailId}:`, error.message);
      return false;
    }
  }

  async sendEmailDirectly(email: EmailQueueItem): Promise<boolean> {
    if (!this.resend) {
      console.log('❌ Resend API key not configured, cannot send email directly');
      return false;
    }

    console.log(`📤 Sending email ${email.id} directly via Resend...`);
    
    try {
      const result = await this.resend.emails.send({
        from: 'Command HQ <notifications@careyunlimited.com>',
        to: [email.recipient_email],
        subject: email.subject,
        html: email.body,
      });

      console.log(`✅ Email ${email.id} sent directly via Resend:`, result);
      return true;
    } catch (error) {
      console.log(`❌ Direct email send failed for ${email.id}:`, error.message);
      return false;
    }
  }

  async updateEmailStatus(email: EmailQueueItem, success: boolean, method: string): Promise<void> {
    const now = new Date().toISOString();
    const newRetryCount = (email.retry_count || 0) + 1;
    const maxRetries = email.max_retries || 3;
    
    if (success) {
      console.log(`✅ Updating email ${email.id} to 'sent' status (processed via ${method})`);
      
      await this.supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: now,
          updated_at: now,
          last_attempt_at: now,
          retry_count: newRetryCount,
          error_message: `Successfully processed via backup retry (${method})`
        })
        .eq('id', email.id);
    } else {
      const finalStatus = newRetryCount >= maxRetries ? 'failed' : 'pending';
      const nextRetryAt = finalStatus === 'pending' ? 
        new Date(Date.now() + Math.pow(2, newRetryCount) * 2 * 60 * 1000).toISOString() : null;
      
      console.log(`💾 Updating email ${email.id} to '${finalStatus}' status (retry ${newRetryCount}/${maxRetries})`);
      
      await this.supabase
        .from('email_queue')
        .update({
          status: finalStatus,
          updated_at: now,
          last_attempt_at: now,
          retry_count: newRetryCount,
          next_retry_at: nextRetryAt,
          error_message: `Backup retry failed (attempt ${newRetryCount}/${maxRetries}): Could not process via webhook or direct send`
        })
        .eq('id', email.id);
    }
  }

  async processStuckEmail(email: EmailQueueItem): Promise<{ success: boolean; method: string }> {
    console.log(`🔄 Processing stuck email ${email.id} to ${email.recipient_email}...`);
    
    // First try the webhook
    const webhookSuccess = await this.tryWebhookFirst(email.id);
    if (webhookSuccess) {
      return { success: true, method: 'webhook' };
    }

    // If webhook fails, try direct sending
    const directSuccess = await this.sendEmailDirectly(email);
    if (directSuccess) {
      return { success: true, method: 'direct' };
    }

    return { success: false, method: 'none' };
  }

  async processAllStuckEmails(): Promise<{ processed: number; succeeded: number; failed: number; details: any[] }> {
    const stuckEmails = await this.findStuckEmails();
    
    if (stuckEmails.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0, details: [] };
    }

    let succeeded = 0;
    let failed = 0;
    const details = [];

    for (let i = 0; i < stuckEmails.length; i++) {
      const email = stuckEmails[i];
      
      // Add delay between emails (except for the first one) to respect global rate limiting
      if (i > 0) {
        console.log(`⏱️ Waiting 2 seconds before processing next email...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`🔄 Processing stuck email ${i + 1}/${stuckEmails.length}: ${email.id}`);
      
      const result = await this.processStuckEmail(email);
      await this.updateEmailStatus(email, result.success, result.method);
      
      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }

      details.push({
        email_id: email.id,
        recipient: email.recipient_email,
        success: result.success,
        method: result.method,
        retry_count: email.retry_count || 0
      });
    }

    return {
      processed: stuckEmails.length,
      succeeded,
      failed,
      details
    };
  }
}

serve(async (req) => {
  console.log('🚀 Email Backup Retry Processor started');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔍 Method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const processor = new BackupEmailProcessor();
    const result = await processor.processAllStuckEmails();

    console.log('📊 Processing complete:', result);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${result.processed} stuck emails`,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('❌ Error in backup retry processor:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});