import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchoolRegistrationData {
  name: string;
  initials?: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
  notes?: string;
  color: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const schoolData: SchoolRegistrationData = await req.json();

    // Validate required fields
    if (!schoolData.name || !schoolData.contact_person || !schoolData.contact_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, contact_person, contact_email' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(schoolData.contact_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if school with same name already exists
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .eq('name', schoolData.name)
      .single();

    if (existingSchool) {
      return new Response(
        JSON.stringify({ error: 'A school with this name already exists' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create school record
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: schoolData.name,
        initials: schoolData.initials || null,
        contact: schoolData.contact_person,
        email: schoolData.contact_email,
        phone: schoolData.contact_phone || null,
        notes: schoolData.notes || null,
        jrotc_program: 'army' // Default program for external schools
      })
      .select()
      .single();

    if (schoolError) {
      console.error('Error creating school:', schoolError);
      return new Response(
        JSON.stringify({ error: 'Failed to register school' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('External school registered successfully:', school.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        schoolId: school.id,
        message: 'School registered successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in external-school-registration function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});