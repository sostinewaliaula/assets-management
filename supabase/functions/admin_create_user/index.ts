// Deno Deploy / Supabase Edge Function: admin_create_user
// Creates an auth user via Admin API and a profile row in public.users

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserPayload {
  email: string
  name: string
  role: 'admin' | 'department_officer' | 'user'
  department_id?: string | null
  position?: string | null
  phone?: string | null
  password: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as CreateUserPayload
    const { email, name, role, department_id, position, phone, password } = payload
    if (!email || !name || !role || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Create user with password (email confirmed)
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const authUserId = created.user?.id
    if (!authUserId) {
      return new Response(JSON.stringify({ error: 'Failed to create auth user' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Create or upsert profile in public.users
    const { error: profileError } = await adminClient
      .from('users')
      .upsert({
        id: authUserId,
        email,
        name,
        role,
        department_id: department_id ?? null,
        position: position ?? null,
        phone: phone ?? null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    return new Response(JSON.stringify({ success: true, user_id: authUserId }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})


