import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { generateSecurePassword } from '../_shared/password-generator.ts';

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
  jrotc_program: string;
  timezone?: string;
  referred_by?: string;
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

    // Create school record with comp_register_only flag
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: schoolData.name,
        initials: schoolData.initials || null,
        contact: schoolData.contact_person,
        email: schoolData.contact_email,
        phone: schoolData.contact_phone || null,
        jrotc_program: schoolData.jrotc_program,
        timezone: schoolData.timezone || null,
        referred_by: schoolData.referred_by || null,
        comp_basic: true,
        comp_analytics: true
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

    

    // Create user account for contact person
    let userCreated = false;
    let passwordResetSent = false;
    let userCreationMessage = '';

    try {
      // Get the external role ID
      const { data: externalRole, error: roleError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role_name', 'external')
        .single();

      if (roleError) {
        console.error('Error getting external role:', roleError);
        throw new Error('Failed to get external role');
      }

    // Generate secure password
    const generatedPassword = generateSecurePassword(12);
    
    // Create user account (same as create cadet - no email sent)
    const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
      email: schoolData.contact_email,
      password: generatedPassword,
      email_confirm: true, // Skip email verification like create cadet
      user_metadata: {
        first_name: schoolData.contact_person.split(' ')[0] || schoolData.contact_person,
        last_name: schoolData.contact_person.split(' ').slice(1).join(' ') || '',
        school_id: school.id,
        role: 'external',
        role_id: externalRole.id,
        generated_password: generatedPassword // Pass password to trigger for immediate use
      }
    });

      if (userError) {
        console.error('Error creating user:', userError);
        if (userError.message.includes('already registered')) {
          userCreationMessage = 'Email already has an account - they can use existing login';
        } else {
          throw userError;
        }
      } else {
        userCreated = true;
        userCreationMessage = 'Account created successfully';
      }
    } catch (error) {
      console.error('Error in user creation process:', error);
      userCreationMessage = 'School registered but failed to create user account';
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        schoolId: school.id,
        message: 'School registered successfully',
        userAccount: {
          created: userCreated,
          passwordResetSent: false, // Same as create cadet - no email sent
          message: userCreationMessage
        }
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