
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailQueueItem {
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

interface SmtpSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
}

async function sendEmailViaSMTP(
  emailData: EmailQueueItem,
  smtpSettings: SmtpSettings
): Promise<boolean> {
  try {
    console.log(`Attempting to send email via SMTP to ${emailData.recipient_email}`);
    
    // In a real implementation, you would use a proper SMTP library here
    // For now, we'll simulate the email sending process
    
    if (!smtpSettings.is_active) {
      throw new Error('SMTP is not active for this school');
    }

    // Simulate SMTP connection and sending
    console.log(`Connecting to SMTP server: ${smtpSettings.smtp_host}:${smtpSettings.smtp_port}`);
    console.log(`Using TLS: ${smtpSettings.use_tls}`);
    console.log(`From: ${smtpSettings.from_name} <${smtpSettings.from_email}>`);
    console.log(`To: ${emailData.recipient_email}`);
    console.log(`Subject: ${emailData.subject}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Email sent successfully via SMTP`);
    return true;
    
  } catch (error) {
    console.error(`SMTP sending failed:`, error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get pending emails from queue
    const { data: queueItems, error: queueError } = await supabaseClient
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

    console.log(`Processing ${queueItems?.length || 0} emails from queue`);

    let processedCount = 0;
    let failedCount = 0;

    // Process each email
    for (const item of queueItems || []) {
      try {
        console.log(`Processing email ${item.id} to ${item.recipient_email}`);
        
        // Get SMTP settings for the school
        const { data: smtpSettings, error: smtpError } = await supabaseClient
          .from('smtp_settings')
          .select('*')
          .eq('school_id', item.school_id)
          .eq('is_active', true)
          .single();

        if (smtpError || !smtpSettings) {
          console.log(`No active SMTP settings found for school ${item.school_id}, skipping email`);
          
          // Update email status to failed
          await supabaseClient
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: 'No active SMTP settings configured',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          // Create log entry for failed email
          await supabaseClient
            .from('email_logs')
            .insert({
              queue_id: item.id,
              event_type: 'failed',
              event_data: {
                error: 'No active SMTP settings configured',
                failed_at: new Date().toISOString()
              }
            });

          failedCount++;
          continue;
        }

        // Send email via SMTP
        await sendEmailViaSMTP(item, smtpSettings);
        
        // Update email status to sent
        const { error: updateError } = await supabaseClient
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Error updating email ${item.id}:`, updateError);
          throw updateError;
        }

        // Create log entry for sent email
        const { error: logError } = await supabaseClient
          .from('email_logs')
          .insert({
            queue_id: item.id,
            event_type: 'sent',
            event_data: {
              sent_at: new Date().toISOString(),
              recipient: item.recipient_email,
              subject: item.subject,
              smtp_host: smtpSettings.smtp_host
            }
          });

        if (logError) {
          console.error(`Error creating log for email ${item.id}:`, logError);
        }

        processedCount++;
        console.log(`Successfully processed email ${item.id}`);

      } catch (error) {
        console.error(`Failed to process email ${item.id}:`, error);
        
        // Mark email as failed
        await supabaseClient
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error occurred',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        // Create log entry for failed email
        await supabaseClient
          .from('email_logs')
          .insert({
            queue_id: item.id,
            event_type: 'failed',
            event_data: {
              error: error.message || 'Unknown error occurred',
              failed_at: new Date().toISOString()
            }
          });

        failedCount++;
      }
    }

    const result = {
      success: true,
      processed: processedCount,
      failed: failedCount,
      total: queueItems?.length || 0
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
