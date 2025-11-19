-- Create function to generate slug for cards
-- This will automatically generate slugs when cards are inserted/updated

-- First, create the slug generation function
CREATE OR REPLACE FUNCTION generate_card_slug(card_name TEXT, set_name TEXT, card_number TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase and normalize
  slug := LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        COALESCE(set_name, '') || '-' || COALESCE(card_name, ''),
        '[^a-z0-9\s-]', '', 'g' -- Remove special characters
      ),
      '\s+', '-', 'g' -- Replace spaces with hyphens
    )
  );
  
  -- Add card number if provided
  IF card_number IS NOT NULL AND card_number != '' THEN
    slug := slug || '-' || LOWER(REGEXP_REPLACE(card_number, '[^a-z0-9]', '', 'g'));
  END IF;
  
  -- Remove leading/trailing hyphens
  slug := TRIM(BOTH '-' FROM slug);
  
  -- Remove multiple consecutive hyphens
  slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function that generates slug if not provided
CREATE OR REPLACE FUNCTION set_card_slug()
RETURNS TRIGGER AS $$
DECLARE
  generated_slug TEXT;
  slug_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Only generate slug if it's not already set
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    generated_slug := generate_card_slug(NEW.name, NEW.set_name, NEW.card_number);
    
    -- Check if slug already exists (excluding current row on update)
    LOOP
      SELECT EXISTS(
        SELECT 1 FROM public.cards 
        WHERE slug = generated_slug 
        AND id != COALESCE(NEW.id, '')
      ) INTO slug_exists;
      
      EXIT WHEN NOT slug_exists;
      
      -- If slug exists, append a counter
      counter := counter + 1;
      generated_slug := generated_slug || '-' || counter::TEXT;
    END LOOP;
    
    NEW.slug := generated_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before insert or update
DROP TRIGGER IF EXISTS cards_set_slug_trigger ON public.cards;
CREATE TRIGGER cards_set_slug_trigger
  BEFORE INSERT OR UPDATE OF name, set_name, card_number, slug ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION set_card_slug();

-- Add comment
COMMENT ON FUNCTION generate_card_slug IS 'Generates a URL-friendly slug from card name, set name, and optional card number';
COMMENT ON FUNCTION set_card_slug IS 'Trigger function that automatically generates slug for cards if not provided';

