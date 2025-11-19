-- Initial database schema for Slab Market
-- This migration creates all base tables that other migrations depend on
-- MUST be executed FIRST before any other migrations

-- ============================================
-- PROFILES
-- ============================================
-- User profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- ============================================
-- CATEGORIES
-- ============================================
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  enabled boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on categories
alter table public.categories enable row level security;

-- ============================================
-- GRADING COMPANIES
-- ============================================
create table if not exists public.grading_companies (
  id text primary key,
  name text not null,
  code text not null unique,
  verification_enabled boolean default false,
  api_endpoint text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on grading_companies
alter table public.grading_companies enable row level security;

-- ============================================
-- CARDS
-- ============================================
create table if not exists public.cards (
  id text primary key,
  name text not null,
  set_name text not null,
  card_number text,
  category_id text references public.categories(id),
  rarity text,
  description text,
  image_url text,
  year integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on cards
alter table public.cards enable row level security;

-- ============================================
-- SLABS
-- ============================================
-- Main table for graded card listings
create table if not exists public.slabs (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.profiles(id) on delete set null,
  name text not null,
  cert_number text not null,
  grade text not null,
  grading_company_id text references public.grading_companies(id),
  cert_verified boolean default false,
  cert_verified_at timestamp with time zone,
  
  -- Card information
  card_id text references public.cards(id),
  set_name text,
  card_number text,
  category_id text references public.categories(id),
  year integer,
  
  -- Pricing
  price numeric(10, 2) not null,
  currency text not null default 'USD',
  listing_type text not null check (listing_type in ('fixed', 'auction')),
  auction_end_date timestamp with time zone,
  
  -- Condition details
  subgrade_centering numeric(3, 1),
  subgrade_edges numeric(3, 1),
  subgrade_corners numeric(3, 1),
  subgrade_surface numeric(3, 1),
  pop_report_total integer,
  pop_report_higher integer,
  
  -- Listing details
  description text,
  images text[],
  video_360_url text,
  status text not null default 'active' check (status in ('active', 'sold', 'pending', 'draft', 'cancelled')),
  
  -- Shipping
  shipping_available boolean default false,
  shipping_cost numeric(10, 2),
  shipping_estimated_days integer,
  shipping_insured boolean default false,
  shipping_temperature_controlled boolean default false,
  
  -- Protection
  escrow_protection boolean default false,
  buyer_protection boolean default false,
  
  -- Analytics
  views integer default 0,
  watchlist_count integer default 0,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on slabs
alter table public.slabs enable row level security;

-- ============================================
-- TRANSACTIONS
-- ============================================
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  slab_id uuid not null references public.slabs(id) on delete restrict,
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  price numeric(10, 2) not null,
  marketplace_fee numeric(10, 2) not null,
  payment_processing_fee numeric(10, 2) not null,
  seller_receives numeric(10, 2) not null,
  escrow_status text not null default 'pending' check (escrow_status in ('pending', 'held', 'released', 'refunded')),
  shipping_status text not null default 'pending' check (shipping_status in ('pending', 'shipped', 'delivered', 'returned')),
  tracking_number text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on transactions
alter table public.transactions enable row level security;

-- ============================================
-- REVIEWS
-- ============================================
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  reviewee_id uuid not null references public.profiles(id) on delete restrict,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(transaction_id, reviewer_id)
);

-- Enable RLS on reviews
alter table public.reviews enable row level security;

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

-- ============================================
-- WATCHLISTS
-- ============================================
create table if not exists public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  slab_id uuid not null references public.slabs(id) on delete cascade,
  price_alert numeric(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, slab_id)
);

-- Enable RLS on watchlists
alter table public.watchlists enable row level security;

-- ============================================
-- PRICE HISTORY
-- ============================================
create table if not exists public.price_history (
  id uuid default gen_random_uuid() primary key,
  slab_id uuid not null references public.slabs(id) on delete cascade,
  price numeric(10, 2) not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on price_history
alter table public.price_history enable row level security;

-- ============================================
-- CHECKOUT EVENTS
-- ============================================
create table if not exists public.checkout_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text not null,
  items jsonb,
  total numeric(10, 2) not null,
  payment_method text not null,
  shipping_address text not null,
  status text not null default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS on checkout_events
alter table public.checkout_events enable row level security;

-- ============================================
-- INDEXES
-- ============================================
-- Profiles indexes
create index if not exists idx_profiles_email on public.profiles(email);

-- Slabs indexes
create index if not exists idx_slabs_seller_id on public.slabs(seller_id);
create index if not exists idx_slabs_status on public.slabs(status);
create index if not exists idx_slabs_card_id on public.slabs(card_id);
create index if not exists idx_slabs_category_id on public.slabs(category_id);
create index if not exists idx_slabs_grading_company_id on public.slabs(grading_company_id);
create index if not exists idx_slabs_created_at on public.slabs(created_at desc);

-- Transactions indexes
create index if not exists idx_transactions_buyer_id on public.transactions(buyer_id);
create index if not exists idx_transactions_seller_id on public.transactions(seller_id);
create index if not exists idx_transactions_slab_id on public.transactions(slab_id);

-- Reviews indexes
create index if not exists idx_reviews_reviewee_id on public.reviews(reviewee_id);
create index if not exists idx_reviews_transaction_id on public.reviews(transaction_id);

-- Notifications indexes
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);

-- Watchlists indexes
create index if not exists idx_watchlists_user_id on public.watchlists(user_id);
create index if not exists idx_watchlists_slab_id on public.watchlists(slab_id);

-- Price history indexes
create index if not exists idx_price_history_slab_id on public.price_history(slab_id);
create index if not exists idx_price_history_recorded_at on public.price_history(recorded_at desc);

-- ============================================
-- FUNCTIONS
-- ============================================
-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles updated_at
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Trigger for cards updated_at
create trigger set_cards_updated_at
  before update on public.cards
  for each row
  execute function public.handle_updated_at();

-- Trigger for slabs updated_at
create trigger set_slabs_updated_at
  before update on public.slabs
  for each row
  execute function public.handle_updated_at();

-- Function to increment slab views
create or replace function public.increment_slab_views(slab_id_param uuid)
returns void as $$
begin
  update public.slabs
  set views = views + 1
  where id = slab_id_param;
end;
$$ language plpgsql security definer;

-- ============================================
-- COMMENTS
-- ============================================
comment on table public.profiles is 'User profiles extending Supabase auth.users';
comment on table public.slabs is 'Graded card listings (slabs)';
comment on table public.transactions is 'Purchase transactions';
comment on table public.reviews is 'User reviews for transactions';
comment on table public.notifications is 'User notifications';
comment on table public.watchlists is 'User watchlists for slabs';
comment on table public.price_history is 'Historical price data for slabs';

