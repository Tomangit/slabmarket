-- Create wishlists and wishlist_items tables
-- This migration creates a multi-list wishlist system similar to Cardmarket

-- Create wishlists table
create table if not exists public.wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint wishlists_name_length check (char_length(name) >= 1 and char_length(name) <= 100),
  constraint wishlists_description_length check (description is null or char_length(description) <= 500)
);

-- Create wishlist_items table
create table if not exists public.wishlist_items (
  id uuid default gen_random_uuid() primary key,
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  slab_id uuid not null references public.slabs(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wishlist_id, slab_id)
);

-- Create indexes
create index if not exists idx_wishlists_user_id on public.wishlists(user_id);
create index if not exists idx_wishlists_user_created on public.wishlists(user_id, created_at desc);
create index if not exists idx_wishlist_items_wishlist_id on public.wishlist_items(wishlist_id);
create index if not exists idx_wishlist_items_slab_id on public.wishlist_items(slab_id);
create index if not exists idx_wishlist_items_wishlist_created on public.wishlist_items(wishlist_id, created_at desc);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for wishlists updated_at
create trigger set_wishlists_updated_at
  before update on public.wishlists
  for each row
  execute function public.handle_updated_at();

-- Enable RLS
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;

-- RLS Policies for wishlists
do $$
begin
  -- Users can view their own wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlists' 
    and policyname = 'Users can view own wishlists'
  ) then
    create policy "Users can view own wishlists"
      on public.wishlists
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;

  -- Users can insert their own wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlists' 
    and policyname = 'Users can insert own wishlists'
  ) then
    create policy "Users can insert own wishlists"
      on public.wishlists
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;

  -- Users can update their own wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlists' 
    and policyname = 'Users can update own wishlists'
  ) then
    create policy "Users can update own wishlists"
      on public.wishlists
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  -- Users can delete their own wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlists' 
    and policyname = 'Users can delete own wishlists'
  ) then
    create policy "Users can delete own wishlists"
      on public.wishlists
      for delete
      to authenticated
      using (user_id = auth.uid());
  end if;

  -- Service role can manage all wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlists' 
    and policyname = 'Allow service role to manage wishlists'
  ) then
    create policy "Allow service role to manage wishlists"
      on public.wishlists
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- RLS Policies for wishlist_items
do $$
begin
  -- Users can view items in their own wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlist_items' 
    and policyname = 'Users can view items in own wishlists'
  ) then
    create policy "Users can view items in own wishlists"
      on public.wishlist_items
      for select
      to authenticated
      using (
        exists (
          select 1 from public.wishlists
          where wishlists.id = wishlist_items.wishlist_id
          and wishlists.user_id = auth.uid()
        )
      );
  end if;

  -- Users can insert items into their own wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlist_items' 
    and policyname = 'Users can insert items into own wishlists'
  ) then
    create policy "Users can insert items into own wishlists"
      on public.wishlist_items
      for insert
      to authenticated
      with check (
        exists (
          select 1 from public.wishlists
          where wishlists.id = wishlist_items.wishlist_id
          and wishlists.user_id = auth.uid()
        )
      );
  end if;

  -- Users can delete items from their own wishlists
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlist_items' 
    and policyname = 'Users can delete items from own wishlists'
  ) then
    create policy "Users can delete items from own wishlists"
      on public.wishlist_items
      for delete
      to authenticated
      using (
        exists (
          select 1 from public.wishlists
          where wishlists.id = wishlist_items.wishlist_id
          and wishlists.user_id = auth.uid()
        )
      );
  end if;

  -- Service role can manage all wishlist items
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'wishlist_items' 
    and policyname = 'Allow service role to manage wishlist items'
  ) then
    create policy "Allow service role to manage wishlist items"
      on public.wishlist_items
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- Create function to ensure only one default wishlist per user
create or replace function public.ensure_single_default_wishlist()
returns trigger as $$
begin
  if new.is_default = true then
    -- Set all other wishlists for this user to not default
    update public.wishlists
    set is_default = false
    where user_id = new.user_id
    and id != new.id
    and is_default = true;
  end if;
  return new;
end;
$$ language plpgsql;

-- Create trigger to ensure only one default wishlist per user
create trigger ensure_single_default_wishlist_trigger
  before insert or update on public.wishlists
  for each row
  execute function public.ensure_single_default_wishlist();

-- Comments
comment on table public.wishlists is 'User-created wishlists for organizing favorite slabs';
comment on table public.wishlist_items is 'Items (slabs) added to wishlists';
comment on column public.wishlists.is_default is 'Whether this is the default wishlist for the user';
comment on column public.wishlists.name is 'Name of the wishlist (1-100 characters)';
comment on column public.wishlists.description is 'Optional description of the wishlist (max 500 characters)';

