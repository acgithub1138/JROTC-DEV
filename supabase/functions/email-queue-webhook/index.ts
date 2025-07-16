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
      from: 'JROTC System <onboarding@resend.dev>',
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

  async processEmail(emailId: string, isBatchProcessing = false): Promise<{ success: boolean; error?: string; processingTime?: number }> {
    const processingStartTime = Date.now();
    
    try {
      // Get the email from queue
      const email = await this.getEmailById(emailId);
      if (!email) {
        return { 
          success: false, 
          error: 'Email not found or not pending',
          processingTime: Date.now() - processingStartTime
        };
      }

      // Check if it's scheduled for the future
      if (new Date(email.scheduled_at) > new Date()) {
        console.log(`⏰ Email ${emailId} is scheduled for future, skipping`);
        return { 
          success: true,
          processingTime: Date.now() - processingStartTime
        };
      }

      // Validate Resend is available
      if (!this.resend) {
        throw new Error('RESEND_API_KEY is not configured in Supabase secrets');
      }

      // Send email via Resend
      await this.sendEmailWithResend(email);

      // Mark as sent with processing metrics
      const updateStartTime = Date.now();
      const processingTime = Date.now() - processingStartTime;
      
      const updateResult = await this.supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: null,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', emailId);

      const updateTime = Date.now() - updateStartTime;
      console.log(`📊 Database update time: ${updateTime}ms`);

      if (updateResult.error) {
        console.error('❌ Failed to update email status:', updateResult.error);
        throw new Error(`Database update failed: ${updateResult.error.message}`);
      }

      console.log(`✅ Email ${emailId} processed successfully in ${processingTime}ms (batch: ${isBatchProcessing})`);
      return { 
        success: true,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - processingStartTime;
      console.error(`❌ Failed to process email ${emailId}:`, error);
      
      // Mark as failed with detailed error message and metrics
      const errorMessage = error.message || 'Unknown error';
      
      await this.supabase
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', emailId);

      return { 
        success: false, 
        error: errorMessage,
        processingTime
      };
    }
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
  console.log('🚀 Email Queue Webhook function started');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔍 Method:', req.method);
  console.log('🌐 URL:', req.url);

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
    
    const { email_id, batch_processing, retry_count } = parsedBody;
    
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

    console.log(`📧 Processing email ID: ${email_id} (retry: ${retry_count || 0}, batch: ${!!batch_processing})`);
    
    // Get processor instance and warm up
    const processor = EmailProcessor.getInstance();
    await processor.warmUp();
    
    console.log('⚡ Starting email processing...');
    const result = await processor.processEmail(email_id, batch_processing);
    
    const totalTime = Date.now() - requestStartTime;
    console.log(`📊 Total request time: ${totalTime}ms`);
    console.log('✅ Email processing completed:', result);

    // Add performance metrics to response
    const response = {
      ...result,
      metrics: {
        totalRequestTime: totalTime,
        processingTime: result.processingTime,
        retryCount: retry_count || 0,
        batchProcessing: !!batch_processing
      }
    };

    return new Response(JSON.stringify(response), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    const totalTime = Date.now() - requestStartTime;
    console.error('💥 Critical error in email-queue-webhook function:', error);
    console.error('🏷️ Error name:', error.name);
    console.error('💬 Error message:', error.message);
    console.error('📜 Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        errorName: error.name,
        timestamp: new Date().toISOString(),
        metrics: {
          totalRequestTime: totalTime,
          failed: true
        }
      }),
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