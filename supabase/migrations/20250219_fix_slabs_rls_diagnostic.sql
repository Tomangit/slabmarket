-- Diagnostic and fix for slabs RLS policy
-- This migration checks current policies and fixes them

-- First, let's see what policies exist (for debugging)
do $$
declare
  policy_count int;
  policy_names text[];
begin
  -- Count policies on slabs table
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public' and tablename = 'slabs';
  
  -- Get policy names
  select array_agg(policyname) into policy_names
  from pg_policies
  where schemaname = 'public' and tablename = 'slabs';
  
  raise notice 'Current policies on slabs table: %', policy_names;
  raise notice 'Policy count: %', policy_count;
end $$;

-- Ensure RLS is enabled
alter table if exists public.slabs enable row level security;

-- Drop ALL existing insert policies (there might be multiple)
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

-- Create a simple, clear policy
-- Using permissive (default) - allows if ANY policy allows
create policy "Sellers can insert own slabs"
  on public.slabs
  for insert
  to authenticated
  with check (
    seller_id = auth.uid()
  );

-- Verify the policy was created
do $$
declare
  policy_exists boolean;
begin
  select exists(
    select 1 
    from pg_policies 
    where schemaname = 'public' 
      and tablename = 'slabs'
      and policyname = 'Sellers can insert own slabs'
      and cmd = 'INSERT'
  ) into policy_exists;
  
  if policy_exists then
    raise notice 'Policy "Sellers can insert own slabs" created successfully';
  else
    raise notice 'ERROR: Policy was not created!';
  end if;
end $$;

-- Add comment
comment on policy "Sellers can insert own slabs" on public.slabs is 
  'Allows authenticated users to insert slabs where seller_id matches auth.uid().';

