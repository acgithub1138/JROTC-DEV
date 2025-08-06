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
  console.log('=== Contact Form Function Called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
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
    console.log('=== Processing POST Request ===');
    
    // Parse the request body
    const formData: ContactFormData = await req.json();
    console.log('Form data received:', formData);

    // Simple success response
    const response = {
      success: true,
      message: 'Contact form submitted successfully',
      timestamp: new Date().toISOString(),
      data: formData
    };

    console.log('Sending success response');

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
    console.error('=== Error in Contact Form ===');
    console.error('Error details:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to submit contact form',
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