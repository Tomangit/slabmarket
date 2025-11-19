-- Remove all duplicate listings, keeping only the most recent one for each card_id
-- This will delete all listings except the one with the latest created_at timestamp

-- First, let's see what we're deleting (for verification)
-- SELECT 
--   id,
--   card_id,
--   name,
--   price,
--   created_at,
--   seller_id
-- FROM public.slabs
-- WHERE card_id = 'a380fc96-6220-5f24-b2c9-d05fd729336e'
--   AND id NOT IN (
--     SELECT id 
--     FROM public.slabs
--     WHERE card_id = 'a380fc96-6220-5f24-b2c9-d05fd729336e'
--     ORDER BY created_at DESC
--     LIMIT 1
--   );

-- Delete all duplicate listings, keeping only the most recent one for each card_id
-- For the specific Charizard card (a380fc96-6220-5f24-b2c9-d05fd729336e)
DELETE FROM public.slabs
WHERE card_id = 'a380fc96-6220-5f24-b2c9-d05fd729336e'
  AND id NOT IN (
    SELECT id 
    FROM public.slabs
    WHERE card_id = 'a380fc96-6220-5f24-b2c9-d05fd729336e'
    ORDER BY created_at DESC
    LIMIT 1
  );

-- General cleanup: If there are multiple active listings for the same card_id, seller_id, and cert_number
-- keep only the most recent one (this prevents accidental duplicates from multiple submission attempts)
DELETE FROM public.slabs s1
WHERE EXISTS (
  SELECT 1
  FROM public.slabs s2
  WHERE s2.card_id = s1.card_id
    AND s2.seller_id = s1.seller_id
    AND s2.cert_number = s1.cert_number
    AND s2.status = s1.status
    AND s2.id != s1.id
    AND s2.created_at > s1.created_at
);

