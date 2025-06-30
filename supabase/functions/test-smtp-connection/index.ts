
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

async function testSmtpConnection(config: SmtpTestRequest): Promise<{ success: boolean; message: string; details?: any }> {
  const { smtp_host, smtp_port, smtp_username, smtp_password, use_tls } = config;
  
  try {
    console.log(`Testing SMTP connection to ${smtp_host}:${smtp_port} with TLS: ${use_tls}`);
    
    let conn: Deno.Conn;
    
    // Determine connection type based on port and TLS setting
    const isImplicitSSL = smtp_port === 465;
    const shouldUseStartTLS = use_tls && !isImplicitSSL;
    
    if (isImplicitSSL) {
      // Use TLS connection directly for port 465 (implicit SSL)
      console.log('Using implicit SSL/TLS connection');
      conn = await Deno.connectTls({
        hostname: smtp_host,
        port: smtp_port,
      });
    } else {
      // Use plain connection first, will upgrade to TLS if needed
      console.log('Using plain connection' + (shouldUseStartTLS ? ' with STARTTLS' : ''));
      conn = await Deno.connect({
        hostname: smtp_host,
        port: smtp_port,
      });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // Helper function to read response from server
    const readResponse = async (): Promise<string> => {
      const buffer = new Uint8Array(2048);
      const bytesRead = await conn.read(buffer);
      if (bytesRead === null) throw new Error('Connection closed unexpectedly');
      const response = decoder.decode(buffer.subarray(0, bytesRead));
      return response;
    };

    // Helper function to send command and read response
    const sendCommand = async (command: string): Promise<string> => {
      const logCommand = command.startsWith('AUTH PLAIN') || command.includes('PASS') ? 
        command.split(' ')[0] + ' [HIDDEN]' : command;
      console.log(`SMTP Command: ${logCommand}`);
      await conn.write(encoder.encode(command + '\r\n'));
      const response = await readResponse();
      console.log(`SMTP Response: ${response.trim()}`);
      return response;
    };

    // Set connection timeout
    const timeout = setTimeout(() => {
      conn.close();
      throw new Error('Connection timeout after 15 seconds');
    }, 15000);

    try {
      // Read initial server greeting
      const greeting = await readResponse();
      console.log(`Server greeting: ${greeting.trim()}`);
      if (!greeting.startsWith('220')) {
        throw new Error(`Server greeting failed: ${greeting.trim()}`);
      }

      // Send EHLO command
      const ehloResponse = await sendCommand(`EHLO ${smtp_host}`);
      if (!ehloResponse.startsWith('250')) {
        throw new Error(`EHLO command failed: ${ehloResponse.trim()}`);
      }

      // Handle STARTTLS for explicit TLS
      if (shouldUseStartTLS) {
        console.log('Initiating STARTTLS...');
        const startTlsResponse = await sendCommand('STARTTLS');
        if (!startTlsResponse.startsWith('220')) {
          throw new Error(`STARTTLS command failed: ${startTlsResponse.trim()}`);
        }
        
        // Close the plain connection and upgrade to TLS
        conn.close();
        console.log('Upgrading connection to TLS...');
        conn = await Deno.connectTls({
          hostname: smtp_host,
          port: smtp_port,
        });
        
        // Send EHLO again after TLS upgrade
        const ehloTlsResponse = await sendCommand(`EHLO ${smtp_host}`);
        if (!ehloTlsResponse.startsWith('250')) {
          throw new Error(`EHLO after STARTTLS failed: ${ehloTlsResponse.trim()}`);
        }
      }

      // Try AUTH PLAIN first (more widely supported)
      console.log('Attempting AUTH PLAIN authentication...');
      const authPlainCredentials = btoa(`\0${smtp_username}\0${smtp_password}`);
      
      try {
        const authPlainResponse = await sendCommand(`AUTH PLAIN ${authPlainCredentials}`);
        if (!authPlainResponse.startsWith('235')) {
          throw new Error(`AUTH PLAIN failed: ${authPlainResponse.trim()}`);
        }
        console.log('AUTH PLAIN authentication successful');
      } catch (authPlainError) {
        console.log('AUTH PLAIN failed, trying AUTH LOGIN...');
        
        // Fallback to AUTH LOGIN
        const authResponse = await sendCommand('AUTH LOGIN');
        if (!authResponse.startsWith('334')) {
          throw new Error(`AUTH LOGIN command failed: ${authResponse.trim()}`);
        }

        // Send username (base64 encoded)
        const usernameB64 = btoa(smtp_username);
        const userResponse = await sendCommand(usernameB64);
        if (!userResponse.startsWith('334')) {
          throw new Error(`Username authentication failed: ${userResponse.trim()}`);
        }

        // Send password (base64 encoded)
        const passwordB64 = btoa(smtp_password);
        const passResponse = await sendCommand(passwordB64);
        if (!passResponse.startsWith('235')) {
          throw new Error(`Password authentication failed: ${passResponse.trim()}`);
        }
        console.log('AUTH LOGIN authentication successful');
      }

      // Test MAIL FROM command
      const mailFromResponse = await sendCommand(`MAIL FROM:<${config.from_email}>`);
      if (!mailFromResponse.startsWith('250')) {
        console.log(`Warning: MAIL FROM test failed: ${mailFromResponse.trim()}`);
      }

      // Send QUIT to close connection gracefully
      await sendCommand('QUIT');
      
      clearTimeout(timeout);
      conn.close();

      return {
        success: true,
        message: 'SMTP connection, authentication, and configuration test successful',
        details: {
          host: smtp_host,
          port: smtp_port,
          username: smtp_username,
          use_tls: use_tls,
          connection_type: isImplicitSSL ? 'Implicit SSL/TLS' : (shouldUseStartTLS ? 'STARTTLS' : 'Plain'),
          greeting: greeting.trim(),
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      clearTimeout(timeout);
      conn.close();
      throw error;
    }

  } catch (error) {
    console.error('SMTP connection test failed:', error);
    
    let errorMessage = 'SMTP connection test failed';
    
    if (error.message.includes('Connection refused') || error.message.includes('ECONNREFUSED')) {
      errorMessage = `Cannot connect to SMTP server ${smtp_host}:${smtp_port}. Check if the server is running and accessible.`;
    } else if (error.message.includes('timeout')) {
      errorMessage = `Connection to ${smtp_host}:${smtp_port} timed out. Server may be unresponsive or firewall may be blocking the connection.`;
    } else if (error.message.includes('authentication failed') || error.message.includes('535') || error.message.includes('AUTH')) {
      errorMessage = 'SMTP authentication failed. Please verify your username and password are correct.';
    } else if (error.message.includes('STARTTLS') || error.message.includes('TLS')) {
      errorMessage = `TLS/SSL connection failed. Server may not support encryption properly on port ${smtp_port}.`;
    } else if (error.message.includes('greeting')) {
      errorMessage = `SMTP server did not respond with proper greeting. Server may not be an SMTP server or may be misconfigured.`;
    } else if (error.message.includes('EHLO')) {
      errorMessage = `SMTP server rejected EHLO command. Server may not support modern SMTP features.`;
    } else if (error.message.includes('MAIL FROM')) {
      errorMessage = `SMTP server rejected the sender email address: ${config.from_email}. Check if the email address is valid and authorized.`;
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
