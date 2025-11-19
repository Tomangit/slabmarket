-- Fix RLS policy for cards table
-- Ensure that anon and authenticated users can read all cards
-- This migration fixes the issue where cards are accessible via view but not directly

do $$
begin
  -- Drop existing policies to recreate them
  drop policy if exists "Allow read access to cards" on public.cards;
  drop policy if exists "Allow service role to manage cards" on public.cards;
  
  -- Create policy that allows read access for anon and authenticated users
  -- This should allow all cards to be read by anyone (public data)
  create policy "Allow read access to cards"
    on public.cards
    for select
    to anon, authenticated
    using (true);
  
  -- Ensure service role can manage cards
  create policy "Allow service role to manage cards"
    on public.cards
    for all
    to service_role
    using (true)
    with check (true);
  
  -- Verify RLS is enabled
  alter table public.cards enable row level security;
  
  raise notice 'RLS policies for cards table have been updated';
end $$;

-- Verify the policies exist
do $$
declare
  policy_count integer;
begin
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'cards'
    and policyname = 'Allow read access to cards';
  
  if policy_count = 0 then
    raise exception 'Policy "Allow read access to cards" was not created';
  end if;
  
  raise notice 'Verified: Policy "Allow read access to cards" exists';
end $$;

