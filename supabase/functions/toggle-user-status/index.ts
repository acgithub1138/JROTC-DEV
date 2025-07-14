
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ToggleUserStatusRequest {
  userId?: string
  userIds?: string[]
  active: boolean
}

serve(async (req) => {
  console.log('Toggle user status function started, method:', req.method)
  
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

    const { userId, userIds, active }: ToggleUserStatusRequest = await req.json()

    // Determine which users to process
    let usersToProcess: string[] = []
    if (userId) {
      usersToProcess = [userId]
    } else if (userIds && userIds.length > 0) {
      usersToProcess = userIds
    } else {
      throw new Error('Either userId or userIds is required')
    }

    console.log('User', user.id, 'toggling status for users:', usersToProcess, 'to active:', active)

    // Process each user
    const results = []
    const errors = []

    for (const targetUserId of usersToProcess) {
      try {
        // Update the user's ban status using admin API
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          ban_duration: active ? "none" : "876600h", // 100 years for inactive users
        })

        if (authUpdateError) {
          console.error('Auth update error for user', targetUserId, ':', authUpdateError)
          errors.push({ userId: targetUserId, error: authUpdateError.message })
          continue
        }

        // Update profile active status
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({ active: active })
          .eq('id', targetUserId)

        if (profileUpdateError) {
          console.error('Profile update error for user', targetUserId, ':', profileUpdateError)
          errors.push({ userId: targetUserId, error: profileUpdateError.message })
          continue
        }

        results.push({ userId: targetUserId, success: true })
        console.log('User status toggled successfully for user:', targetUserId)
      } catch (error) {
        console.error('Error processing user', targetUserId, ':', error)
        errors.push({ userId: targetUserId, error: error.message })
      }
    }

    const successCount = results.length
    const errorCount = errors.length
    const totalCount = usersToProcess.length

    if (errorCount === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${successCount} user(s) ${active ? 'activated' : 'deactivated'} successfully`,
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else if (successCount > 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${successCount} user(s) ${active ? 'activated' : 'deactivated'} successfully, ${errorCount} failed`,
          results,
          errors
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } else {
      throw new Error(`Failed to ${active ? 'activate' : 'deactivate'} all users`)
    }

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
