import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  school: string;
  cadets: string;
  message: string;
  type: string;
}

// Rate limiters
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: 'global' })
const publicLimiter = new RateLimiter({ ...RATE_LIMITS.PUBLIC, keyPrefix: 'contact' })

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const path = (() => { try { return new URL(req.url).pathname } catch { return '' } })();
  console.log(`[contact-form] ${requestId} start ${req.method} ${path}`);
  // Privacy: do not log headers or body
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    console.log(`[contact-form] ${requestId} method_not_allowed ${req.method}`);
    return new Response(
      JSON.stringify({ error: 'Method not allowed', requestId }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }

  try {
    // Rate limiting - Global IP check
    const clientIP = getClientIP(req)
    const globalResult = globalLimiter.check(clientIP)
    if (!globalResult.allowed) {
      return createRateLimitResponse(globalResult, corsHeaders)
    }

    // Rate limiting - Function-specific check
    const functionResult = publicLimiter.check(clientIP)
    if (!functionResult.allowed) {
      return createRateLimitResponse(functionResult, corsHeaders)
    }
    console.log(`[contact-form] ${requestId} processing`);
    
    // Parse the request body (do not log sensitive content)
    const formData: ContactFormData = await req.json();

    // Simple success response
    const response = {
      success: true,
      message: 'Contact form submitted successfully',
      timestamp: new Date().toISOString(),
      requestId,
    };

    console.log(`[contact-form] ${requestId} success`);

    const httpResponse = new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
    return addRateLimitHeaders(httpResponse, functionResult)

  } catch (error) {
    console.error(`[contact-form] ${requestId} error:`, (error as any)?.message || String(error));
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as any)?.message || 'Failed to submit contact form',
        timestamp: new Date().toISOString(),
        requestId,
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