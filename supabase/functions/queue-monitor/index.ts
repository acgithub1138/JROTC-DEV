import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueueStats {
  pending_count: number;
  stuck_count: number;
  failed_count: number;
  processing_time_avg: number | null;
  health_status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check queue health automatically
    console.log('🔍 Running automated queue health check...');
    
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_email_queue_health');

    if (healthError) {
      console.error('❌ Health check failed:', healthError);
      throw healthError;
    }

    console.log('✅ Health check completed:', healthData);

    // Auto-retry stuck emails if any are found
    let retryResults: any[] = [];
    const criticalSchools = healthData?.filter((school: any) => school.health_status === 'critical') || [];
    
    if (criticalSchools.length > 0) {
      console.log(`🔧 Found ${criticalSchools.length} schools with critical queue issues, attempting auto-retry...`);
      
      const { data: retryData, error: retryError } = await supabase
        .rpc('retry_stuck_emails', { max_age_minutes: 5 }); // More aggressive retry for monitoring

      if (retryError) {
        console.error('❌ Auto-retry failed:', retryError);
      } else {
        retryResults = retryData || [];
        console.log(`✅ Auto-retry completed: ${retryResults.length} emails retried`);
      }
    }

    // Return monitoring results
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      health_check: healthData,
      auto_retry: {
        attempted: criticalSchools.length > 0,
        retried_count: retryResults.length,
        critical_schools: criticalSchools.length
      },
      summary: {
        total_schools_checked: healthData?.length || 0,
        critical_schools: criticalSchools.length,
        warning_schools: healthData?.filter((s: any) => s.health_status === 'warning').length || 0,
        healthy_schools: healthData?.filter((s: any) => s.health_status === 'healthy').length || 0
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('💥 Queue monitoring error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Queue monitoring failed',
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