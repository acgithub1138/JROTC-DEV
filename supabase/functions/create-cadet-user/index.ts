
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

    // Validate authentication using shared utility
    const authResult = await validateAuthentication(req)
    const actorProfile = authResult.profile
    
    console.log('Authentication validated for user:', actorProfile.id, 'role:', actorProfile.role)

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

    // Validate input parameters
    if (!email || !first_name || !last_name || !school_id) {
      throw new Error('Required fields missing: email, first_name, last_name, school_id')
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
        generated_password: password ? null : finalPassword, // Pass password to trigger for immediate use
        // Pass additional profile fields for trigger to set
        grade: grade || null,
        rank: rank || null,
        flight: flight || null,
        cadet_year: cadet_year || null,
        start_year: start_year || null
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

    // Directly insert profile (don't rely on trigger which may be broken/missing)
    // Store temp_pswd if password was generated
    const profileInsert = {
      id: authUser.user!.id,
      email,
      first_name,
      last_name,
      role: finalRoleName,
      role_id: finalRoleId,
      school_id,
      grade: grade || null,
      rank: rank || null,
      flight: flight || null,
      cadet_year: cadet_year || null,
      start_year: start_year || null,
      active: true,
      temp_pswd: password ? null : finalPassword, // Store generated password for email
      password_change_required: !password // Require change if we generated it
    }

    console.log('Inserting profile into public.profiles for user:', authUser.user!.id)
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileInsert, { onConflict: 'id' })
      .select()
      .single()
    
    if (profileError) {
      console.error('Profile insert failed:', profileError)
      
      // Cleanup: delete the auth user to avoid orphaned accounts
      console.log('Cleaning up auth user due to profile insert failure')
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
        console.log('Auth user deleted successfully')
      } catch (deleteError) {
        console.error('Failed to cleanup auth user:', deleteError)
      }
      
      // Return detailed error
      throw new Error(`Profile creation failed: ${profileError.message || 'Unknown error'}. The user account was not created.`)
    }
    
    console.log('Profile created successfully for user:', authUser.user!.id)

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
        error: error instanceof Error ? error.message : 'An error occurred creating the user' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

