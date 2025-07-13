
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  total: number;
  error?: string;
}

interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  school_id: string;
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

class QueueProcessor {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
  }

  async getQueueItems(): Promise<EmailQueueItem[]> {
    const { data, error } = await this.supabase
      .from('email_queue')
      .select('id, recipient_email, subject, body, school_id')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching queue items:', error);
      throw new Error(`Failed to fetch queue items: ${error.message}`);
    }

    return data || [];
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
        // No rows returned
        return null;
      }
      console.error('Error fetching SMTP settings:', error);
      throw new Error(`Failed to fetch SMTP settings: ${error.message}`);
    }

    return data;
  }

  async handleNoSmtpSettings(queueItems: EmailQueueItem[]): Promise<void> {
    const ids = queueItems.map(item => item.id);
    
    await this.supabase
      .from('email_queue')
      .update({
        status: 'failed',
        error_message: 'No active global SMTP settings configured',
        updated_at: new Date().toISOString()
      })
      .in('id', ids);
  }

  async processEmails(queueItems: EmailQueueItem[], smtpSettings: SmtpSettings): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const item of queueItems) {
      try {
        await this.sendEmail(item, smtpSettings);
        
        // Mark as sent
        await this.supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        processed++;
        console.log(`Email sent successfully to ${item.recipient_email}`);
      } catch (error) {
        console.error(`Failed to send email to ${item.recipient_email}:`, error);
        
        // Mark as failed
        await this.supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        failed++;
      }
    }

    return { processed, failed };
  }

  async sendEmail(item: EmailQueueItem, smtpSettings: SmtpSettings): Promise<void> {
    // For now, we'll simulate email sending
    // In a real implementation, you would use an SMTP library or service
    console.log(`Simulating email send to ${item.recipient_email}`);
    console.log(`Subject: ${item.subject}`);
    console.log(`SMTP Host: ${smtpSettings.smtp_host}:${smtpSettings.smtp_port}`);
    
    // Simulate a small delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // For demonstration purposes, we'll mark all emails as successfully sent
    // In production, you would integrate with an actual email service like:
    // - Resend API
    // - SendGrid
    // - Amazon SES
    // - Or use SMTP directly with a library like nodemailer
  }
}

serve(async (req) => {
  console.log('🚀 Process Email Queue function started');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Validate environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log('Environment check:');
  console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Server configuration error: Missing environment variables',
        processed: 0,
        failed: 0,
        total: 0
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const processor = new QueueProcessor();

    // Get pending emails from queue
    const queueItems = await processor.getQueueItems();
    console.log(`Processing ${queueItems.length} emails from queue`);

    // Get global SMTP settings
    const globalSmtpSettings = await processor.getGlobalSmtpSettings();

    if (!globalSmtpSettings) {
      console.log('No active global SMTP settings found, cannot process emails');
      
      if (queueItems.length > 0) {
        await processor.handleNoSmtpSettings(queueItems);
      }

      const result: ProcessingResult = {
        success: false,
        error: 'No active global SMTP settings configured',
        processed: 0,
        failed: queueItems.length,
        total: queueItems.length
      };

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Process emails using global SMTP settings
    const { processed, failed } = await processor.processEmails(queueItems, globalSmtpSettings);

    const result: ProcessingResult = {
      success: true,
      processed,
      failed,
      total: queueItems.length
    };

    console.log('Email processing completed:', result);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in process-email-queue function:', error);
    
    const result: ProcessingResult = {
      success: false,
      error: error.message || 'Unknown error occurred',
      processed: 0,
      failed: 0,
      total: 0
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});
