-- Add slug column to marketplace_cards view
-- This allows the marketplace to use slugs for card URLs

drop view if exists public.marketplace_cards;

create or replace view public.marketplace_cards
as
select 
  c.id,
  c.name,
  c.set_name,
  c.card_number,
  c.slug,
  c.category_id,
  cat.name as category_name,
  c.rarity,
  c.image_url,
  c.year,
  -- Aggregate statistics from slabs (only active slabs)
  count(distinct s.id) filter (where s.status = 'active') as total_listings,
  count(distinct s.seller_id) filter (where s.status = 'active') as total_sellers,
  min(s.price) filter (where s.status = 'active') as lowest_price,
  max(s.price) filter (where s.status = 'active') as highest_price,
  avg(s.price) filter (where s.status = 'active') as average_price,
  array_agg(distinct s.grade) filter (where s.status = 'active') as available_gradings
from public.cards c
left join public.categories cat on c.category_id = cat.id
left join public.slabs s on s.card_id = c.id and s.status = 'active'
group by 
  c.id,
  c.name,
  c.set_name,
  c.card_number,
  c.slug,
  c.category_id,
  cat.name,
  c.rarity,
  c.image_url,
  c.year;

-- Grant access to the view
grant select on public.marketplace_cards to anon, authenticated;

-- Add comment
comment on view public.marketplace_cards is 'Aggregated view of cards with marketplace statistics (listings, prices, sellers). Includes slug for URL-friendly routing.';

