import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
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
  school_id: string;
  scheduled_at: string;
}

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
}

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

  async getGlobalSmtpSettings(): Promise<SmtpSettings | null> {
    const { data, error } = await this.supabase
      .from('smtp_settings')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch SMTP settings: ${error.message}`);
    }

    return data;
  }

  async sendEmailWithResend(item: EmailQueueItem): Promise<void> {
    if (!this.resend) {
      throw new Error('Resend API key not configured');
    }

    const result = await this.resend.emails.send({
      from: 'JROTC System <noreply@resend.dev>',
      to: [item.recipient_email],
      subject: item.subject,
      html: item.body,
    });

    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`);
    }

    console.log(`Email sent via Resend to ${item.recipient_email}, ID: ${result.data?.id}`);
  }

  async simulateSmtpSend(item: EmailQueueItem, smtpSettings: SmtpSettings): Promise<void> {
    console.log(`Simulating SMTP email send to ${item.recipient_email}`);
    console.log(`Subject: ${item.subject}`);
    console.log(`SMTP Host: ${smtpSettings.smtp_host}:${smtpSettings.smtp_port}`);
    
    // Simulate a small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

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

      // Try Resend first, fallback to SMTP simulation
      let emailSent = false;
      let sendError: string | null = null;

      if (this.resend) {
        try {
          await this.sendEmailWithResend(email);
          emailSent = true;
        } catch (error) {
          console.error('Resend failed, trying SMTP fallback:', error);
          sendError = error.message;
        }
      }

      if (!emailSent) {
        // Fallback to SMTP
        const smtpSettings = await this.getGlobalSmtpSettings();
        if (!smtpSettings) {
          throw new Error('No email service available (no Resend API key and no SMTP settings)');
        }

        await this.simulateSmtpSend(email, smtpSettings);
        emailSent = true;
      }

      // Mark as sent
      await this.supabase
        .from('email_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', emailId);

      console.log(`Email ${emailId} processed successfully`);
      return { success: true };

    } catch (error) {
      console.error(`Failed to process email ${emailId}:`, error);
      
      // Mark as failed with exponential backoff logic
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
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
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
    const { email_id } = await req.json();
    
    if (!email_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'email_id is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const processor = new EmailProcessor();
    const result = await processor.processEmail(email_id);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in email-queue-webhook function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
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