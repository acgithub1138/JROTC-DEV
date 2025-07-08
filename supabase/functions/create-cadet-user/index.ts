

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

    // Create user directly without email verification
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Generate random password
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
    // Note: We need to wait a moment for the trigger to create the profile
    setTimeout(async () => {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          role,
          grade: grade || null,
          rank: rank || null,
          flight: flight || null,
        })
        .eq('id', authUser.user!.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      } else {
        console.log('Profile updated successfully with role:', role)
      }
    }, 1000)

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

