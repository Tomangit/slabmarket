-- Add language column to slabs table
-- This allows filtering listings by card language (e.g., English, Polish, Japanese)

alter table public.slabs
  add column if not exists language text check (language in ('english', 'polish', 'japanese', 'french', 'german', 'spanish', 'italian', 'portuguese', 'korean', 'chinese'));

-- Add index for language filtering
create index if not exists idx_slabs_language on public.slabs(language) where status = 'active';

-- Add comment
comment on column public.slabs.language is 'Card language (e.g., english, polish, japanese). Used for filtering listings by language.';

