
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

import type { ProcessingResult } from './types.ts'
import { QueueProcessor } from './queue-processor.ts'


// Rate limiters
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: 'global' })
const emailLimiter = new RateLimiter({ ...RATE_LIMITS.EMAIL_PROCESSING, keyPrefix: 'email-queue' })

serve(async (req) => {
  console.log('🚀 Process Email Queue function started');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Add health check endpoint
  if (req.method === 'GET') {
    console.log('✅ Health check endpoint accessed');
    return new Response(
      JSON.stringify({ 
        status: 'healthy',
        message: 'Email queue processor is running',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
  
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

    const response = new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    
    return addRateLimitHeaders(response, emailResult);

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
