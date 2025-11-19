-- Add slug column to cards table for URL-friendly identifiers
-- Slugs will be generated from card name + set name + card number

ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_cards_slug ON public.cards(slug);

-- Create unique constraint on slug (after data is populated)
-- Note: This will be added after import, as we need to ensure slugs are unique first
-- Uncomment after initial import:
-- ALTER TABLE public.cards ADD CONSTRAINT cards_slug_unique UNIQUE (slug);

-- Add comment
COMMENT ON COLUMN public.cards.slug IS 'URL-friendly identifier generated from card name, set name, and card number';

