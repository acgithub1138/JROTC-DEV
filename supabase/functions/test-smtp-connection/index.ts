
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpTestRequest } from './types.ts';
import { testSmtpConnection } from './smtp-tester.ts';
import { validateSmtpRequest } from './validators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('SMTP test function invoked:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config: SmtpTestRequest = await req.json();

    // Validate request
    const validation = validateSmtpRequest(config);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: validation.error?.includes('format') ? `Invalid ${validation.error.split(' ')[5]} format` : 'Missing required SMTP configuration fields',
          details: { error: validation.error }
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Perform actual SMTP connection test
    const testResult = await testSmtpConnection(config);

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('SMTP test error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'SMTP connection test failed',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
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
