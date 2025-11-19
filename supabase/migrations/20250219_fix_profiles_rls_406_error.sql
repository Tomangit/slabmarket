-- Fix 406 errors for profiles table
-- This migration updates RLS policies to ensure users can read their own profiles
-- and adds better handling for authenticated users

-- ============================================
-- PROFILES RLS POLICIES UPDATE
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    -- Drop existing policies
    drop policy if exists "Allow read access to profiles" on public.profiles;
    drop policy if exists "Users can read own profile" on public.profiles;
    
    -- Policy 1: Users can always read their own profile
    create policy "Users can read own profile"
      on public.profiles
      for select
      to authenticated
      using (auth.uid() = id);
    
    -- Policy 2: Allow public read access (for marketplace, etc.)
    -- This allows anonymous users to read basic profile info
    create policy "Allow public read access to profiles"
      on public.profiles
      for select
      to anon, authenticated
      using (true);
    
    -- Keep existing update policy
    drop policy if exists "Users can update own profile" on public.profiles;
    create policy "Users can update own profile"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);

    -- Keep existing insert policy
    drop policy if exists "Users can insert own profile" on public.profiles;
    create policy "Users can insert own profile"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);

    -- Keep service role policy
    drop policy if exists "Allow service role to manage profiles" on public.profiles;
    create policy "Allow service role to manage profiles"
      on public.profiles
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- Add comment
comment on table public.profiles is 'User profiles. RLS policies allow users to read their own profile and public read access for marketplace features.';

