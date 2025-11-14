-- Add card edition variant fields to slabs table
-- These fields track special Pokemon card variants that affect value

alter table public.slabs
  add column if not exists first_edition boolean default false,
  add column if not exists shadowless boolean default false,
  add column if not exists pokemon_center_edition boolean default false,
  add column if not exists prerelease boolean default false,
  add column if not exists staff boolean default false,
  add column if not exists tournament_card boolean default false,
  add column if not exists error_card boolean default false;

-- Add comments for documentation
comment on column public.slabs.first_edition is 'First Edition stamp variant (Pokemon Base Set)';
comment on column public.slabs.shadowless is 'Shadowless variant (early Base Set print run)';
comment on column public.slabs.pokemon_center_edition is 'Pokemon Center exclusive edition';
comment on column public.slabs.prerelease is 'Prerelease promo variant';
comment on column public.slabs.staff is 'Staff tournament variant';
comment on column public.slabs.tournament_card is 'Tournament prize card variant';
comment on column public.slabs.error_card is 'Error card or misprint variant';

-- Create index for common filter combinations
create index if not exists idx_slabs_edition_variants 
  on public.slabs(first_edition, shadowless, pokemon_center_edition, prerelease, staff, tournament_card, error_card)
  where status = 'active';

