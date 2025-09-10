
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateSecurePassword } from '../_shared/password-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

interface CreateCadetRequest {
  email: string
  password?: string
  first_name: string
  last_name: string
  role?: string // Use string instead of hardcoded roles
  role_id?: string // Accept role_id as string (like "command staff") 
  grade?: string
  rank?: string
  flight?: string
  cadet_year?: string
  start_year?: number
  school_id: string
}

// Initialize Supabase admin client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Import shared auth utilities
import { validateAuthentication } from '../_shared/auth-utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started')
    
    // Validate authentication using shared utility
    const { profile: actorProfile } = await validateAuthentication(req)
    
    console.log('Authentication validated for user:', actorProfile.id, 'role:', actorProfile.role)

    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody))

    const { 
      email, 
      password,
      first_name, 
      last_name, 
      role,
      role_id, // Accept role_id as alternative to role
      grade, 
      rank, 
      flight, 
      cadet_year,
      start_year,
      school_id 
    }: CreateCadetRequest = requestBody

    // Determine the role - role_id can be a UUID or role can be a string
    let finalRoleId: string
    let finalRoleName: string
    
    if (role_id && typeof role_id === 'string') {
      // role_id is provided as UUID - look it up to get the role name
      const { data: roleFromId, error: roleIdError } = await supabaseAdmin
        .from('user_roles')
        .select('id, role_name')
        .eq('id', role_id)
        .single()
      
      if (roleIdError || !roleFromId) {
        console.error('Role lookup by ID error:', roleIdError)
        throw new Error(`Invalid role ID: ${role_id}`)
      }
      
      finalRoleId = roleFromId.id
      finalRoleName = roleFromId.role_name
      console.log('Using role_id:', role_id, 'found role:', finalRoleName)
      
    } else if (role) {
      // role is provided as string name - look up the ID
      const { data: roleFromName, error: roleNameError } = await supabaseAdmin
        .from('user_roles')
        .select('id, role_name')
        .eq('role_name', role)
        .single()
      
      if (roleNameError || !roleFromName) {
        console.error('Role lookup by name error:', roleNameError)
        throw new Error(`Invalid role: ${role}`)
      }
      
      finalRoleId = roleFromName.id
      finalRoleName = roleFromName.role_name
      console.log('Using role:', role, 'found ID:', finalRoleId)
      
    } else {
      // Default to cadet role
      const { data: defaultRole, error: defaultRoleError } = await supabaseAdmin
        .from('user_roles')
        .select('id, role_name')
        .eq('role_name', 'cadet')
        .single()
      
      if (defaultRoleError || !defaultRole) {
        console.error('Default cadet role lookup error:', defaultRoleError)
        throw new Error('Could not find default cadet role')
      }
      
      finalRoleId = defaultRole.id
      finalRoleName = defaultRole.role_name
      console.log('Defaulting to cadet role')
    }

    // Validate input parameters
    if (!email || !first_name || !last_name || !school_id) {
      throw new Error('Required fields missing: email, first_name, last_name, school_id')
    }

    // Check permissions using database instead of hardcoded roles
    const { data: hasCreatePermission, error: permissionError } = await supabaseAdmin
      .rpc('check_user_permission', {
        user_id: actorProfile.id,
        module_name: 'cadets',
        action_name: 'create'
      })
    
    if (permissionError || !hasCreatePermission) {
      console.error('Permission check error:', permissionError)
      throw new Error('You do not have permission to create users')
    }
    
    // Non-admin users can only create users for their own school
    if (actorProfile.role !== 'admin' && actorProfile.school_id !== school_id) {
      throw new Error('You can only create users for your own school')
    }

    console.log('Creating user:', email, 'with role:', finalRoleName, 'role_id:', finalRoleId, 'in school:', school_id)

    // Generate password if none provided
    const finalPassword = password || generateSecurePassword(12);
    
    // Create user directly with provided or default password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true, // Skip email verification
      user_metadata: {
        first_name,
        last_name,
        role: finalRoleName,
        role_id: finalRoleId,
        school_id,
        generated_password: password ? null : finalPassword // Only include if password was generated
      }
    })

    if (authError) {
      console.error('Auth invitation error:', authError)
      // Check if it's a duplicate email error - check multiple possible error messages
      if (authError.message && (
        authError.message.includes('already been registered') ||
        authError.message.includes('User already registered') ||
        authError.message.includes('already registered') ||
        authError.message.includes('email already exists') ||
        authError.message.includes('duplicate') ||
        authError.code === 'user_already_exists'
      )) {
        return new Response(
          JSON.stringify({ 
            error: 'User email already exists. Please change it and try again.',
            code: 'duplicate_email'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }
      throw authError
    }

    console.log('User created:', email, 'user id:', authUser.user?.id, 'with role:', finalRoleName)

    // Update the profile that will be automatically created by the trigger
    // Use a more reliable approach with retries for profile updates
    const updateProfile = async (retries = 3): Promise<void> => {
      for (let i = 0; i < retries; i++) {
        // Wait for profile to be created by trigger (reduced delay for bulk operations)
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)))
        
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            role: finalRoleName,
            role_id: finalRoleId, // Set the role_id from the lookup
            grade: grade || null,
            rank: rank || null,
            flight: flight || null,
            cadet_year: cadet_year || null,
            start_year: start_year || null,
            password_change_required: password ? false : true, // Only require password change if using default password
          })
          .eq('id', authUser.user!.id)

        if (!profileError) {
          console.log('Profile updated successfully with role:', finalRoleName, 'password_change_required:', password ? false : true)
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
    
    // Fetch the complete profile data to return
    const { data: profileData, error: profileFetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authUser.user!.id)
      .single()
    
    if (profileFetchError) {
      console.error('Failed to fetch created profile:', profileFetchError)
      throw profileFetchError
    }

    const response = new Response(
      JSON.stringify({ 
        success: true, 
        profile: profileData,
        user_id: authUser.user!.id,
        email_sent: false,
        role: finalRoleName
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
    
    return response

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

