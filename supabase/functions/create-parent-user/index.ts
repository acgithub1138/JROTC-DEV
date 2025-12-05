import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateSecurePassword } from '../_shared/password-generator.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateParentRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  cadet_id: string
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('create-parent-user: Function started')
    
    const requestBody = await req.json()
    console.log('create-parent-user: Request body:', JSON.stringify(requestBody))

    const { 
      email, 
      password,
      first_name, 
      last_name,
      phone,
      cadet_id
    }: CreateParentRequest = requestBody

    // Validate input
    if (!email || !password || !first_name || !last_name || !cadet_id) {
      throw new Error('Required fields missing: email, password, first_name, last_name, cadet_id')
    }

    // Verify cadet exists and get their school_id
    const { data: cadetData, error: cadetError } = await supabaseAdmin
      .from('profiles')
      .select('id, school_id, email')
      .eq('id', cadet_id)
      .eq('active', true)
      .single()

    if (cadetError || !cadetData) {
      console.error('create-parent-user: Cadet lookup error:', cadetError)
      throw new Error('Cadet not found or inactive')
    }

    console.log('create-parent-user: Verified cadet exists:', cadet_id, 'school:', cadetData.school_id)

    // Get parent role
    const { data: parentRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role_name')
      .eq('role_name', 'parent')
      .single()

    if (roleError || !parentRole) {
      console.error('create-parent-user: Parent role lookup error:', roleError)
      throw new Error('Parent role not found')
    }

    console.log('create-parent-user: Creating parent for cadet:', cadet_id)

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: parentRole.role_name,
        role_id: parentRole.id,
        school_id: cadetData.school_id,
        phone,
        cadet_id,
        generated_password: null // User provided password
      }
    })

    if (authError) {
      console.error('create-parent-user: Auth error:', authError)
      if (authError.message && (
        authError.message.includes('already been registered') ||
        authError.message.includes('User already registered') ||
        authError.message.includes('already registered') ||
        authError.message.includes('email already exists')
      )) {
        return new Response(
          JSON.stringify({ 
            error: 'Email already registered. Please use a different email.',
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

    console.log('create-parent-user: Auth user created:', authUser.user!.id)

    // Create profile
    const profileInsert = {
      id: authUser.user!.id,
      email,
      first_name,
      last_name,
      role: parentRole.role_name,
      role_id: parentRole.id,
      school_id: cadetData.school_id,
      phone,
      active: true,
      temp_pswd: null,
      password_change_required: false
    }

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileInsert, { onConflict: 'id' })
      .select()
      .single()
    
    if (profileError) {
      console.error('create-parent-user: Profile insert failed:', profileError)
      
      // Cleanup auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
      } catch (deleteError) {
        console.error('create-parent-user: Failed to cleanup auth user:', deleteError)
      }
      
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }
    
    console.log('create-parent-user: Profile created successfully')

    // Create contact record linking parent to cadet
    const { error: contactError } = await supabaseAdmin
      .from('contacts')
      .insert({
        name: `${last_name}, ${first_name}`,
        email,
        phone,
        type: 'parent',
        status: 'active',
        cadet_id,
        school_id: cadetData.school_id,
        created_by: authUser.user!.id
      })

    if (contactError) {
      console.error('create-parent-user: Contact creation failed:', contactError)
      // Don't fail the entire operation, just log
    } else {
      console.log('create-parent-user: Contact record created')
    }

    // Queue welcome email
    const { data: template } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('source_table', 'profiles')
      .eq('school_id', cadetData.school_id)
      .ilike('name', '%welcome%')
      .eq('is_active', true)
      .single()

    if (template) {
      const { data: queueId } = await supabaseAdmin
        .rpc('queue_email', {
          template_id_param: template.id,
          recipient_email_param: email,
          source_table_param: 'profiles',
          record_id_param: authUser.user!.id,
          school_id_param: cadetData.school_id
        })
      console.log('create-parent-user: Welcome email queued:', queueId)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profileData,
        user_id: authUser.user!.id,
        cadet_email: cadetData.email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('create-parent-user: Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred creating the parent account' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
