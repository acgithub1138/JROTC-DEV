
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.7";

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

async function testSmtpConnection(config: SmtpTestRequest): Promise<{ success: boolean; message: string; details?: any }> {
  const { smtp_host, smtp_port, smtp_username, smtp_password, use_tls } = config;
  
  try {
    console.log(`Testing SMTP connection to ${smtp_host}:${smtp_port} with TLS: ${use_tls}`);
    
    // Configure transporter based on port and TLS settings
    let transporterConfig: any = {
      host: smtp_host,
      port: smtp_port,
      auth: {
        user: smtp_username,
        pass: smtp_password,
      },
    };

    // Configure TLS/SSL based on port and user preference
    if (smtp_port === 465) {
      // Implicit SSL for port 465
      transporterConfig.secure = true;
    } else if (use_tls && (smtp_port === 587 || smtp_port === 25)) {
      // Explicit TLS (STARTTLS) for port 587 or 25
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
      transporterConfig.tls = {
        ciphers: 'SSLv3',
      };
    } else {
      // No encryption
      transporterConfig.secure = false;
    }

    // Add connection timeout
    transporterConfig.connectionTimeout = 15000;
    transporterConfig.greetingTimeout = 10000;
    transporterConfig.socketTimeout = 10000;

    console.log('Creating SMTP transporter with config:', {
      host: smtp_host,
      port: smtp_port,
      secure: transporterConfig.secure,
      requireTLS: transporterConfig.requireTLS,
    });

    // Create transporter
    const transporter = nodemailer.createTransporter(transporterConfig);

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    
    console.log('SMTP connection verified successfully');

    // Close the transporter
    transporter.close();

    return {
      success: true,
      message: 'SMTP connection and authentication test successful',
      details: {
        host: smtp_host,
        port: smtp_port,
        username: smtp_username,
        use_tls: use_tls,
        connection_type: smtp_port === 465 ? 'Implicit SSL/TLS' : (use_tls ? 'STARTTLS' : 'Plain'),
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('SMTP connection test failed:', error);
    
    let errorMessage = 'SMTP connection test failed';
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `Cannot connect to SMTP server ${smtp_host}:${smtp_port}. The server may be down or the port may be blocked.`;
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorMessage = `Connection to ${smtp_host}:${smtp_port} timed out. The server may be unresponsive or there may be a firewall blocking the connection.`;
    } else if (error.code === 'EAUTH' || error.responseCode === 535 || error.message.includes('authentication')) {
      errorMessage = 'SMTP authentication failed. Please verify your username and password are correct.';
    } else if (error.code === 'ESOCKET' || error.message.includes('TLS') || error.message.includes('SSL')) {
      errorMessage = `TLS/SSL connection failed. Please verify the TLS setting is correct for port ${smtp_port}.`;
    } else if (error.responseCode === 550) {
      errorMessage = `SMTP server rejected the connection. The server may not allow connections from this IP address.`;
    } else if (error.responseCode && error.response) {
      errorMessage = `SMTP server error (${error.responseCode}): ${error.response}`;
    }

    throw new Error(errorMessage);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const config: SmtpTestRequest = await req.json();

    // Basic validation
    if (!config.smtp_host || !config.smtp_username || !config.smtp_password || !config.from_email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required SMTP configuration fields',
          details: { error: 'Missing required fields: smtp_host, smtp_username, smtp_password, from_email' }
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

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(config.from_email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid from_email format',
          details: { error: 'Please provide a valid email address for from_email' }
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

    if (!emailRegex.test(config.smtp_username)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid smtp_username format',
          details: { error: 'Please provide a valid email address for smtp_username' }
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

    // Validate port
    if (config.smtp_port < 1 || config.smtp_port > 65535) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid SMTP port number',
          details: { error: 'Port must be between 1 and 65535' }
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
