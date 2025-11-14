-- Create cart_sessions table for storing user shopping carts
-- This table stores cart items in JSON format for each user

create table if not exists public.cart_sessions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists idx_cart_sessions_user_id on public.cart_sessions(user_id);

-- Enable RLS
alter table public.cart_sessions enable row level security;

-- RLS Policies
-- Users can only access their own cart
create policy "Users can access own cart"
  on public.cart_sessions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service role can manage all carts
create policy "Allow service role to manage carts"
  on public.cart_sessions
  for all
  to service_role
  using (true)
  with check (true);

-- Create function to update updated_at timestamp
create or replace function update_cart_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_cart_sessions_updated_at
  before update on public.cart_sessions
  for each row
  execute function update_cart_sessions_updated_at();

-- Add comment
comment on table public.cart_sessions is 'Stores user shopping cart sessions with items in JSON format';

