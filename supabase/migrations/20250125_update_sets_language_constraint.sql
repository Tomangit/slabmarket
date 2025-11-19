-- Update sets table to support more languages (polish, french, german, etc.)
-- This allows importing sets in languages other than just english and japanese

-- Drop the old constraint
alter table public.sets
  drop constraint if exists sets_language_check;

-- Add new constraint with all supported languages
alter table public.sets
  add constraint sets_language_check 
  check (language in ('english', 'japanese', 'polish', 'french', 'german', 'spanish', 'italian', 'portuguese', 'korean', 'chinese'));

-- Add comment
comment on column public.sets.language is 'Set language. Supported: english, japanese, polish, french, german, spanish, italian, portuguese, korean, chinese';

