-- Create disputes table for buyer protection and dispute resolution
-- This table tracks disputes between buyers and sellers

create table if not exists public.disputes (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  created_by_id uuid not null references auth.users(id) on delete cascade,
  dispute_type text not null check (dispute_type in ('item_not_received', 'item_not_as_described', 'damaged_item', 'wrong_item', 'other')),
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'closed', 'escalated')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  title text not null,
  description text not null,
  evidence_urls text[] default '{}',
  moderator_id uuid references auth.users(id) on delete set null,
  resolution text,
  resolved_at timestamp with time zone,
  resolved_by_id uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index if not exists idx_disputes_transaction_id on public.disputes(transaction_id);
create index if not exists idx_disputes_created_by_id on public.disputes(created_by_id);
create index if not exists idx_disputes_status on public.disputes(status);
create index if not exists idx_disputes_moderator_id on public.disputes(moderator_id);

-- Enable RLS
alter table public.disputes enable row level security;

-- RLS Policies
-- Users can view disputes for their own transactions
create policy "Users can view disputes for own transactions"
  on public.disputes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
      and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

-- Users can create disputes for their own transactions
create policy "Users can create disputes for own transactions"
  on public.disputes
  for insert
  to authenticated
  with check (
    created_by_id = auth.uid()
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id
      and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

-- Users can update their own disputes (only if open)
create policy "Users can update own open disputes"
  on public.disputes
  for update
  to authenticated
  using (
    created_by_id = auth.uid()
    and status = 'open'
  )
  with check (
    created_by_id = auth.uid()
    and status = 'open'
  );

-- Note: Moderator policies are commented out because profiles table doesn't have a 'role' column yet.
-- To enable moderator access, either:
-- 1. Add a 'role' column to profiles table: ALTER TABLE public.profiles ADD COLUMN role text;
-- 2. Or create a separate moderators table
-- 3. Or use a different authorization mechanism

-- For now, moderators will need to use service role key or we can add role column later
-- Uncomment and modify these policies after adding role column:

-- -- Moderators can view all disputes
-- create policy "Moderators can view all disputes"
--   on public.disputes
--   for select
--   to authenticated
--   using (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid()
--       and p.role = 'moderator'
--     )
--   );
--
-- -- Moderators can update all disputes
-- create policy "Moderators can update all disputes"
--   on public.disputes
--   for update
--   to authenticated
--   using (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid()
--       and p.role = 'moderator'
--     )
--   )
--   with check (
--     exists (
--       select 1 from public.profiles p
--       where p.id = auth.uid()
--       and p.role = 'moderator'
--     )
--   );

-- Add trigger to update updated_at
create or replace function update_disputes_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_disputes_updated_at
  before update on public.disputes
  for each row
  execute function update_disputes_updated_at();

-- Add trigger to set escrow_status to 'disputed' when dispute is created
create or replace function set_transaction_disputed()
returns trigger as $$
begin
  update public.transactions
  set escrow_status = 'disputed'
  where id = new.transaction_id
  and escrow_status != 'disputed';
  return new;
end;
$$ language plpgsql;

create trigger set_transaction_disputed
  after insert on public.disputes
  for each row
  execute function set_transaction_disputed();

-- Add comments
comment on table public.disputes is 'Disputes between buyers and sellers for transaction resolution';
comment on column public.disputes.dispute_type is 'Type of dispute: item_not_received, item_not_as_described, damaged_item, wrong_item, other';
comment on column public.disputes.status is 'Dispute status: open, under_review, resolved, closed, escalated';
comment on column public.disputes.priority is 'Dispute priority: low, normal, high, urgent';
comment on column public.disputes.evidence_urls is 'Array of URLs to evidence files (images, documents)';

