
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ToggleUserStatusRequest {
  userId: string
  active: boolean
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

    // Check if user is admin or instructor
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !['admin', 'instructor'].includes(profile?.role)) {
      throw new Error('Insufficient permissions - admin or instructor role required')
    }

    const { userId, active }: ToggleUserStatusRequest = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    console.log('User', user.id, 'toggling status for user:', userId, 'to active:', active)

    // Update the user's ban status using admin API
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: active ? "none" : "876600h", // 100 years for inactive users
    })

    if (authUpdateError) {
      console.error('Auth update error:', authUpdateError)
      throw authUpdateError
    }

    // Update profile active status
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ active: active })
      .eq('id', userId)

    if (profileUpdateError) {
      console.error('Profile update error:', profileUpdateError)
      throw profileUpdateError
    }

    console.log('User status toggled successfully for user:', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${active ? 'activated' : 'deactivated'} successfully`
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
        error: error.message || 'An error occurred toggling user status' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
