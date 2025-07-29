import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

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

    // Create Supabase client with service role key for RLS bypass
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create email body with all form details
    const emailBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
      <p><strong>School/Institution:</strong> ${formData.school}</p>
      <p><strong>Number of Cadets:</strong> ${formData.cadets || 'Not specified'}</p>
      <p><strong>Interest Type:</strong> ${formData.type}</p>
      <p><strong>Additional Information:</strong></p>
      <p>${formData.message || 'No additional message provided'}</p>
      
      <hr>
      <p><em>This message was sent through the JROTC Pro contact form.</em></p>
    `;

    // Insert directly into email queue using service role (bypasses RLS)
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        recipient_email: 'jrotc_info@careyunlimited.com',
        subject: `New Contact Form Submission from ${formData.name} - ${formData.school}`,
        body: emailBody,
        source_table: 'contact_form',
        school_id: '00000000-0000-0000-0000-000000000000', // Default for marketing contact forms
        scheduled_at: new Date().toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting into email queue:', error);
      throw error;
    }

    console.log('Email queued successfully:', data.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact form submitted successfully',
        emailId: data.id 
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