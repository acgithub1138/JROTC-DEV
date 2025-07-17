import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  school_id: string;
  created_at: string;
  scheduled_at: string;
  next_retry_at?: string;
  last_attempt_at?: string;
  error_message?: string;
}

class UnifiedEmailProcessor {
  private static instance: UnifiedEmailProcessor;
  private supabase: any;
  private resend: Resend;
  private lastEmailSent: number = 0;
  private readonly RATE_LIMIT_MS = 2000; // 2 seconds between emails
  private processingLock = false;

  private constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    this.resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '');
  }

  public static getInstance(): UnifiedEmailProcessor {
    if (!UnifiedEmailProcessor.instance) {
      UnifiedEmailProcessor.instance = new UnifiedEmailProcessor();
    }
    return UnifiedEmailProcessor.instance;
  }

  private async acquireLock(lockId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('email_processing_lock')
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
          locked_by: lockId
        })
        .eq('id', 1)
        .eq('is_locked', false)
        .select();

      if (error) {
        console.error('🔒 Lock acquisition error:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('🔒 Lock acquisition failed:', error);
      return false;
    }
  }

  private async releaseLock(): Promise<void> {
    try {
      await this.supabase
        .from('email_processing_lock')
        .update({
          is_locked: false,
          locked_at: null,
          locked_by: null,
          last_processed_at: new Date().toISOString()
        })
        .eq('id', 1);
    } catch (error) {
      console.error('🔓 Lock release failed:', error);
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastEmail = now - this.lastEmailSent;
    
    if (timeSinceLastEmail < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastEmail;
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastEmailSent = Date.now();
  }

  private async getPendingEmails(limit: number = 10): Promise<EmailQueueItem[]> {
    const { data, error } = await this.supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'rate_limited'])
      .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('📋 Error fetching pending emails:', error);
      return [];
    }

    return data || [];
  }

  private async getStuckEmails(): Promise<EmailQueueItem[]> {
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    
    const { data, error } = await this.supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', thirtySecondsAgo)
      .or(`retry_count.is.null,retry_count.lt.max_retries`)
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) {
      console.error('🔄 Error fetching stuck emails:', error);
      return [];
    }

    return data || [];
  }

  private async markEmailAsProcessing(emailId: string): Promise<void> {
    await this.supabase
      .from('email_queue')
      .update({
        status: 'processing',
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', emailId);
  }

  private async sendEmailViaResend(email: EmailQueueItem): Promise<{ success: boolean; resendId?: string; isRateLimited?: boolean; errorMessage?: string }> {
    try {
      console.log(`📧 Sending email to ${email.recipient_email} (retry: ${email.retry_count || 0})`);
      
      const result = await this.resend.emails.send({
        from: 'JROTC CCC <jrotc@careyunlimited.com>',
        to: [email.recipient_email],
        subject: email.subject,
        html: email.body,
      });

      // Only consider successful if we have a valid Resend ID
      if (result.data?.id) {
        console.log(`✅ Email sent successfully via Resend to ${email.recipient_email}, Resend ID: ${result.data.id}`);
        return { success: true, resendId: result.data.id };
      } else {
        console.log(`⚠️ Resend API returned success but no ID for ${email.recipient_email}:`, result);
        return { success: false, errorMessage: 'No Resend ID returned' };
      }
    } catch (error: any) {
      console.error(`❌ Resend error for ${email.recipient_email}:`, error);
      
      // Check if this is a rate limiting error
      const isRateLimited = error.message?.includes('rate') || 
                           error.message?.includes('limit') ||
                           error.status === 429;
      
      if (isRateLimited) {
        console.log(`🚦 Rate limited by Resend for ${email.recipient_email}`);
        return { success: false, isRateLimited: true, errorMessage: error.message };
      }
      
      return { success: false, errorMessage: error.message };
    }
  }

  private async updateEmailStatus(email: EmailQueueItem, result: { success: boolean; resendId?: string; isRateLimited?: boolean; errorMessage?: string }): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (result.success && result.resendId) {
      // Only mark as sent if we have a valid Resend ID
      updateData.status = 'sent';
      updateData.sent_at = new Date().toISOString();
      console.log(`✅ Email ${email.id} marked as sent with Resend ID: ${result.resendId}`);
    } else if (result.isRateLimited) {
      // Handle rate limiting specifically - mark as rate_limited for better tracking
      updateData.status = 'rate_limited';
      updateData.retry_count = (email.retry_count || 0) + 1;
      updateData.error_message = result.errorMessage;
      
      // Shorter retry for rate limiting (1 minute)
      updateData.next_retry_at = new Date(Date.now() + 60000).toISOString();
      console.log(`🚦 Email ${email.id} rate limited, will retry in 1 minute`);
    } else {
      // Regular failure
      updateData.retry_count = (email.retry_count || 0) + 1;
      updateData.error_message = result.errorMessage;
      
      // Set next retry time with exponential backoff if retries remaining
      if (updateData.retry_count < (email.max_retries || 3)) {
        const retryDelayMinutes = Math.pow(2, updateData.retry_count) * 5; // 5, 10, 20 minutes
        updateData.next_retry_at = new Date(Date.now() + retryDelayMinutes * 60000).toISOString();
        updateData.status = 'pending'; // Keep as pending for retry
        console.log(`🔄 Email ${email.id} failed, will retry in ${retryDelayMinutes} minutes (attempt ${updateData.retry_count})`);
      } else {
        updateData.status = 'failed';
        console.log(`❌ Email ${email.id} failed permanently after ${updateData.retry_count} attempts`);
      }
    }

    await this.supabase
      .from('email_queue')
      .update(updateData)
      .eq('id', email.id);
  }

  public async processEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: email, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('id', emailId)
        .single();

      if (error || !email) {
        return { success: false, error: 'Email not found' };
      }

      if (!['pending', 'rate_limited'].includes(email.status)) {
        return { success: false, error: 'Email is not pending or rate limited' };
      }

      await this.markEmailAsProcessing(emailId);
      await this.enforceRateLimit();
      
      const result = await this.sendEmailViaResend(email);
      await this.updateEmailStatus(email, result);

      return { success: result.success };
    } catch (error: any) {
      console.error(`💥 Error processing email ${emailId}:`, error);
      return { success: false, error: error.message };
    }
  }

  public async processAllEmails(includeStuck: boolean = false): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.processingLock) {
      console.log('🔒 Processing already in progress, skipping');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const lockId = `processor-${Date.now()}`;
    const lockAcquired = await this.acquireLock(lockId);
    
    if (!lockAcquired) {
      console.log('🔒 Could not acquire processing lock');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.processingLock = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      console.log('🚀 Starting unified email processing');

      // Get pending emails
      const pendingEmails = await this.getPendingEmails(10);
      console.log(`📋 Found ${pendingEmails.length} pending emails`);

      // Get stuck emails if requested
      let stuckEmails: EmailQueueItem[] = [];
      if (includeStuck) {
        stuckEmails = await this.getStuckEmails();
        console.log(`🔄 Found ${stuckEmails.length} stuck emails`);
      }

      // Combine and deduplicate emails
      const allEmails = [...pendingEmails, ...stuckEmails];
      const uniqueEmails = allEmails.filter((email, index, self) => 
        index === self.findIndex(e => e.id === email.id)
      );

      console.log(`📨 Processing ${uniqueEmails.length} unique emails`);

      // Process each email with rate limiting
      for (const email of uniqueEmails) {
        processed++;
        
        await this.markEmailAsProcessing(email.id);
        await this.enforceRateLimit();
        
        const result = await this.sendEmailViaResend(email);
        await this.updateEmailStatus(email, result);
        
        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }

        console.log(`📊 Progress: ${processed}/${uniqueEmails.length} (✅${succeeded} ❌${failed})`);
      }

      console.log(`✅ Email processing complete: ${succeeded}/${processed} succeeded`);
      
      return { processed, succeeded, failed };
    } catch (error: any) {
      console.error('💥 Error in processAllEmails:', error);
      return { processed, succeeded, failed };
    } finally {
      this.processingLock = false;
      await this.releaseLock();
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`🚀 [${requestId}] Unified Email Processor started`);

  try {
    const body = await req.json();
    console.log(`📝 [${requestId}] Request body:`, body);

    const processor = UnifiedEmailProcessor.getInstance();

    // Handle single email processing
    if (body.email_id) {
      console.log(`📧 [${requestId}] Processing single email: ${body.email_id}`);
      const result = await processor.processEmail(body.email_id);
      
      return new Response(JSON.stringify({
        success: result.success,
        error: result.error,
        requestId
      }), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle batch processing (scheduled or manual)
    if (body.process_all || body.scheduled) {
      console.log(`📋 [${requestId}] Processing all emails (includeStuck: ${body.scheduled})`);
      const result = await processor.processAllEmails(body.scheduled);
      
      return new Response(JSON.stringify({
        success: true,
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        requestId
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request: missing email_id or process_all parameter',
      requestId
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`💥 [${requestId}] Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});