import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateJudgeRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
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
    console.log('create-judge-user: Function started')
    
    const requestBody = await req.json()
    console.log('create-judge-user: Request body:', JSON.stringify(requestBody))

    const { 
      email, 
      password,
      first_name, 
      last_name,
      phone
    }: CreateJudgeRequest = requestBody

    // Validate input
    if (!email || !password || !first_name || !last_name) {
      throw new Error('Required fields missing: email, password, first_name, last_name')
    }

    // Get judge role
    const { data: judgeRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id, role_name')
      .eq('role_name', 'judge')
      .single()

    if (roleError || !judgeRole) {
      console.error('create-judge-user: Judge role lookup error:', roleError)
      throw new Error('Judge role not found')
    }

    console.log('create-judge-user: Creating judge account')

    // Create auth user (no school_id for judges)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: judgeRole.role_name,
        role_id: judgeRole.id,
        phone,
        generated_password: null // User provided password
      }
    })

    if (authError) {
      console.error('create-judge-user: Auth error:', authError)
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

    console.log('create-judge-user: Auth user created:', authUser.user!.id)

    // Create profile with temporary school_id (will be set to null by trigger)
    const profileInsert = {
      id: authUser.user!.id,
      email,
      first_name,
      last_name,
      role: judgeRole.role_name,
      role_id: judgeRole.id,
      school_id: 'c0bae42f-9369-4575-b158-926246145b0a',
      phone: phone || null,
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
      console.error('create-judge-user: Profile insert failed:', profileError)
      
      // Cleanup auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
      } catch (deleteError) {
        console.error('create-judge-user: Failed to cleanup auth user:', deleteError)
      }
      
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }
    
    console.log('create-judge-user: Profile created successfully')

    // Create cp_judges record
    const { error: judgeRecordError } = await supabaseAdmin
      .from('cp_judges')
      .insert({
        user_id: authUser.user!.id,
        name: `${last_name}, ${first_name}`,
        email,
        phone: phone || null,
        available: true
      })

    if (judgeRecordError) {
      console.error('create-judge-user: cp_judges insert failed:', judgeRecordError)
      // Don't fail the entire operation, just log
    } else {
      console.log('create-judge-user: cp_judges record created')
    }

    // Queue welcome email using global judge template
    const { data: template } = await supabaseAdmin
      .from('email_templates')
      .select('id')
      .eq('source_table', 'profiles')
      .eq('is_global', true)
      .ilike('name', '%judge%welcome%')
      .eq('is_active', true)
      .single()

    if (template) {
      const { data: queueId } = await supabaseAdmin
        .rpc('queue_email', {
          template_id_param: template.id,
          recipient_email_param: email,
          source_table_param: 'profiles',
          record_id_param: authUser.user!.id,
          school_id_param: 'c0bae42f-9369-4575-b158-926246145b0a' // Use same school_id as profile creation
        })
      console.log('create-judge-user: Welcome email queued:', queueId)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: profileData,
        user_id: authUser.user!.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('create-judge-user: Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred creating the judge account' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
