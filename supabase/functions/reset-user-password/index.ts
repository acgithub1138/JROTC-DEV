
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetPasswordRequest {
  userId: string
  newPassword: string
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

    // Get the current user to verify admin permissions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated and get their profile
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Insufficient permissions - admin role required')
    }

    const { userId, newPassword }: ResetPasswordRequest = await req.json()

    if (!userId || !newPassword) {
      throw new Error('User ID and new password are required')
    }

    // Validate password length
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    console.log('Admin', user.id, 'resetting password for user:', userId)

    // Reset the user's password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (error) {
      console.error('Password reset error:', error)
      throw error
    }

    console.log('Password reset successful for user:', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully'
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
        error: error.message || 'An error occurred resetting the password' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
