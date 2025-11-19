-- SQL queries to check current listings

-- 1. Basic query: All active listings with basic info
SELECT 
  id,
  name,
  card_id,
  card_number,
  set_name,
  grade,
  price,
  currency,
  status,
  seller_id,
  cert_number,
  created_at
FROM public.slabs
WHERE status = 'active'
ORDER BY created_at DESC;

-- 2. Detailed query: Active listings with related data
SELECT 
  s.id,
  s.name,
  s.card_id,
  c.name as card_name,
  s.card_number,
  s.set_name,
  s.grade,
  s.price,
  s.currency,
  s.status,
  s.seller_id,
  p.full_name as seller_name,
  s.cert_number,
  gc.name as grading_company_name,
  s.created_at
FROM public.slabs s
LEFT JOIN public.cards c ON s.card_id = c.id
LEFT JOIN public.profiles p ON s.seller_id = p.id
LEFT JOIN public.grading_companies gc ON s.grading_company_id = gc.id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;

-- 3. Count listings by status
SELECT 
  status,
  COUNT(*) as count
FROM public.slabs
GROUP BY status;

-- 4. Listings for a specific card (replace 'CARD_ID_HERE' with actual card ID)
SELECT 
  s.id,
  s.name,
  s.card_id,
  s.card_number,
  s.set_name,
  s.grade,
  s.price,
  s.currency,
  s.status,
  s.seller_id,
  p.full_name as seller_name,
  s.cert_number,
  s.created_at
FROM public.slabs s
LEFT JOIN public.profiles p ON s.seller_id = p.id
WHERE s.card_id = 'CARD_ID_HERE'
  AND s.status = 'active'
ORDER BY s.price ASC;

-- 5. Recent listings (last 10)
SELECT 
  id,
  name,
  card_id,
  card_number,
  set_name,
  grade,
  price,
  seller_id,
  status,
  created_at
FROM public.slabs
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check if specific slab exists (replace 'SLAB_ID_HERE' with actual slab ID)
SELECT 
  id,
  name,
  card_id,
  card_number,
  set_name,
  grade,
  price,
  status,
  seller_id,
  created_at
FROM public.slabs
WHERE id = 'SLAB_ID_HERE';

