import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const resend = new Resend(resendApiKey);

    console.log('Starting manual email processing...');

    // Get pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingEmails?.length || 0} pending emails`);

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No pending emails to process',
        processed: 0,
        failed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let failed = 0;

    // Process each email with 2-second delay to respect global rate limiting
    for (let i = 0; i < pendingEmails.length; i++) {
      const email = pendingEmails[i];
      
      try {
        // Add delay between emails (except for the first one)
        if (i > 0) {
          console.log(`⏱️ Waiting 2 seconds before processing next email...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log(`📤 Processing email ${i + 1}/${pendingEmails.length}: ${email.id} to ${email.recipient_email}`);
        
        // Check global rate limit by looking at the last sent email
        const { data: lastEmails } = await supabase
          .from('email_queue')
          .select('sent_at')
          .eq('status', 'sent')
          .order('sent_at', { ascending: false })
          .limit(1);
        
        if (lastEmails && lastEmails.length > 0) {
          const lastSentTime = new Date(lastEmails[0].sent_at).getTime();
          const now = Date.now();
          const timeSinceLastEmail = now - lastSentTime;
          const requiredWait = 2000; // 2 seconds
          
          if (timeSinceLastEmail < requiredWait) {
            const waitTime = requiredWait - timeSinceLastEmail;
            console.log(`⏱️ Global rate limit: waiting additional ${waitTime}ms since last email was ${timeSinceLastEmail}ms ago`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
        
        // Send email via Resend
        const result = await resend.emails.send({
          from: 'JROTC CCC <jrotc@careyunlimited.com>',
          to: [email.recipient_email],
          subject: email.subject,
          html: email.body,
        });

        if (result.error) {
          console.error(`❌ Resend error for ${email.id}:`, result.error);
          
          // Mark as failed
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: `Resend error: ${result.error.message}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);
          
          failed++;
        } else {
          console.log(`✅ Email ${email.id} sent successfully. Resend ID: ${result.data?.id}`);
          
          // Mark as sent
          const { error: updateError } = await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              error_message: null
            })
            .eq('id', email.id);

          if (updateError) {
            console.error(`❌ Failed to update email ${email.id}:`, updateError);
          } else {
            processed++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);
        
        failed++;
      }
    }

    // Log the processing result
    const { error: logError } = await supabase
      .from('email_processing_log')
      .insert({
        processed_count: processed,
        failed_count: failed,
        status: 'completed',
        processed_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging processing result:', logError);
    }

    console.log(`Email processing completed. Processed: ${processed}, Failed: ${failed}`);

    return new Response(JSON.stringify({ 
      message: 'Email processing completed',
      processed,
      failed,
      details: pendingEmails.map(email => ({
        id: email.id,
        recipient: email.recipient_email,
        subject: email.subject
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manual-process-emails function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      processed: 0,
      failed: 0 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});