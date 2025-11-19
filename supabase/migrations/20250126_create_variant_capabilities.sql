-- Create table for deterministic per-card variant capabilities
create table if not exists public.variant_capabilities (
  card_id text primary key references public.cards(id) on delete cascade,
  first_edition boolean not null default false,
  shadowless boolean not null default false,
  holo boolean not null default false,
  reverse_holo boolean not null default false,
  pokemon_center_edition boolean not null default false,
  prerelease boolean not null default false,
  staff boolean not null default false,
  tournament_card boolean not null default false,
  error_card boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_variant_capabilities_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_variant_capabilities_updated_at on public.variant_capabilities;
create trigger trg_variant_capabilities_updated_at
before update on public.variant_capabilities
for each row execute function public.set_variant_capabilities_updated_at();


