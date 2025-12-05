
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  validateAuthentication, 
  requireCanToggleUserStatus,
  AuthenticationError, 
  AuthorizationError 
} from '../_shared/auth-utils.ts'
import {
  RateLimiter,
  RATE_LIMITS,
  getClientIP,
  createRateLimitResponse,
  addRateLimitHeaders
} from '../_shared/rate-limiter.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

interface ToggleUserStatusRequest {
  userId?: string
  userIds?: string[]
  active: boolean
}

// Rate limiters
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: 'global' })
const userMgmtLimiter = new RateLimiter({ ...RATE_LIMITS.USER_MANAGEMENT, keyPrefix: 'user-mgmt' })

serve(async (req) => {
  console.log('Toggle user status function started, method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting - Global IP check
    const clientIP = getClientIP(req)
    const globalResult = globalLimiter.check(clientIP)
    if (!globalResult.allowed) {
      return createRateLimitResponse(globalResult, corsHeaders)
    }

    // Validate authentication and get user context
    const { profile: actorProfile, supabaseAdmin } = await validateAuthentication(req)
    
    // Rate limiting - Per user check for authenticated users
    const userResult = userMgmtLimiter.check(actorProfile.id)
    if (!userResult.allowed) {
      return createRateLimitResponse(userResult, corsHeaders)
    }

    console.log('Authentication validated for user:', actorProfile.id, 'role:', actorProfile.role)

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

    console.log('User', actorProfile.id, 'toggling status for users:', usersToProcess, 'to active:', active)

    // Process each user
    const results = []
    const errors = []

    for (const targetUserId of usersToProcess) {
      try {
        // Get target user's profile for permission validation
        const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
          .from('profiles')
          .select('id, role, school_id, active')
          .eq('id', targetUserId)
          .single()

        if (targetProfileError || !targetProfile) {
          console.error('Failed to get target user profile for', targetUserId, ':', targetProfileError)
          errors.push({ userId: targetUserId, error: 'Target user not found' })
          continue
        }

        // Validate permissions for this specific user
        try {
          await requireCanToggleUserStatus(actorProfile, targetProfile, supabaseAdmin)
        } catch (permissionError) {
          console.error('Permission denied for user', targetUserId, ':', permissionError.message)
          errors.push({ userId: targetUserId, error: permissionError.message })
          continue
        }

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

    let response
    if (errorCount === 0) {
      response = new Response(
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
      response = new Response(
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
    
    return addRateLimitHeaders(response, userResult)

  } catch (error) {
    console.error('Function error:', error)
    
    // Handle different error types with appropriate status codes
    let statusCode = 400
    if (error instanceof AuthenticationError) {
      statusCode = error.statusCode
    } else if (error instanceof AuthorizationError) {
      statusCode = error.statusCode
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred toggling user status' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      },
    )
  }
})
