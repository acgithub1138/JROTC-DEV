import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  RateLimiter,
  RATE_LIMITS,
  getClientIP,
  createRateLimitResponse,
  addRateLimitHeaders,
} from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-application-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: "global" });
const publicLimiter = new RateLimiter({ ...RATE_LIMITS.PUBLIC, keyPrefix: "contact" });

serve(async (req) => {
  const requestId = crypto.randomUUID();
  const path = (() => {
    try {
      return new URL(req.url).pathname;
    } catch {
      return "";
    }
  })();
  console.log(`[contact-form] ${requestId} start ${req.method} ${path}`);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    console.log(`[contact-form] ${requestId} method_not_allowed ${req.method}`);
    return new Response(JSON.stringify({ error: "Method not allowed", requestId }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  try {
    // Rate limiting - Global IP check
    const clientIP = getClientIP(req);
    const globalResult = globalLimiter.check(clientIP);
    if (!globalResult.allowed) {
      return createRateLimitResponse(globalResult, corsHeaders);
    }

    // Rate limiting - Function-specific check
    const functionResult = publicLimiter.check(clientIP);
    if (!functionResult.allowed) {
      return createRateLimitResponse(functionResult, corsHeaders);
    }
    console.log(`[contact-form] ${requestId} processing`);

    // Parse the request body
    const formData: ContactFormData = await req.json();

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);

    // Create email content
    const emailSubject = `Contact Form Submission from ${formData.name} - ${formData.school}`;
    const emailBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Phone:</strong> ${formData.phone || "Not provided"}</p>
      <p><strong>School/Institution:</strong> ${formData.school}</p>
      <p><strong>Number of Cadets:</strong> ${formData.cadets || "Not specified"}</p>
      <p><strong>Interest Type:</strong> ${formData.type}</p>
      <h3>Message:</h3>
      <p>${formData.message || "No additional message provided"}</p>
      <hr>
      <p><small>Submitted on: ${new Date().toISOString()}</small></p>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "JROTC CCC Contact Form <dev-noreply@jrotc.us>",
      to: ["admin@jrotc.us"],
      reply_to: formData.email,
      subject: emailSubject,
      html: emailBody,
    });

    console.log(`[contact-form] ${requestId} email sent successfully`, emailResponse);

    const response = {
      success: true,
      message: "Contact form submitted and email sent successfully",
      timestamp: new Date().toISOString(),
      requestId,
    };

    console.log(`[contact-form] ${requestId} success`);

    const httpResponse = new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

    return addRateLimitHeaders(httpResponse, functionResult);
  } catch (error) {
    console.error(`[contact-form] ${requestId} error:`, error instanceof Error ? error.message : String(error));

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit contact form",
        timestamp: new Date().toISOString(),
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
});
