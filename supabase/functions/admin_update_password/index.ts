// Supabase Edge Function: admin_update_password
// Updates a user's password via Auth Admin API

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdatePasswordPayload {
  user_id: string
  password: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as UpdatePasswordPayload
    const { user_id, password } = payload
    console.log('admin_update_password: payload received', { user_id, password_len: password?.length })
    if (!user_id || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing SERVICE_ROLE_KEY' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await adminClient.auth.admin.updateUserById(user_id, { password })
    if (error) {
      console.error('admin_update_password: update error', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e) {
    console.error('admin_update_password: unhandled error', e)
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})


