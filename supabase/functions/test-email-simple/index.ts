import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  recipient: string;
  subject?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🧪 Starting simple email test");
    
    const { recipient, subject = "Test Email" }: TestEmailRequest = await req.json();
    
    console.log(`📧 Sending test email to: ${recipient}`);

    const emailResponse = await resend.emails.send({
      from: 'JROTC CCC <jrotc@careyunlimited.com>',
      to: [recipient],
      subject: subject,
      html: `
        <h1>Test Email</h1>
        <p>This is a simple test email to verify Resend functionality.</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      result: emailResponse,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("❌ Email test failed:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);