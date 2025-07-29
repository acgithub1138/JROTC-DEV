import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Contact form submission received');
    
    // Parse the request body
    const formData: ContactFormData = await req.json();
    console.log('Form data received:', { name: formData.name, email: formData.email, school: formData.school });

    // For now, just log the submission and return success
    // This can be enhanced later to send actual emails
    console.log('Contact form data:', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      school: formData.school,
      cadets: formData.cadets,
      message: formData.message,
      type: formData.type
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact form submitted successfully' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Error processing contact form:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to submit contact form' 
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