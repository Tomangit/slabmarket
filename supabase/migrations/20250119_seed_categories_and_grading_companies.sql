-- Seed categories and grading companies
-- These are required for the application to work properly

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO public.categories (id, name, slug, description, enabled) VALUES
  ('pokemon-tcg', 'Pokemon TCG', 'pokemon-tcg', 'Pokemon Trading Card Game', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- GRADING COMPANIES
-- ============================================
INSERT INTO public.grading_companies (id, name, code, verification_enabled, api_endpoint) VALUES
  ('psa', 'PSA', 'PSA', true, 'https://www.psacard.com/cert/'),
  ('bgs', 'BGS / Beckett', 'BGS', true, 'https://www.beckett.com/grading/card-lookup'),
  ('cgc', 'CGC Cards', 'CGC', true, 'https://www.cgccards.com/certlookup/'),
  ('sgc', 'SGC Grading', 'SGC', true, NULL)
ON CONFLICT (id) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.categories IS 'Product categories (Pokemon TCG, Magic, Sports, etc.)';
COMMENT ON TABLE public.grading_companies IS 'Grading companies (PSA, BGS, CGC, SGC, etc.)';

