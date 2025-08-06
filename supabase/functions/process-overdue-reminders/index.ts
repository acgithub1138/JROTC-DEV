import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
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

interface ProcessingResult {
  processed_count: number;
  school_id: string;
  reminder_type: string;
  tasks_found: number;
}

// Rate limiters
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: 'global' })
const emailLimiter = new RateLimiter({ ...RATE_LIMITS.EMAIL_PROCESSING, keyPrefix: 'reminders' })

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 Processing overdue task & subtask reminders at:', new Date().toISOString());

  try {
    // Rate limiting - Global IP check
    const clientIP = getClientIP(req)
    const globalResult = globalLimiter.check(clientIP)
    if (!globalResult.allowed) {
      return createRateLimitResponse(globalResult, corsHeaders)
    }

    // Rate limiting - Email processing specific check
    const emailResult = emailLimiter.check(clientIP)
    if (!emailResult.allowed) {
      return createRateLimitResponse(emailResult, corsHeaders)
    }
    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to process overdue reminders
    const { data: results, error } = await supabase
      .rpc('process_overdue_task_reminders');

    if (error) {
      console.error('❌ Error processing overdue reminders:', error);
      throw error;
    }

    const processingResults = results as ProcessingResult[];
    
    // Count total processed
    const totalProcessed = processingResults.reduce((sum, result) => sum + result.processed_count, 0);
    const uniqueSchools = new Set(processingResults.map(r => r.school_id).filter(Boolean));
    
    console.log(`✅ Processed ${totalProcessed} overdue reminders across ${uniqueSchools.size} schools`);
    
    // Group results by reminder type for logging
    const resultsByType = processingResults.reduce((acc, result) => {
      if (result.reminder_type && result.reminder_type !== 'none') {
        acc[result.reminder_type] = (acc[result.reminder_type] || 0) + result.processed_count;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(resultsByType).length > 0) {
      console.log('📊 Breakdown by reminder type:', resultsByType);
    }

    // Return summary
    const response = {
      success: true,
      totalProcessed,
      schoolsProcessed: uniqueSchools.size,
      resultsByType,
      timestamp: new Date().toISOString(),
      message: totalProcessed > 0 
        ? `Successfully processed ${totalProcessed} overdue reminders (tasks & subtasks)`
        : 'No overdue task or subtask reminders to process at this time'
    };

    const httpResponse = new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    
    return addRateLimitHeaders(httpResponse, emailResult);

  } catch (error: any) {
    console.error('❌ Error in process-overdue-reminders function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
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
};

serve(handler);