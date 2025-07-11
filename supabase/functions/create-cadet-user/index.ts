

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCadetRequest {
  email: string
  first_name: string
  last_name: string
  role?: 'cadet' | 'command_staff'
  grade?: string
  rank?: string
  flight?: string
  school_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      email, 
      first_name, 
      last_name, 
      role = 'cadet',
      grade, 
      rank, 
      flight, 
      school_id 
    }: CreateCadetRequest = await req.json()

    console.log('Creating user:', email, 'with role:', role)

    // Create user directly with default password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'Sh0wc@se', // Default password
      email_confirm: true, // Skip email verification
      user_metadata: {
        first_name,
        last_name,
        role,
        school_id
      }
    })

    if (authError) {
      console.error('Auth invitation error:', authError)
      throw authError
    }

    console.log('User created:', email, 'user id:', authUser.user?.id, 'with role:', role)

    // Update the profile that will be automatically created by the trigger
    // Use a more reliable approach with retries for profile updates
    const updateProfile = async (retries = 3): Promise<void> => {
      for (let i = 0; i < retries; i++) {
        // Wait for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role,
            grade: grade || null,
            rank: rank || null,
            flight: flight || null,
            password_change_required: true, // Force password change on first login
          })
          .eq('id', authUser.user!.id)

        if (!profileError) {
          console.log('Profile updated successfully with role:', role, 'password_change_required: true')
          return
        }
        
        console.error(`Profile update attempt ${i + 1} failed:`, profileError)
        if (i === retries - 1) {
          throw profileError
        }
      }
    }

    // Wait for profile update to complete before returning
    await updateProfile()

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUser.user!.id,
        email_sent: false,
        role: role
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred sending the invitation' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

