-- Debug and fix RLS policy for slabs table
-- This migration adds additional checks and ensures the policy works correctly

-- First, let's create a helper function to debug RLS issues
create or replace function public.debug_slabs_insert_check(p_seller_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_auth_uid uuid;
  v_profiles_exists boolean;
  v_result jsonb;
begin
  -- Get current auth.uid()
  v_auth_uid := auth.uid();
  
  -- Check if profile exists
  select exists(select 1 from public.profiles where id = p_seller_id) into v_profiles_exists;
  
  -- Build result
  v_result := jsonb_build_object(
    'auth_uid', v_auth_uid,
    'seller_id_param', p_seller_id,
    'matches', v_auth_uid = p_seller_id,
    'profile_exists', v_profiles_exists,
    'auth_uid_is_null', v_auth_uid is null,
    'seller_id_is_null', p_seller_id is null
  );
  
  return v_result;
end;
$$;

-- Grant execute permission
grant execute on function public.debug_slabs_insert_check(uuid) to authenticated, anon;

-- Drop and recreate the insert policy with better error handling
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'slabs') then
    -- Drop existing policy
    drop policy if exists "Sellers can insert own slabs" on public.slabs;
    
    -- Recreate policy with explicit checks
    -- Note: seller_id must be uuid type and must equal auth.uid()
    -- Foreign key constraint already ensures profile exists, so we don't need to check it here
    create policy "Sellers can insert own slabs"
      on public.slabs
      for insert
      to authenticated
      with check (
        -- Ensure user is authenticated
        auth.uid() is not null
        -- Ensure seller_id matches auth.uid()
        and seller_id = auth.uid()
        -- Ensure seller_id is not null (required by foreign key)
        and seller_id is not null
      );
  end if;
end $$;

-- Add comment
comment on policy "Sellers can insert own slabs" on public.slabs is 
  'Allows authenticated users to insert slabs where seller_id matches auth.uid() and profile exists in profiles table.';

