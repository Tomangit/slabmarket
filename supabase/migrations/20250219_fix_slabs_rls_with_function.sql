-- Alternative fix using a helper function for RLS check
-- This approach uses a function to check auth.uid() in the RLS context

-- Create a helper function that can be used in RLS policy
create or replace function public.check_seller_id(p_seller_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() = p_seller_id;
$$;

-- Grant execute permission
grant execute on function public.check_seller_id(uuid) to authenticated, anon;

-- Ensure RLS is enabled
alter table if exists public.slabs enable row level security;

-- Drop ALL existing insert policies
do $$
declare
  r record;
begin
  for r in 
    select policyname 
    from pg_policies 
    where schemaname = 'public' 
      and tablename = 'slabs'
      and cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on public.slabs', r.policyname);
    raise notice 'Dropped policy: %', r.policyname;
  end loop;
end $$;

-- Create policy using the helper function
-- This ensures auth.uid() is called in the correct RLS context
create policy "Sellers can insert own slabs"
  on public.slabs
  for insert
  to authenticated
  with check (
    public.check_seller_id(seller_id)
  );

-- Add comment
comment on policy "Sellers can insert own slabs" on public.slabs is 
  'Allows authenticated users to insert slabs where seller_id matches auth.uid() using helper function.';

