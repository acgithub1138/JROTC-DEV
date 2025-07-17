import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
};

interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  school_id: string;
  scheduled_at: string;
  retry_count?: number;
}

class EmailProcessor {
  private supabase;
  private resend: Resend | null = null;
  private static instance: EmailProcessor | null = null;
  private warmUpComplete = false;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    }
  }

  // Singleton pattern for edge function warming
  static getInstance(): EmailProcessor {
    if (!EmailProcessor.instance) {
      EmailProcessor.instance = new EmailProcessor();
    }
    return EmailProcessor.instance;
  }

  // Warm up function to reduce cold starts
  async warmUp(): Promise<void> {
    if (this.warmUpComplete) return;
    
    try {
      console.log('🔥 Warming up email processor...');
      
      // Pre-warm Resend connection
      if (this.resend) {
        // Small test to warm up the Resend connection (won't send)
        console.log('✅ Resend connection ready');
      }
      
      // Pre-warm Supabase connection
      await this.supabase.from('email_queue').select('id').limit(1);
      console.log('✅ Supabase connection ready');
      
      this.warmUpComplete = true;
      console.log('🚀 Email processor warmed up successfully');
    } catch (error) {
      console.warn('⚠️ Warm-up failed, but continuing:', error.message);
    }
  }

  async getEmailById(emailId: string): Promise<EmailQueueItem | null> {
    const startTime = Date.now();
    
    const { data, error } = await this.supabase
      .from('email_queue')
      .select('id, recipient_email, subject, body, school_id, scheduled_at, retry_count')
      .eq('id', emailId)
      .eq('status', 'pending')
      .single();

    const queryTime = Date.now() - startTime;
    console.log(`📊 Database query time: ${queryTime}ms`);

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Email not found or not pending
      }
      throw new Error(`Failed to fetch email: ${error.message}`);
    }

    return data;
  }

  async sendEmailWithResend(item: EmailQueueItem): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend API key not configured - check RESEND_API_KEY secret in Supabase');
    }

    const sendStartTime = Date.now();
    console.log(`📧 Sending email via Resend to ${item.recipient_email} (retry: ${item.retry_count || 0})`);
    console.log(`📝 Subject: ${item.subject}`);

    // Enhanced email sending with retry information
    const isRetry = (item.retry_count || 0) > 0;
    const emailBody = isRetry ? 
      `${item.body}\n\n<!-- Email retry attempt: ${item.retry_count} -->` : 
      item.body;

    const result = await this.resend.emails.send({
      from: 'JROTC CCC <jrotc@careyunlimited.com>',
      to: [item.recipient_email],
      subject: item.subject,
      html: emailBody,
      headers: {
        'X-Retry-Count': String(item.retry_count || 0),
        'X-Email-ID': item.id,
        'X-School-ID': item.school_id,
      },
    });

    const sendTime = Date.now() - sendStartTime;
    console.log(`📊 Resend API time: ${sendTime}ms`);

    if (result.error) {
      console.error('❌ Resend API error details:', result.error);
      throw new Error(`Resend error: ${result.error.message}`);
    }

    if (!result.data?.id) {
      throw new Error('Resend did not return a message ID');
    }

    console.log(`✅ Email sent successfully via Resend to ${item.recipient_email}, Resend ID: ${result.data.id}`);
  }

  async processEmail(emailId: string, isBatchProcessing = false, manualTrigger = false): Promise<{ success: boolean; error?: string; processingTime?: number; emailDetails?: any }> {
    const processingStartTime = Date.now();
    let email: EmailQueueItem | null = null;
    let resendResult: any = null;
    
    try {
      console.log(`🔍 Starting email processing - ID: ${emailId}, Manual: ${manualTrigger}, Batch: ${isBatchProcessing}`);
      
      // Global rate limiting: Ensure only 1 email every 2 seconds across all instances
      if (!manualTrigger && !isBatchProcessing) {
        console.log(`⏱️ Checking global rate limit...`);
        
        // Check when the last email was sent globally
        const { data: lastEmail } = await supabase
          .from('email_queue')
          .select('sent_at')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();
        
        if (lastEmail?.sent_at) {
          const lastSentTime = new Date(lastEmail.sent_at).getTime();
          const now = Date.now();
          const timeSinceLastEmail = now - lastSentTime;
          const requiredWait = 2000; // 2 seconds
          
          if (timeSinceLastEmail < requiredWait) {
            const waitTime = requiredWait - timeSinceLastEmail;
            console.log(`⏱️ Global rate limit: waiting ${waitTime}ms since last email was ${timeSinceLastEmail}ms ago`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // Get the email from queue with enhanced logging
      console.log(`📊 Fetching email ${emailId} from database...`);
      email = await this.getEmailById(emailId);
      
      if (!email) {
        console.log(`⚠️ Email ${emailId} not found or not in pending status`);
        return { 
          success: false, 
          error: 'Email not found or not pending',
          processingTime: Date.now() - processingStartTime
        };
      }

      console.log(`📧 Email details - To: ${email.recipient_email}, Subject: ${email.subject}, Retry: ${email.retry_count || 0}`);

      // Check if it's scheduled for the future (unless manual trigger)
      const scheduledTime = new Date(email.scheduled_at);
      const now = new Date();
      if (scheduledTime > now && !manualTrigger) {
        console.log(`⏰ Email ${emailId} scheduled for ${scheduledTime.toISOString()}, current time: ${now.toISOString()}, skipping`);
        return { 
          success: true,
          processingTime: Date.now() - processingStartTime,
          emailDetails: { scheduledFor: email.scheduled_at, currentTime: now.toISOString() }
        };
      }

      // Validate Resend is available
      if (!this.resend) {
        const error = 'RESEND_API_KEY is not configured in Supabase secrets';
        console.error(`❌ Configuration error: ${error}`);
        throw new Error(error);
      }

      // Mark as being processed (keep status as pending, use last_attempt_at for locking)
      console.log(`🔄 Marking email ${emailId} as being processed...`);
      const processingUpdateResult = await this.supabase
        .from('email_queue')
        .update({
          last_attempt_at: new Date().toISOString(),
          retry_count: (email.retry_count || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId)
        .eq('status', 'pending'); // Ensure it's still pending

      if (processingUpdateResult.error) {
        console.error(`❌ Failed to mark email as processing:`, processingUpdateResult.error);
        throw new Error(`Failed to lock email for processing: ${processingUpdateResult.error.message}`);
      }

      console.log(`✅ Email ${emailId} marked as being processed`);

      // Send email via Resend with timeout and detailed error handling
      console.log(`📤 Sending email via Resend...`);
      try {
        await this.sendEmailWithResend(email);
        console.log(`✅ Email successfully sent via Resend`);
      } catch (resendError) {
        console.error(`❌ Resend API error:`, {
          error: resendError.message,
          emailId: emailId,
          recipient: email.recipient_email,
          retryCount: email.retry_count || 0
        });
        
        // Determine if this is a retryable error
        const isRetryable = this.isRetryableError(resendError);
        const currentRetryCount = (email.retry_count || 0);
        const maxRetries = 3;
        
        if (isRetryable && currentRetryCount < maxRetries) {
          // Calculate next retry time with exponential backoff
          const nextRetryDelay = Math.pow(2, currentRetryCount) * 2; // 2, 4, 8 minutes
          const nextRetryAt = new Date(Date.now() + nextRetryDelay * 60 * 1000);
          
          console.log(`🔄 Scheduling retry ${currentRetryCount + 1}/${maxRetries} for ${nextRetryAt.toISOString()}`);
          
          const retryUpdateResult = await this.supabase
            .from('email_queue')
            .update({
              status: 'pending',
              retry_count: currentRetryCount + 1,
              next_retry_at: nextRetryAt.toISOString(),
              error_message: `Retry ${currentRetryCount + 1}/${maxRetries}: ${resendError.message}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', emailId);

          if (retryUpdateResult.error) {
            console.error(`❌ Failed to schedule retry:`, retryUpdateResult.error);
          }

          return {
            success: false,
            error: `Retryable error (attempt ${currentRetryCount + 1}/${maxRetries}): ${resendError.message}`,
            processingTime: Date.now() - processingStartTime,
            emailDetails: {
              retryScheduled: true,
              nextRetryAt: nextRetryAt.toISOString(),
              retryCount: currentRetryCount + 1
            }
          };
        } else {
          // Max retries reached or non-retryable error
          throw resendError;
        }
      }

      // Mark as sent with detailed success logging
      const updateStartTime = Date.now();
      const processingTime = Date.now() - processingStartTime;
      
      console.log(`💾 Updating email ${emailId} status to 'sent'...`);
      const updateResult = await this.supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: null,
          last_attempt_at: new Date().toISOString(),
          next_retry_at: null // Clear any retry schedule
        })
        .eq('id', emailId);

      const updateTime = Date.now() - updateStartTime;
      console.log(`📊 Database update time: ${updateTime}ms`);

      if (updateResult.error) {
        console.error('❌ Failed to update email status to sent:', updateResult.error);
        // This is critical - the email was sent but status wasn't updated
        console.error('🚨 CRITICAL: Email was sent but database update failed!');
        throw new Error(`Database update failed after successful send: ${updateResult.error.message}`);
      }

      console.log(`✅ Email ${emailId} fully processed successfully in ${processingTime}ms (batch: ${isBatchProcessing})`);
      return { 
        success: true,
        processingTime,
        emailDetails: {
          recipient: email.recipient_email,
          subject: email.subject,
          sentAt: new Date().toISOString(),
          finalRetryCount: email.retry_count || 0
        }
      };

    } catch (error) {
      const processingTime = Date.now() - processingStartTime;
      console.error(`❌ Failed to process email ${emailId}:`, {
        error: error.message,
        errorName: error.name,
        stack: error.stack,
        processingTime: processingTime,
        emailDetails: email ? {
          recipient: email.recipient_email,
          subject: email.subject,
          retryCount: email.retry_count || 0
        } : null
      });
      
      // Enhanced error handling with detailed failure tracking
      const errorMessage = error.message || 'Unknown error';
      const currentRetryCount = email?.retry_count || 0;
      const maxRetries = 3;
      
      // Increment retry count for failed attempts
      const newRetryCount = currentRetryCount + 1;
      
      // Determine final status based on new retry count
      const finalStatus = newRetryCount >= maxRetries ? 'failed' : 'pending';
      const nextRetryAt = finalStatus === 'pending' ? 
        new Date(Date.now() + Math.pow(2, newRetryCount) * 2 * 60 * 1000) : null;
      
      console.log(`💾 Updating email ${emailId} status to '${finalStatus}' with retry count ${newRetryCount}/${maxRetries}...`);
      
      try {
        const errorUpdateResult = await this.supabase
          .from('email_queue')
          .update({
            status: finalStatus,
            error_message: `Processing failed (attempt ${newRetryCount}/${maxRetries}): ${errorMessage}`,
            updated_at: new Date().toISOString(),
            last_attempt_at: new Date().toISOString(),
            retry_count: newRetryCount,
            next_retry_at: nextRetryAt?.toISOString() || null
          })
          .eq('id', emailId);

        if (errorUpdateResult.error) {
          console.error('❌ Failed to update error status:', errorUpdateResult.error);
        } else {
          console.log(`✅ Error status updated for email ${emailId}`);
        }
      } catch (updateError) {
        console.error('❌ Critical: Failed to update error status:', updateError);
      }

      return { 
        success: false, 
        error: errorMessage,
        processingTime,
        emailDetails: email ? {
          recipient: email.recipient_email,
          subject: email.subject,
          retryCount: currentRetryCount,
          finalStatus: finalStatus,
          nextRetryAt: nextRetryAt?.toISOString()
        } : null
      };
    }
  }

  // Helper method to determine if an error is retryable
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'rate_limit',
      'server_error',
      'connection_error',
      'socket_timeout'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';
    
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError) || errorName.includes(retryableError)
    ) || (error.status >= 500 && error.status < 600); // Server errors are retryable
  }

  // Batch processing for high-volume scenarios
  async processBatch(emailIds: string[]): Promise<{ processed: number; failed: number; details: any[] }> {
    console.log(`🔄 Processing batch of ${emailIds.length} emails`);
    const batchStartTime = Date.now();
    
    const results = await Promise.allSettled(
      emailIds.map(id => this.processEmail(id, true))
    );

    let processed = 0;
    let failed = 0;
    const details: any[] = [];

    results.forEach((result, index) => {
      const emailId = emailIds[index];
      if (result.status === 'fulfilled' && result.value.success) {
        processed++;
        details.push({ emailId, status: 'success', processingTime: result.value.processingTime });
      } else {
        failed++;
        const error = result.status === 'rejected' ? result.reason.message : result.value.error;
        details.push({ emailId, status: 'failed', error });
      }
    });

    const batchTime = Date.now() - batchStartTime;
    console.log(`📊 Batch processing completed in ${batchTime}ms: ${processed} processed, ${failed} failed`);

    return { processed, failed, details };
  }
}

serve(async (req) => {
  const requestStartTime = Date.now();
  const requestId = crypto.randomUUID();
  
  console.log(`🚀 [${requestId}] Email Queue Webhook function started`);
  console.log(`⏰ [${requestId}] Timestamp:`, new Date().toISOString());
  console.log(`🔍 [${requestId}] Method:`, req.method);
  console.log(`🌐 [${requestId}] URL:`, req.url);
  console.log(`📊 [${requestId}] User-Agent:`, req.headers.get('user-agent') || 'not provided');
  console.log(`🔐 [${requestId}] Authorization header present:`, !!req.headers.get('authorization'));

  // Test endpoint
  if (req.url.includes('test')) {
    return new Response(JSON.stringify({ success: true, message: 'Edge function is working' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Validate environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  console.log('🔍 Environment check:', {
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceRoleKey: !!serviceRoleKey,
    hasResendApiKey: !!resendApiKey,
    supabaseUrl: supabaseUrl?.substring(0, 30) + '...' || 'missing'
  });
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Server configuration error: Missing environment variables'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  try {
    console.log('📥 Parsing request body...');
    const body = await req.text();
    console.log('📝 Raw body:', body);
    
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      console.log('✅ Parsed body:', parsedBody);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    const { email_id, batch_processing, retry_count, manual_trigger } = parsedBody;
    
    if (!email_id) {
      console.error('❌ Missing email_id in request');
      return new Response(
        JSON.stringify({ success: false, error: 'email_id is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`📧 [${requestId}] Processing email ID: ${email_id} (retry: ${retry_count || 0}, batch: ${!!batch_processing}, manual: ${!!manual_trigger})`);
    
    // Get processor instance and warm up
    console.log(`🏭 [${requestId}] Getting EmailProcessor instance...`);
    const processor = EmailProcessor.getInstance();
    
    console.log(`🔥 [${requestId}] Starting processor warm-up...`);
    await processor.warmUp();
    console.log(`✅ [${requestId}] Processor warm-up completed`);
    
    console.log(`⚡ [${requestId}] Starting email processing...`);
    const result = await processor.processEmail(email_id, batch_processing, manual_trigger);
    console.log(`🎯 [${requestId}] Email processing result:`, JSON.stringify(result, null, 2));
    
    const totalTime = Date.now() - requestStartTime;
    console.log(`📊 [${requestId}] Total request time: ${totalTime}ms`);
    console.log(`✅ [${requestId}] Email processing completed:`, result);

    // Add performance metrics to response
    const response = {
      ...result,
      requestId,
      metrics: {
        totalRequestTime: totalTime,
        processingTime: result.processingTime,
        retryCount: retry_count || 0,
        batchProcessing: !!batch_processing
      }
    };

    console.log(`📤 [${requestId}] Preparing response with status:`, result.success ? 200 : 500);
    console.log(`📋 [${requestId}] Full response object:`, JSON.stringify(response, null, 2));

    const finalResponse = new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

    console.log(`🚀 [${requestId}] Returning response to caller`);
    return finalResponse;

  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`💥 [${requestId}] CRITICAL ERROR in email-queue-webhook function:`, error);
    console.error(`🏷️ [${requestId}] Error name:`, error.name);
    console.error(`💬 [${requestId}] Error message:`, error.message);
    console.error(`📜 [${requestId}] Error stack:`, error.stack);
    console.error(`⏱️ [${requestId}] Time until error: ${totalTime}ms`);
    console.error(`🔍 [${requestId}] Error occurred during main request processing`);
    
    // Additional debugging information
    console.error(`🧪 [${requestId}] Error details:`, {
      name: error.name,
      message: error.message,
      cause: error.cause,
      code: error.code,
      status: error.status,
      stack: error.stack?.substring(0, 500) + '...' // Truncate stack
    });
    
    const errorResponse = {
      success: false,
      error: error.message || 'Unknown error occurred',
      errorName: error.name,
      requestId,
      timestamp: new Date().toISOString(),
      debug: {
        errorOccurredIn: 'main_catch_block',
        totalTimeMs: totalTime,
        hasStack: !!error.stack,
        errorType: typeof error,
        errorKeys: Object.keys(error)
      },
      metrics: {
        totalRequestTime: totalTime,
        failed: true
      }
    };
    
    console.error(`📤 [${requestId}] Returning error response:`, JSON.stringify(errorResponse, null, 2));
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});