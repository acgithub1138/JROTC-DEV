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
}

// Removed SmtpSettings interface - only using Resend now

class EmailProcessor {
  private supabase;
  private resend: Resend | null = null;

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

  async getEmailById(emailId: string): Promise<EmailQueueItem | null> {
    const { data, error } = await this.supabase
      .from('email_queue')
      .select('id, recipient_email, subject, body, school_id, scheduled_at')
      .eq('id', emailId)
      .eq('status', 'pending')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Email not found or not pending
      }
      throw new Error(`Failed to fetch email: ${error.message}`);
    }

    return data;
  }

// Removed getGlobalSmtpSettings - only using Resend now

  async sendEmailWithResend(item: EmailQueueItem): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend API key not configured - check RESEND_API_KEY secret in Supabase');
    }

    console.log(`Attempting to send email via Resend to ${item.recipient_email}`);
    console.log(`Subject: ${item.subject}`);

    const result = await this.resend.emails.send({
      from: 'JROTC System <onboarding@resend.dev>', // Using Resend's verified domain
      to: [item.recipient_email],
      subject: item.subject,
      html: item.body,
    });

    if (result.error) {
      console.error('Resend API error details:', result.error);
      throw new Error(`Resend error: ${result.error.message}`);
    }

    if (!result.data?.id) {
      throw new Error('Resend did not return a message ID');
    }

    console.log(`✅ Email sent successfully via Resend to ${item.recipient_email}, Resend ID: ${result.data.id}`);
  }

// Removed simulateSmtpSend - only using Resend now

  async processEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the email from queue
      const email = await this.getEmailById(emailId);
      if (!email) {
        return { success: false, error: 'Email not found or not pending' };
      }

      // Check if it's scheduled for the future
      if (new Date(email.scheduled_at) > new Date()) {
        console.log(`Email ${emailId} is scheduled for future, skipping`);
        return { success: true };
      }

      // Validate Resend is available
      if (!this.resend) {
        throw new Error('RESEND_API_KEY is not configured in Supabase secrets');
      }

      // Send email via Resend (no fallback)
      await this.sendEmailWithResend(email);

      // Mark as sent only after successful delivery
      const updateResult = await this.supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', emailId);

      if (updateResult.error) {
        console.error('Failed to update email status:', updateResult.error);
        throw new Error(`Database update failed: ${updateResult.error.message}`);
      }

      console.log(`✅ Email ${emailId} sent successfully via Resend and marked as sent`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Failed to process email ${emailId}:`, error);
      
      // Mark as failed with detailed error message
      const errorMessage = error.message || 'Unknown error';
      
      await this.supabase
        .from('email_queue')
        .update({
          status: 'failed',
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);

      return { success: false, error: errorMessage };
    }
  }
}

serve(async (req) => {
  console.log('🚀 Email Queue Webhook function started');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

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
    console.log('Raw body:', body);
    
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
    
    const { email_id } = parsedBody;
    
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

    console.log(`📧 Processing email ID: ${email_id}`);
    console.log('🏭 Creating EmailProcessor...');
    
    const processor = new EmailProcessor();
    console.log('✅ EmailProcessor created successfully');
    
    console.log('⚡ Starting email processing...');
    const result = await processor.processEmail(email_id);
    
    console.log('✅ Email processing completed:', result);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('💥 Critical error in email-queue-webhook function:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        errorName: error.name,
        timestamp: new Date().toISOString()
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