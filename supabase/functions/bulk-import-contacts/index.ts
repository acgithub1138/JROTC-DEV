import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactImportData {
  name: string;
  phone?: string;
  email: string;
  cadet_id?: string;
  type: 'parent' | 'relative' | 'friend' | 'other';
  type_other?: string;
  status: 'active' | 'semi_active' | 'not_active';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('school_id, id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.school_id) {
      throw new Error('School not found for user');
    }

    const { contacts } = await req.json();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      parentAccountsCreated: 0,
    };

    // Import password generator
    const { generateSecurePassword } = await import('../_shared/password-generator.ts');

    for (const contact of contacts as ContactImportData[]) {
      try {
        let finalCadetId = contact.cadet_id;

        // Create contact record
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            name: contact.name,
            phone: contact.phone || null,
            email: contact.email,
            cadet_id: finalCadetId || null,
            type: contact.type,
            type_other: contact.type_other || null,
            status: contact.status,
            school_id: userProfile.school_id,
            created_by: userProfile.id,
          })
          .select()
          .single();

        if (contactError) {
          results.failed++;
          results.errors.push(`Failed to create contact ${contact.name}: ${contactError.message}`);
          continue;
        }

        // If type is parent and has cadet_id, create parent account
        if (contact.type === 'parent' && finalCadetId) {
          try {
            const tempPassword = generateSecurePassword(12);
            const parentRoleId = 'f8134411-7778-4c37-a39a-e727cfa197c8';

            // Extract first and last name from full name
            const nameParts = contact.name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Create parent auth account
            const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
              email: contact.email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
                school_id: userProfile.school_id,
                role: 'parent',
                role_id: parentRoleId,
                password_change_required: true,
                temp_pswd: tempPassword,
              },
            });

            if (signUpError) {
              console.error('Failed to create parent account:', signUpError);
              results.errors.push(`Created contact but failed to create parent account for ${contact.name}: ${signUpError.message}`);
            } else {
              // Update profile with password_change_required
              await supabase
                .from('profiles')
                .update({
                  password_change_required: true,
                  temp_pswd: tempPassword,
                })
                .eq('id', signUpData.user.id);

              // Queue welcome email using the global template
              await supabase.rpc('queue_email', {
                template_id_param: null, // Will use global template
                recipient_email_param: contact.email,
                source_table_param: 'profiles',
                record_id_param: signUpData.user.id,
                school_id_param: userProfile.school_id,
              });

              results.parentAccountsCreated++;
            }
          } catch (parentError: any) {
            console.error('Error creating parent account:', parentError);
            results.errors.push(`Created contact but failed to create parent account for ${contact.name}: ${parentError.message}`);
          }
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Error importing ${contact.name}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in bulk-import-contacts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
