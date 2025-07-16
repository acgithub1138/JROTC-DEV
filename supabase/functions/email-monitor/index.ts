import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailMonitorReport {
  timestamp: string;
  stuckEmails: any[];
  retriedEmails: any[];
  healthStatus: 'healthy' | 'warning' | 'critical';
  metrics: {
    totalPending: number;
    totalStuck: number;
    totalRetried: number;
    avgProcessingTime: number;
    oldestPendingAge: number;
  };
}

serve(async (req) => {
  console.log('🔍 Email Monitor function started');
  console.log('⏰ Timestamp:', new Date().toISOString());

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const now = new Date();
    const stuckThresholdMinutes = 10; // Emails stuck for more than 10 minutes
    const stuckThreshold = new Date(now.getTime() - stuckThresholdMinutes * 60 * 1000);

    console.log(`🔍 Looking for emails stuck since: ${stuckThreshold.toISOString()}`);

    // Find stuck emails (pending for more than threshold and past retry time)
    const { data: stuckEmails, error: stuckError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .or(`next_retry_at.is.null,next_retry_at.lt.${now.toISOString()}`)
      .lt('created_at', stuckThreshold.toISOString());

    if (stuckError) {
      throw new Error(`Failed to fetch stuck emails: ${stuckError.message}`);
    }

    console.log(`📊 Found ${stuckEmails?.length || 0} stuck emails`);

    // Get all pending emails for metrics
    const { data: allPending, error: pendingError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending');

    if (pendingError) {
      throw new Error(`Failed to fetch pending emails: ${pendingError.message}`);
    }

    // Calculate metrics
    const totalPending = allPending?.length || 0;
    const totalStuck = stuckEmails?.length || 0;
    
    // Find oldest pending email
    const oldestPending = allPending?.reduce((oldest, email) => {
      const emailAge = new Date(email.created_at);
      const oldestAge = oldest ? new Date(oldest.created_at) : new Date();
      return emailAge < oldestAge ? email : oldest;
    }, null);

    const oldestPendingAge = oldestPending ? 
      Math.floor((now.getTime() - new Date(oldestPending.created_at).getTime()) / (1000 * 60)) : 0;

    // Retry stuck emails
    const retriedEmails: any[] = [];
    if (stuckEmails && stuckEmails.length > 0) {
      console.log(`🔄 Attempting to retry ${stuckEmails.length} stuck emails`);
      
      for (const email of stuckEmails) {
        try {
          const currentRetryCount = email.retry_count || 0;
          const maxRetries = 3;

          if (currentRetryCount >= maxRetries) {
            console.log(`❌ Email ${email.id} has exceeded max retries (${currentRetryCount}/${maxRetries}), marking as failed`);
            
            // Mark as permanently failed
            await supabase
              .from('email_queue')
              .update({
                status: 'failed',
                error_message: `Max retries exceeded (${maxRetries}). Last error: ${email.error_message || 'Unknown'}`,
                updated_at: now.toISOString()
              })
              .eq('id', email.id);

            retriedEmails.push({
              emailId: email.id,
              action: 'marked_failed',
              reason: 'max_retries_exceeded',
              retryCount: currentRetryCount
            });
          } else {
            // Calculate next retry time with exponential backoff
            const nextRetryDelay = Math.pow(2, currentRetryCount) * 2; // 2, 4, 8 minutes
            const nextRetryAt = new Date(now.getTime() + nextRetryDelay * 60 * 1000);

            console.log(`🔄 Scheduling retry for email ${email.id} (attempt ${currentRetryCount + 1}/${maxRetries})`);

            // Update email for retry
            await supabase
              .from('email_queue')
              .update({
                retry_count: currentRetryCount + 1,
                next_retry_at: nextRetryAt.toISOString(),
                error_message: `Auto-retry ${currentRetryCount + 1}/${maxRetries}: Stuck email detected by monitor`,
                updated_at: now.toISOString()
              })
              .eq('id', email.id);

            // Trigger immediate processing via webhook
            try {
              const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/email-queue-webhook`;
              const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                },
                body: JSON.stringify({
                  email_id: email.id,
                  retry_count: currentRetryCount + 1,
                  manual_trigger: false
                })
              });

              if (!webhookResponse.ok) {
                console.warn(`⚠️ Webhook call failed for email ${email.id}: ${webhookResponse.status}`);
              }

              retriedEmails.push({
                emailId: email.id,
                action: 'retried',
                retryCount: currentRetryCount + 1,
                nextRetryAt: nextRetryAt.toISOString(),
                webhookTriggered: webhookResponse.ok
              });
            } catch (webhookError) {
              console.error(`❌ Failed to trigger webhook for email ${email.id}:`, webhookError);
              retriedEmails.push({
                emailId: email.id,
                action: 'retry_scheduled',
                retryCount: currentRetryCount + 1,
                nextRetryAt: nextRetryAt.toISOString(),
                webhookError: webhookError.message
              });
            }
          }
        } catch (error) {
          console.error(`❌ Failed to process stuck email ${email.id}:`, error);
          retriedEmails.push({
            emailId: email.id,
            action: 'failed_to_retry',
            error: error.message
          });
        }
      }
    }

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (totalStuck > 10 || oldestPendingAge > 60) {
      healthStatus = 'critical';
    } else if (totalStuck > 5 || oldestPendingAge > 30) {
      healthStatus = 'warning';
    }

    // Calculate average processing time from recent sent emails
    const { data: recentSent } = await supabase
      .from('email_queue')
      .select('created_at, sent_at')
      .eq('status', 'sent')
      .not('sent_at', 'is', null)
      .gte('sent_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(100);

    const avgProcessingTime = recentSent?.reduce((sum, email) => {
      const processingTime = new Date(email.sent_at).getTime() - new Date(email.created_at).getTime();
      return sum + processingTime;
    }, 0) / (recentSent?.length || 1) / 1000; // Convert to seconds

    const report: EmailMonitorReport = {
      timestamp: now.toISOString(),
      stuckEmails: stuckEmails || [],
      retriedEmails,
      healthStatus,
      metrics: {
        totalPending,
        totalStuck,
        totalRetried: retriedEmails.filter(r => r.action === 'retried').length,
        avgProcessingTime: Math.round(avgProcessingTime || 0),
        oldestPendingAge
      }
    };

    console.log(`📊 Monitor report generated:`, {
      healthStatus: report.healthStatus,
      totalPending: report.metrics.totalPending,
      totalStuck: report.metrics.totalStuck,
      totalRetried: report.metrics.totalRetried
    });

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('💥 Critical error in email monitor:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString(),
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