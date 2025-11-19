-- Cache wyników weryfikacji certyfikatów, aby ograniczyć liczbę zapytań do PSA/BGS/CGC
create table if not exists public.certificate_cache (
  id uuid primary key default gen_random_uuid(),
  grading_company text not null,
  certificate_number text not null,
  data jsonb not null,
  verified boolean not null default false,
  valid boolean not null default false,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid null
);

create unique index if not exists certificate_cache_unique_key
  on public.certificate_cache (grading_company, certificate_number);

create index if not exists certificate_cache_last_checked_idx
  on public.certificate_cache (last_checked_at);

alter table public.certificate_cache
  enable row level security;

-- polityka: każdy może czytać cache (dane są niewrażliwe), zapisy tylko przez funkcje edge (service role)
drop policy if exists "Allow read cache to anon" on public.certificate_cache;
create policy "Allow read cache to anon"
  on public.certificate_cache
  for select
  to anon, authenticated
  using (true);

-- trigger aktualizacji updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_certificate_cache_updated_at on public.certificate_cache;
create trigger set_certificate_cache_updated_at
before update on public.certificate_cache
for each row execute function public.set_updated_at();


