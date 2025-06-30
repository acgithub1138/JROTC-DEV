
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmtpTestRequest {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      smtp_host,
      smtp_port,
      smtp_username,
      smtp_password,
      from_email,
      from_name,
      use_tls
    }: SmtpTestRequest = await req.json();

    console.log(`Testing SMTP connection to ${smtp_host}:${smtp_port}`);

    // For now, we'll do a basic validation check
    // In a real implementation, you would use a proper SMTP library
    // to test the actual connection
    
    if (!smtp_host || !smtp_username || !smtp_password || !from_email) {
      throw new Error('Missing required SMTP configuration fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from_email)) {
      throw new Error('Invalid from_email format');
    }

    if (!emailRegex.test(smtp_username)) {
      throw new Error('Invalid smtp_username format');
    }

    // Validate port
    if (smtp_port < 1 || smtp_port > 65535) {
      throw new Error('Invalid SMTP port number');
    }

    // Validate common SMTP ports
    const commonPorts = [25, 465, 587, 2525];
    if (!commonPorts.includes(smtp_port)) {
      console.warn(`Warning: ${smtp_port} is not a common SMTP port`);
    }

    // Basic host validation
    if (!smtp_host.includes('.')) {
      throw new Error('Invalid SMTP host format');
    }

    console.log('SMTP configuration validation passed');

    const result = {
      success: true,
      message: 'SMTP configuration appears valid',
      details: {
        host: smtp_host,
        port: smtp_port,
        username: smtp_username,
        from_email: from_email,
        from_name: from_name,
        use_tls: use_tls,
        timestamp: new Date().toISOString()
      }
    };

    return new Response(JSON.stringify(result), {
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
        error: error.message || 'SMTP connection test failed'
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
});
