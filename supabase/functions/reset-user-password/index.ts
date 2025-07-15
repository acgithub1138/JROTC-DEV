
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
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

    // Parse request body first to get userId
    const { userId, newPassword }: ResetPasswordRequest = await req.json()

    if (!userId || !newPassword) {
      throw new Error('User ID and new password are required')
    }

    // Check if user has permission to reset passwords
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('Unable to verify user permissions')
    }

    // Get the target user's profile to check permissions
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('id', userId)
      .single()

    if (targetUserError || !targetUser) {
      throw new Error('Target user not found')
    }

    // Check permissions based on current user role
    let hasPermission = false;

    if (profile.role === 'admin') {
      // Admins can reset anyone's password
      hasPermission = true;
    } else if (profile.role === 'instructor') {
      // Instructors can reset passwords for cadets, command_staff, and parents in their school
      // but not for other instructors or admins
      hasPermission = profile.school_id === targetUser.school_id && 
                     targetUser.role !== 'admin' && 
                     targetUser.role !== 'instructor';
    }

    if (!hasPermission) {
      throw new Error('Insufficient permissions to reset this user\'s password')
    }

    // Validate password length
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    console.log('User', user.id, 'resetting password for user:', userId)

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
