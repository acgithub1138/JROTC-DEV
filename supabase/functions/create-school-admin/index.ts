import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSchoolAdminRequest {
  name: string
  initials: string
  contact_person: string
  first_name: string
  last_name: string
  contact_email: string
  contact_phone: string
  password: string
  jrotc_program: string
  timezone: string
  referred_by?: string
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
    console.log('create-school-admin: Function started')
    
    const requestBody = await req.json()
    console.log('create-school-admin: Request body received')

    const { 
      name,
      initials,
      contact_person,
      first_name,
      last_name,
      contact_email,
      contact_phone,
      password,
      jrotc_program,
      timezone,
      referred_by
    }: CreateSchoolAdminRequest = requestBody

    // Validate required fields
    if (!name || !initials || !contact_person || !first_name || !last_name || !contact_email || !contact_phone || !password || !jrotc_program || !timezone) {
      throw new Error('Missing required fields')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contact_email)) {
      throw new Error('Invalid email format')
    }

    console.log('create-school-admin: Checking for duplicate school name:', name)

    // Check if school name already exists
    const { data: existingSchool, error: checkError } = await supabaseAdmin
      .from('schools')
      .select('id, name')
      .ilike('name', name)
      .limit(1)

    if (checkError) {
      console.error('create-school-admin: Error checking school:', checkError)
      throw new Error('Error checking existing schools')
    }

    if (existingSchool && existingSchool.length > 0) {
      console.log('create-school-admin: Duplicate school found:', existingSchool[0].name)
      return new Response(
        JSON.stringify({ 
          error: 'A school with this name already exists. Please contact support if you need assistance.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('create-school-admin: Creating school record')

    // Create school record
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name,
        initials,
        contact: contact_person,
        email: contact_email,
        phone: contact_phone,
        jrotc_program,
        timezone,
        referred_by,
        comp_basic: true,
        comp_analytics: true,
        comp_hosting: false
      })
      .select()
      .single()

    if (schoolError) {
      console.error('create-school-admin: School creation error:', schoolError)
      throw new Error(`Failed to create school: ${schoolError.message}`)
    }

    console.log('create-school-admin: School created:', schoolData.id)

    // Get external role
    const { data: externalRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role_name')
      .eq('role_name', 'external')
      .single()

    if (roleError || !externalRole) {
      console.error('create-school-admin: External role lookup error:', roleError)
      
      // Rollback: delete school
      await supabaseAdmin.from('schools').delete().eq('id', schoolData.id)
      
      throw new Error('External role not found')
    }

    console.log('create-school-admin: Creating auth user')

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: contact_email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: externalRole.role_name,
        role_id: externalRole.id,
        school_id: schoolData.id,
        phone: contact_phone,
        generated_password: null
      }
    })

    if (authError) {
      console.error('create-school-admin: Auth error:', authError)
      
      // Rollback: delete school
      await supabaseAdmin.from('schools').delete().eq('id', schoolData.id)
      
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

    console.log('create-school-admin: Auth user created:', authUser.user!.id)

    // Create profile
    const profileInsert = {
      id: authUser.user!.id,
      email: contact_email,
      first_name,
      last_name,
      role: externalRole.role_name,
      role_id: externalRole.id,
      school_id: schoolData.id,
      phone: contact_phone,
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
      console.error('create-school-admin: Profile insert failed:', profileError)
      
      // Rollback: delete auth user and school
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
        await supabaseAdmin.from('schools').delete().eq('id', schoolData.id)
      } catch (deleteError) {
        console.error('create-school-admin: Failed to cleanup:', deleteError)
      }
      
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }
    
    console.log('create-school-admin: Profile created successfully')

    // Queue welcome email (optional - don't fail if template doesn't exist)
    const { data: template } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('source_table', 'profiles')
      .eq('school_id', schoolData.id)
      .ilike('name', '%welcome%')
      .eq('is_active', true)
      .single()

    if (template) {
      const { data: queueId } = await supabaseAdmin
        .rpc('queue_email', {
          template_id_param: template.id,
          recipient_email_param: contact_email,
          source_table_param: 'profiles',
          record_id_param: authUser.user!.id,
          school_id_param: schoolData.id
        })
      console.log('create-school-admin: Welcome email queued:', queueId)
    } else {
      console.log('create-school-admin: No welcome email template found, skipping email')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        school: schoolData,
        profile: profileData,
        user_id: authUser.user!.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('create-school-admin: Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred creating the school account' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})