
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  validateAuthentication, 
  requireCanCreateUserWithRole, 
  requireSameSchool,
  AuthenticationError, 
  AuthorizationError 
} from '../_shared/auth-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

interface CreateCadetRequest {
  email: string
  password?: string
  first_name: string
  last_name: string
  role?: 'admin' | 'instructor' | 'command_staff' | 'cadet' | 'parent'
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
    console.log('Function started')
    
    // Validate authentication and get user context
    const { profile: actorProfile, supabaseAdmin } = await validateAuthentication(req)

    console.log('Authentication validated for user:', actorProfile.id, 'role:', actorProfile.role)

    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody))

    const { 
      email, 
      password,
      first_name, 
      last_name, 
      role = 'cadet',
      grade, 
      rank, 
      flight, 
      school_id 
    }: CreateCadetRequest = requestBody

    // Validate input parameters
    if (!email || !first_name || !last_name || !school_id) {
      throw new Error('Required fields missing: email, first_name, last_name, school_id')
    }

    // Validate permissions to create user with specified role
    requireCanCreateUserWithRole(actorProfile, role)

    // Validate school access (non-admins can only create users in their own school)
    requireSameSchool(actorProfile, school_id)

    console.log('Creating user:', email, 'with role:', role, 'in school:', school_id)

    // Create user directly with provided or default password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || 'Sh0wc@se', // Use provided password or default
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
      // Check if it's a duplicate email error
      if (authError.message && authError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ 
            error: 'User email already exists. Please change it and try again.' 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }
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
            password_change_required: password ? false : true, // Only require password change if using default password
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
    
    // Handle different error types with appropriate status codes
    let statusCode = 400
    if (error instanceof AuthenticationError) {
      statusCode = error.statusCode
    } else if (error instanceof AuthorizationError) {
      statusCode = error.statusCode
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred creating the user' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      },
    )
  }
})

