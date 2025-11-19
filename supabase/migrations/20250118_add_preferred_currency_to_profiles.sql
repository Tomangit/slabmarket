-- Add preferred_currency column to profiles table
-- This will store the user's preferred currency for displaying prices

-- Add column with default value 'USD'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD' NOT NULL;

-- Add constraint to ensure valid currency codes
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_preferred_currency_check 
CHECK (preferred_currency IN ('USD', 'EUR', 'GBP', 'PLN', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY'));

-- Add comment
COMMENT ON COLUMN public.profiles.preferred_currency IS 'User preferred currency for displaying prices (ISO 4217 code)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_currency ON public.profiles(preferred_currency);


