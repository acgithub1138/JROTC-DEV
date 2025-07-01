
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
  job_role?: string
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
      job_role, 
      school_id 
    }: CreateCadetRequest = await req.json()

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

    console.log('Creating user for:', email, 'with role:', role)

    // Create auth user with admin client
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        role,
        school_id
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw authError
    }

    console.log('Auth user created:', authUser.user?.id, 'with role:', role)

    // Update the profile that was automatically created by the trigger
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role,
        grade: grade || null,
        rank: rank || null,
        flight: flight || null,
        job_role: job_role || null,
      })
      .eq('id', authUser.user!.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      throw profileError
    }

    console.log('Profile updated successfully with role:', role)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUser.user!.id,
        temp_password: tempPassword,
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
        error: error.message || 'An error occurred creating the user' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
