-- Fix RLS policy for slabs table - simplified version
-- This migration ensures the insert policy works correctly

-- First, let's check if RLS is enabled
alter table if exists public.slabs enable row level security;

-- Drop ALL existing insert policies to avoid conflicts
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'slabs') then
    -- Drop all existing insert policies
    drop policy if exists "Sellers can insert own slabs" on public.slabs;
    
    -- Create a simple, straightforward policy
    -- Only check that seller_id matches auth.uid()
    create policy "Sellers can insert own slabs"
      on public.slabs
      for insert
      to authenticated
      with check (
        seller_id = auth.uid()
      );
      
    raise notice 'Slabs insert policy created successfully';
  else
    raise notice 'Slabs table does not exist';
  end if;
end $$;

-- Add comment
comment on policy "Sellers can insert own slabs" on public.slabs is 
  'Allows authenticated users to insert slabs where seller_id matches auth.uid().';

