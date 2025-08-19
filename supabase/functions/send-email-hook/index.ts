import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailHookRequest {
  user: {
    email: string;
    id: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

interface CustomEmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

serve(async (req) => {
  console.log('🚀 Send Email Hook function started');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const body = await req.json();

    // Check if this is a Supabase auth email hook or custom email
    if (body.user && body.email_data) {
      // This is a Supabase auth email hook
      const emailData = body as EmailHookRequest;
      
      console.log(`Processing auth email for ${emailData.user.email}, type: ${emailData.email_data.email_action_type}`);

      // Handle different email types
      let subject = '';
      let html = '';

      switch (emailData.email_data.email_action_type) {
        case 'signup':
          subject = 'Confirm your signup';
          html = `
            <h1>Welcome!</h1>
            <p>Please confirm your email address by clicking the link below:</p>
            <a href="${emailData.email_data.site_url}/auth/v1/verify?token=${emailData.email_data.token_hash}&type=${emailData.email_data.email_action_type}&redirect_to=${emailData.email_data.redirect_to}">
              Confirm your email
            </a>
          `;
          break;
        case 'recovery':
          subject = 'Reset your password';
          html = `
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${emailData.email_data.site_url}/auth/v1/verify?token=${emailData.email_data.token_hash}&type=${emailData.email_data.email_action_type}&redirect_to=${emailData.email_data.redirect_to}">
              Reset your password
            </a>
          `;
          break;
        case 'invite':
          subject = 'You have been invited';
          html = `
            <h1>You're invited!</h1>
            <p>Click the link below to accept your invitation:</p>
            <a href="${emailData.email_data.site_url}/auth/v1/verify?token=${emailData.email_data.token_hash}&type=${emailData.email_data.email_action_type}&redirect_to=${emailData.email_data.redirect_to}">
              Accept invitation
            </a>
          `;
          break;
        case 'magic_link':
          subject = 'Your magic link';
          html = `
            <h1>Magic Link Login</h1>
            <p>Click the link below to log in:</p>
            <a href="${emailData.email_data.site_url}/auth/v1/verify?token=${emailData.email_data.token_hash}&type=${emailData.email_data.email_action_type}&redirect_to=${emailData.email_data.redirect_to}">
              Log in with magic link
            </a>
            <p>Or use this code: <strong>${emailData.email_data.token}</strong></p>
          `;
          break;
        default:
          subject = 'Email from our app';
          html = `
            <p>Please click the link below:</p>
            <a href="${emailData.email_data.site_url}/auth/v1/verify?token=${emailData.email_data.token_hash}&type=${emailData.email_data.email_action_type}&redirect_to=${emailData.email_data.redirect_to}">
              Continue
            </a>
          `;
      }

      const emailResponse = await resend.emails.send({
        from: 'JROTC Management <noreply@yourdomain.com>',
        to: [emailData.user.email],
        subject,
        html,
      });

      console.log('Auth email sent successfully:', emailResponse);

      return new Response(JSON.stringify(emailResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });

    } else if (body.to && body.subject && body.html) {
      // This is a custom email request (from our queue processor)
      const emailRequest = body as CustomEmailRequest;
      
      console.log(`Sending custom email to ${emailRequest.to}`);

      const emailResponse = await resend.emails.send({
        from: emailRequest.from || 'JROTC Management <noreply@yourdomain.com>',
        to: [emailRequest.to],
        subject: emailRequest.subject,
        html: emailRequest.html,
      });

      console.log('Custom email sent successfully:', emailResponse);

      return new Response(JSON.stringify(emailResponse), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });

    } else {
      console.error('Invalid request body format');
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

  } catch (error) {
    console.error('Error in send-email-hook function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
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