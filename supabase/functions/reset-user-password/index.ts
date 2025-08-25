
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  validateAuthentication, 
  requireCanResetPassword, 
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

interface ResetPasswordRequest {
  userId: string
  newPassword: string
}

// Rate limiters
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: 'global' })
const userMgmtLimiter = new RateLimiter({ ...RATE_LIMITS.USER_MANAGEMENT, keyPrefix: 'user-mgmt' })

serve(async (req) => {
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

    // Parse and validate request body
    const { userId, newPassword }: ResetPasswordRequest = await req.json()

    if (!userId || !newPassword) {
      throw new Error('User ID and new password are required')
    }

    // Validate password requirements
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Get target user's profile
    const { data: targetProfile, error: targetUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, school_id, active')
      .eq('id', userId)
      .single()

    if (targetUserError || !targetProfile) {
      throw new Error('Target user not found')
    }

    // Validate permissions to reset password
    await requireCanResetPassword(actorProfile, targetProfile, supabaseAdmin)

    console.log('User', actorProfile.id, 'resetting password for user:', userId)

    // Reset the user's password using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (error) {
      console.error('Password reset error:', error)
      throw error
    }

    console.log('Password reset successful for user:', userId)

    const response = new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
    
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
        error: error.message || 'An error occurred resetting the password' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      },
    )
  }
})
