import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    // Create admin client for operations that need elevated permissions
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { contactId } = await req.json();

    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    // Get the contact details to check type and email
    const { data: contact, error: contactFetchError } = await supabase
      .from('contacts')
      .select('id, type, email')
      .eq('id', contactId)
      .single();

    if (contactFetchError) {
      console.error('Error fetching contact:', contactFetchError);
      throw new Error('Failed to fetch contact details');
    }

    if (!contact) {
      throw new Error('Contact not found');
    }

    // If type is parent, delete the auth user (which will cascade delete profile)
    if (contact.type === 'parent' && contact.email) {
      try {
        // Find the user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          console.error('Error listing users:', listError);
        } else {
          const parentUser = users.find(u => u.email === contact.email);
          
          if (parentUser) {
            // Delete the auth user (profile will cascade delete automatically)
            const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(parentUser.id);
            
            if (deleteAuthError) {
              console.error('Failed to delete parent auth account:', deleteAuthError);
              // Continue with contact deletion even if auth deletion fails
            } else {
              console.log('Successfully deleted parent auth account:', parentUser.id);
            }
          }
        }
      } catch (authDeleteError: any) {
        console.error('Error during parent account deletion:', authDeleteError);
        // Continue with contact deletion even if auth deletion fails
      }
    }

    // Delete the contact record
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (deleteError) {
      console.error('Error deleting contact:', deleteError);
      throw new Error('Failed to delete contact');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Contact deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in delete-contact:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
