// Supabase Edge Function: admin_delete_user
// Deletes a user from Auth and removes the profile from public.users

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteUserPayload {
  user_id: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as DeleteUserPayload
    const { user_id } = payload
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Delete from Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(user_id)
    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Delete profile row
    const { error: profileError } = await adminClient.from('users').delete().eq('id', user_id)
    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})


