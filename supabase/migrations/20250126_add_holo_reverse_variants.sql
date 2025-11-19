-- Add Holo and Reverse Holo variant flags
alter table if exists public.variant_capabilities
  add column if not exists holo boolean default false,
  add column if not exists reverse_holo boolean default false;

alter table if exists public.slabs
  add column if not exists holo boolean default false,
  add column if not exists reverse_holo boolean default false;

-- Helpful indexes for filtering slabs by new flags
create index if not exists idx_slabs_holo on public.slabs(holo) where status = 'active';
create index if not exists idx_slabs_reverse_holo on public.slabs(reverse_holo) where status = 'active';

