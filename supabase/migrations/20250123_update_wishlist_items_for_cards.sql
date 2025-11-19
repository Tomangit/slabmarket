-- Update wishlist_items to support cards instead of slabs
-- This allows users to add cards to wishlists and get notified about new listings

-- First, add new columns to wishlist_items
alter table public.wishlist_items
  add column if not exists card_id text references public.cards(id) on delete cascade,
  add column if not exists min_grade text,
  add column if not exists notify_on_new_listing boolean default false,
  add column if not exists max_price numeric(10,2);

-- Make slab_id nullable (we'll support both cards and slabs)
alter table public.wishlist_items
  alter column slab_id drop not null;

-- Update unique constraint to support both card_id and slab_id
alter table public.wishlist_items
  drop constraint if exists wishlist_items_wishlist_id_slab_id_key;

-- Drop existing unique index if it exists
drop index if exists wishlist_items_wishlist_id_slab_id_key;

-- Create partial unique indexes (using WHERE clause)
-- For card_id: unique (wishlist_id, card_id) where card_id is not null
create unique index if not exists wishlist_items_wishlist_id_card_id_key 
  on public.wishlist_items(wishlist_id, card_id) 
  where card_id is not null;

-- For slab_id: unique (wishlist_id, slab_id) where slab_id is not null
create unique index if not exists wishlist_items_wishlist_id_slab_id_key 
  on public.wishlist_items(wishlist_id, slab_id) 
  where slab_id is not null;

-- Add check constraint to ensure at least one of card_id or slab_id is set
alter table public.wishlist_items
  add constraint wishlist_items_card_or_slab_check 
  check ((card_id is not null)::int + (slab_id is not null)::int = 1);

-- Add index for card_id
create index if not exists idx_wishlist_items_card_id on public.wishlist_items(card_id);

-- Add index for notifications
create index if not exists idx_wishlist_items_notify_card on public.wishlist_items(card_id, notify_on_new_listing) 
  where notify_on_new_listing = true and card_id is not null;

-- Update comment
comment on table public.wishlist_items is 'Items (cards or slabs) added to wishlists. Cards can have min_grade and notification settings.';
comment on column public.wishlist_items.card_id is 'Card ID for card-based wishlist items (for watching cards and getting notifications)';
comment on column public.wishlist_items.slab_id is 'Slab ID for slab-based wishlist items (for specific listings)';
comment on column public.wishlist_items.min_grade is 'Minimum grade required for notifications (e.g., "PSA 10", "BGS 9.5")';
comment on column public.wishlist_items.notify_on_new_listing is 'Whether to notify user when a new listing matching criteria appears';
comment on column public.wishlist_items.max_price is 'Maximum price for notifications';

