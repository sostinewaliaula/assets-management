-- supabase_asset_requests_rpc.sql
-- RPC helpers for asset requests to safely operate with RLS enabled

-- Create or replace SECURITY DEFINER function to create an asset request
create or replace function public.create_asset_request(
  p_user_id uuid,
  p_title text,
  p_description text,
  p_type text,
  p_priority text,
  p_department_id uuid
)
returns public.asset_requests
language plpgsql
security definer
as $$
declare
  new_req public.asset_requests;
begin
  insert into public.asset_requests(
    user_id, title, description, type, priority, department_id, status
  ) values (
    p_user_id, p_title, p_description, p_type, p_priority, p_department_id, 'Pending'
  ) returning * into new_req;

  return new_req;
end;
$$;

-- Allow all authenticated users to execute the RPC
grant execute on function public.create_asset_request(uuid, text, text, text, text, uuid) to authenticated;


