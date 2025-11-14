-- Performance optimization indexes for Slab Market
-- These indexes improve query performance for common operations

-- Note: pg_trgm extension for advanced text search is not enabled here
-- because it requires admin privileges in Supabase
-- To enable pg_trgm, go to Supabase Dashboard > Database > Extensions
-- and enable "pg_trgm" extension there
-- This migration will create a simple B-tree index instead, which works well for ILIKE searches

-- Indexes for slabs table (most queried table)
-- Use dynamic SQL to create indexes only if columns exist
do $$
begin
  -- Check if slabs table exists
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'slabs'
  ) then
    -- Check if status column exists
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'slabs' 
      and column_name = 'status'
    ) then
      -- Index for status and created_at (homepage, marketplace)
      execute 'create index if not exists idx_slabs_status_created_at 
        on public.slabs(status, created_at desc)
        where status = ''active''';

      -- Index for price filtering (marketplace filters)
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'price'
      ) then
        execute 'create index if not exists idx_slabs_status_price 
          on public.slabs(status, price)
          where status = ''active''';
      end if;

      -- Index for category filtering
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'category_id'
      ) then
        execute 'create index if not exists idx_slabs_category_status 
          on public.slabs(category_id, status)
          where status = ''active''';
      end if;

      -- Index for grading company filtering
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'grading_company_id'
      ) then
        execute 'create index if not exists idx_slabs_grading_company_status 
          on public.slabs(grading_company_id, status)
          where status = ''active''';
      end if;

      -- Index for grade filtering
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'grade'
      ) then
        execute 'create index if not exists idx_slabs_grade_status 
          on public.slabs(grade, status)
          where status = ''active''';
      end if;

      -- Index for listing_type (featured listings)
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'listing_type'
      ) and exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'created_at'
      ) then
        execute 'create index if not exists idx_slabs_listing_type_status 
          on public.slabs(listing_type, status, created_at desc)
          where status = ''active'' and listing_type = ''featured''';
      end if;

      -- Index for watchlist_count and views (hot deals)
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'watchlist_count'
      ) and exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'views'
      ) then
        execute 'create index if not exists idx_slabs_popularity 
          on public.slabs(status, watchlist_count desc, views desc)
          where status = ''active''';
      end if;

      -- Composite index for common filter combinations
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'category_id'
      ) and exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'grading_company_id'
      ) and exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'price'
      ) and exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'created_at'
      ) then
        execute 'create index if not exists idx_slabs_filters_composite 
          on public.slabs(status, category_id, grading_company_id, price, created_at desc)
          where status = ''active''';
      end if;

      -- Index for seller filtering (dashboard) - with status
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'seller_id'
      ) then
        execute 'create index if not exists idx_slabs_seller_status 
          on public.slabs(seller_id, status)';
      end if;
    else
      -- If status column doesn't exist, create indexes without it
      -- Index for seller filtering (dashboard) - without status
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'seller_id'
      ) then
        execute 'create index if not exists idx_slabs_seller 
          on public.slabs(seller_id)';
      end if;

      -- Index for created_at only
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'created_at'
      ) then
        execute 'create index if not exists idx_slabs_created_at 
          on public.slabs(created_at desc)';
      end if;

      -- Index for price only
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'slabs' 
        and column_name = 'price'
      ) then
        execute 'create index if not exists idx_slabs_price 
          on public.slabs(price)';
      end if;
    end if;
  end if;
end $$;

-- Indexes for marketplace_cards view
-- Note: These indexes are on the underlying tables that make up the view
-- Index on cards table for name search
do $$
begin
  -- Check if cards table exists
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'cards'
  ) then
    -- Check if name column exists
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'cards' 
      and column_name = 'name'
    ) then
      -- Create a B-tree index for name searches
      -- This works well for ILIKE queries (case-insensitive pattern matching)
      execute 'create index if not exists idx_cards_name_search 
        on public.cards(name)';
      
      -- Also create a lowercase index for better ILIKE performance
      execute 'create index if not exists idx_cards_name_lower 
        on public.cards(lower(name))';
    end if;
    
    -- Index on cards table for set_name filtering
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'cards' 
      and column_name = 'set_name'
    ) then
      execute 'create index if not exists idx_cards_set_name 
        on public.cards(set_name)';
    end if;
  end if;
