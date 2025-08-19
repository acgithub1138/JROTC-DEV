import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  RateLimiter,
  RATE_LIMITS,
  getClientIP,
  createRateLimitResponse,
  addRateLimitHeaders
} from '../_shared/rate-limiter.ts'
import nodemailer from "npm:nodemailer@6.9.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
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

    // Get SMTP settings from environment
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUsername = Deno.env.get('SMTP_USERNAME');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD');
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL');
    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'JROTC CCC Contact Form';

    if (!smtpHost || !smtpUsername || !smtpPassword || !fromEmail) {
      throw new Error('SMTP configuration is incomplete');
    }

    // Configure SMTP transporter
    let transporterConfig: any = {
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    };

    // Configure TLS/SSL based on port
    if (smtpPort === 465) {
      transporterConfig.secure = true;
      transporterConfig.tls = {
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        rejectUnauthorized: true,
      };
    } else if (smtpPort === 587 || smtpPort === 25) {
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
      transporterConfig.tls = {
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        rejectUnauthorized: true,
        servername: smtpHost,
      };
    } else {
      transporterConfig.secure = false;
    }

    // Create email content
    const emailSubject = `Contact Form Submission from ${formData.name} - ${formData.school}`;
    const emailBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
      <p><strong>School/Institution:</strong> ${formData.school}</p>
      <p><strong>Number of Cadets:</strong> ${formData.cadets || 'Not specified'}</p>
      <p><strong>Interest Type:</strong> ${formData.type}</p>
      <h3>Message:</h3>
      <p>${formData.message || 'No additional message provided'}</p>
      <hr>
      <p><small>Submitted on: ${new Date().toISOString()}</small></p>
    `;

    // Create transporter and send email
    const transporter = nodemailer.createTransport(transporterConfig);
    
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: 'admin@jrotc.us',
      replyTo: formData.email,
      subject: emailSubject,
      html: emailBody,
    };

    await transporter.sendMail(mailOptions);
    transporter.close();

    console.log(`[contact-form] ${requestId} email sent successfully`);

    // Simple success response
    const response = {
      success: true,
      message: 'Contact form submitted and email sent successfully',
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