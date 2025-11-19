-- Simple RPC function to test auth.uid() in RLS context
create or replace function public.get_auth_uid()
returns uuid
language sql
security definer
stable
as $$
  select auth.uid();
$$;

-- Grant execute permission to authenticated users
grant execute on function public.get_auth_uid() to authenticated, anon;

