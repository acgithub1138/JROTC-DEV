import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import {
  RateLimiter,
  RATE_LIMITS,
  getClientIP,
  createRateLimitResponse,
  addRateLimitHeaders
} from '../_shared/rate-limiter.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateTaskStatusRequest {
  taskId: string;
  sourceTable: string;
  emailRuleType: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Rate limiters
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: 'global' })
const webhookLimiter = new RateLimiter({ ...RATE_LIMITS.WEBHOOK, keyPrefix: 'task-status' })

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - Global IP check
    const clientIP = getClientIP(req)
    const globalResult = globalLimiter.check(clientIP)
    if (!globalResult.allowed) {
      return createRateLimitResponse(globalResult, corsHeaders)
    }

    // Rate limiting - Webhook specific check
    const webhookResult = webhookLimiter.check(clientIP)
    if (!webhookResult.allowed) {
      return createRateLimitResponse(webhookResult, corsHeaders)
    }
    const { taskId, sourceTable, emailRuleType }: UpdateTaskStatusRequest = await req.json();

    console.log('Processing status update request:', { taskId, sourceTable, emailRuleType });

    // Only process if this is a task_information_needed or subtask_information_needed email for tasks or subtasks
    if ((emailRuleType === 'task_information_needed' || emailRuleType === 'subtask_information_needed') && (sourceTable === 'tasks' || sourceTable === 'subtasks')) {
      
      // Get the current task/subtask to check its status
      const { data: currentRecord, error: fetchError } = await supabase
        .from(sourceTable)
        .select('status, assigned_by, created_by')
        .eq('id', taskId)
        .single() as { data: { status: string; assigned_by?: string; created_by?: string } | null; error: any };

      if (fetchError) {
        console.error('Error fetching current record:', fetchError);
        throw fetchError;
      }

      // Only update if the current status is 'need_information'
      if (currentRecord?.status === 'need_information') {
        const { error: updateError } = await supabase
          .from(sourceTable)
          .update({ status: 'pending_response' })
          .eq('id', taskId);

        if (updateError) {
          console.error('Error updating status:', updateError);
          throw updateError;
        }

        console.log(`Successfully updated ${sourceTable} ${taskId} status from need_information to pending_response`);

        // Add a system comment to track this change
        const commentTable = sourceTable === 'tasks' ? 'task_comments' : 'subtask_comments';
        const commentField = sourceTable === 'tasks' ? 'task_id' : 'subtask_id';
        
        await supabase
          .from(commentTable)
          .insert({
            [commentField]: taskId,
            user_id: currentRecord.assigned_by || currentRecord.created_by,
            comment_text: 'Status automatically changed to "Pending Response" after information request email was sent.',
            is_system_comment: true
          });

        const response = new Response(
          JSON.stringify({ success: true, message: 'Status updated successfully' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
        
        return addRateLimitHeaders(response, webhookResult);
      } else {
        console.log(`Status not updated - current status is ${currentRecord?.status}, expected need_information`);
        const response = new Response(
          JSON.stringify({ success: false, message: 'Status not updated - not in need_information state' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
        
        return addRateLimitHeaders(response, webhookResult);
      }
    }

    const response = new Response(
      JSON.stringify({ success: false, message: 'Not applicable for this email type' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
    
    return addRateLimitHeaders(response, webhookResult);

  } catch (error: any) {
    console.error('Error in update-task-status-after-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);