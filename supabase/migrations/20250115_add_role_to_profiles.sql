-- Add role column to profiles table for user authorization
-- This enables moderator and admin roles

alter table public.profiles
  add column if not exists role text default 'user' check (role in ('user', 'moderator', 'admin'));

-- Create index for faster role lookups
create index if not exists idx_profiles_role on public.profiles(role);

-- Add comment
comment on column public.profiles.role is 'User role: user (default), moderator, admin';

-- Now we can enable the moderator policies for disputes
-- Note: This will only run if the disputes table exists
-- The disputes table is created in 20250115_create_disputes_table.sql
-- If you're running migrations in order, these policies will be added after disputes table is created
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'disputes'
  ) then
    -- Drop old policies if they exist
    drop policy if exists "Moderators can view all disputes" on public.disputes;
    drop policy if exists "Moderators can update all disputes" on public.disputes;

    -- Moderators can view all disputes
    create policy "Moderators can view all disputes"
      on public.disputes
      for select
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
          and p.role in ('moderator', 'admin')
        )
      );

    -- Moderators can update all disputes
    create policy "Moderators can update all disputes"
      on public.disputes
      for update
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
          and p.role in ('moderator', 'admin')
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
          and p.role in ('moderator', 'admin')
        )
      );
  end if;
end $$;