end $$;

-- Index for transactions table (dashboard, transaction history)
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'transactions'
  ) then
    -- Index for buyer
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'buyer_id'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'created_at'
    ) then
      execute 'create index if not exists idx_transactions_buyer 
        on public.transactions(buyer_id, created_at desc)';
    end if;

    -- Index for seller
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'seller_id'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'created_at'
    ) then
      execute 'create index if not exists idx_transactions_seller 
        on public.transactions(seller_id, created_at desc)';
    end if;

    -- Index for escrow_status (transactions table uses escrow_status, not status)
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'escrow_status'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'created_at'
    ) then
      execute 'create index if not exists idx_transactions_escrow_status 
        on public.transactions(escrow_status, created_at desc)';
    end if;

    -- Index for shipping_status
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'shipping_status'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'created_at'
    ) then
      execute 'create index if not exists idx_transactions_shipping_status 
        on public.transactions(shipping_status, created_at desc)';
    end if;

    -- Index for slab
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'transactions' 
      and column_name = 'slab_id'
    ) then
      execute 'create index if not exists idx_transactions_slab 
        on public.transactions(slab_id)';
    end if;
  end if;
end $$;

-- Index for watchlists table (user dashboard)
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'watchlists'
  ) then
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'watchlists' 
      and column_name = 'user_id'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'watchlists' 
      and column_name = 'created_at'
    ) then
      execute 'create index if not exists idx_watchlists_user_created 
        on public.watchlists(user_id, created_at desc)';
    end if;

    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'watchlists' 
      and column_name = 'user_id'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'watchlists' 
      and column_name = 'slab_id'
    ) then
      execute 'create index if not exists idx_watchlists_user_slab 
        on public.watchlists(user_id, slab_id)';
    end if;
  end if;
end $$;

-- Index for notifications table (user notifications)
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'notifications'
  ) then
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'notifications' 
      and column_name = 'user_id'
    ) then
      -- Check if read_at and created_at exist
      if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'notifications' 
        and column_name = 'read_at'
      ) and exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'notifications' 
        and column_name = 'created_at'
      ) then
        execute 'create index if not exists idx_notifications_user_read 
          on public.notifications(user_id, read_at, created_at desc)';
      elsif exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
        and table_name = 'notifications' 
        and column_name = 'created_at'
      ) then
        execute 'create index if not exists idx_notifications_user_created 
          on public.notifications(user_id, created_at desc)';
      end if;
    end if;
  end if;
end $$;

-- Index for reviews table (transaction reviews)
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'reviews'
  ) then
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'reviews' 
      and column_name = 'transaction_id'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'reviews' 
      and column_name = 'created_at'
    ) then
      execute 'create index if not exists idx_reviews_transaction 
        on public.reviews(transaction_id, created_at desc)';
    end if;

    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'reviews' 
      and column_name = 'reviewer_id'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'reviews' 
      and column_name = 'created_at'
    ) then
      execute 'create index if not exists idx_reviews_reviewer 
        on public.reviews(reviewer_id, created_at desc)';
    end if;
  end if;
end $$;

-- Index for price_history table (price tracking)
do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'price_history'
  ) then
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'price_history' 
      and column_name = 'slab_id'
    ) and exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'price_history' 
      and column_name = 'recorded_at'
    ) then
      execute 'create index if not exists idx_price_history_slab_date 
        on public.price_history(slab_id, recorded_at desc)';
    end if;
  end if;
end $$;

-- Add comments for indexes (only if they exist)
-- Note: Comments are optional and can be added later if needed
-- They're included here for documentation purposes
