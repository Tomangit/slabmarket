-- Reviews table for buyer/seller feedback
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  is_public boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Only one review from a reviewer per transaction
create unique index if not exists reviews_unique_reviewer_tx
  on public.reviews (transaction_id, reviewer_id);

-- Fast filtering by users
create index if not exists reviews_by_reviewee on public.reviews (reviewee_id);
create index if not exists reviews_by_reviewer on public.reviews (reviewer_id);

-- Trigger to auto-update updated_at
create or replace function public.set_reviews_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_reviews_updated_at();

-- RLS
alter table public.reviews enable row level security;

-- Read: public (or restrict later if needed)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='read_all_reviews') then
    create policy read_all_reviews on public.reviews for select using (true);
  end if;
end$$;

-- Insert: only the reviewer himself
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='insert_own_review') then
    create policy insert_own_review on public.reviews for insert with check (reviewer_id = auth.uid());
  end if;
end$$;

-- Update/Delete: only author for limited time window (7 days) - soften with simple author check here
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='update_own_review') then
    create policy update_own_review on public.reviews for update using (reviewer_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='reviews' and policyname='delete_own_review') then
    create policy delete_own_review on public.reviews for delete using (reviewer_id = auth.uid());
  end if;
end$$;




