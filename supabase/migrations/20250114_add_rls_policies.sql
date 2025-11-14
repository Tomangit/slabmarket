-- Enable RLS on all tables (only if they exist)
-- Using DO block to safely check for table existence
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cards') then
    alter table public.cards enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cart_sessions') then
    alter table public.cart_sessions enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'categories') then
    alter table public.categories enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'checkout_events') then
    alter table public.checkout_events enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'grading_companies') then
    alter table public.grading_companies enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'notifications') then
    alter table public.notifications enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'price_history') then
    alter table public.price_history enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    alter table public.profiles enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'reviews') then
    alter table public.reviews enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'slabs') then
    alter table public.slabs enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'transactions') then
    alter table public.transactions enable row level security;
  end if;
  
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'watchlists') then
    alter table public.watchlists enable row level security;
  end if;
end $$;

-- ============================================
-- CARDS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cards') then
    drop policy if exists "Allow read access to cards" on public.cards;
    create policy "Allow read access to cards"
      on public.cards
      for select
      to anon, authenticated
      using (true);

    drop policy if exists "Allow service role to manage cards" on public.cards;
    create policy "Allow service role to manage cards"
      on public.cards
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- CATEGORIES
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'categories') then
    drop policy if exists "Allow read access to enabled categories" on public.categories;
    create policy "Allow read access to enabled categories"
      on public.categories
      for select
      to anon, authenticated
      using (enabled = true);

    drop policy if exists "Allow service role to manage categories" on public.categories;
    create policy "Allow service role to manage categories"
      on public.categories
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- GRADING_COMPANIES
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'grading_companies') then
    drop policy if exists "Allow read access to grading companies" on public.grading_companies;
    create policy "Allow read access to grading companies"
      on public.grading_companies
      for select
      to anon, authenticated
      using (true);

    drop policy if exists "Allow service role to manage grading companies" on public.grading_companies;
    create policy "Allow service role to manage grading companies"
      on public.grading_companies
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- PROFILES
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    drop policy if exists "Allow read access to profiles" on public.profiles;
    create policy "Allow read access to profiles"
      on public.profiles
      for select
      to anon, authenticated
      using (true);

    drop policy if exists "Users can update own profile" on public.profiles;
    create policy "Users can update own profile"
      on public.profiles
      for update
      to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);

    drop policy if exists "Users can insert own profile" on public.profiles;
    create policy "Users can insert own profile"
      on public.profiles
      for insert
      to authenticated
      with check (auth.uid() = id);

    drop policy if exists "Allow service role to manage profiles" on public.profiles;
    create policy "Allow service role to manage profiles"
      on public.profiles
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- SLABS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'slabs') then
    drop policy if exists "Allow read access to active slabs" on public.slabs;
    create policy "Allow read access to active slabs"
      on public.slabs
      for select
      to anon, authenticated
      using (status = 'active');

    drop policy if exists "Sellers can read own slabs" on public.slabs;
    create policy "Sellers can read own slabs"
      on public.slabs
      for select
      to authenticated
      using (seller_id = auth.uid());

    drop policy if exists "Sellers can insert own slabs" on public.slabs;
    create policy "Sellers can insert own slabs"
      on public.slabs
      for insert
      to authenticated
      with check (seller_id = auth.uid());

    drop policy if exists "Sellers can update own slabs" on public.slabs;
    create policy "Sellers can update own slabs"
      on public.slabs
      for update
      to authenticated
      using (seller_id = auth.uid())
      with check (seller_id = auth.uid());

    drop policy if exists "Sellers can delete own slabs" on public.slabs;
    create policy "Sellers can delete own slabs"
      on public.slabs
      for delete
      to authenticated
      using (seller_id = auth.uid());

    drop policy if exists "Allow service role to manage slabs" on public.slabs;
    create policy "Allow service role to manage slabs"
      on public.slabs
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- CART_SESSIONS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cart_sessions') then
    drop policy if exists "Users can access own cart" on public.cart_sessions;
    create policy "Users can access own cart"
      on public.cart_sessions
      for all
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());

    drop policy if exists "Allow service role to manage carts" on public.cart_sessions;
    create policy "Allow service role to manage carts"
      on public.cart_sessions
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- CHECKOUT_EVENTS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'checkout_events') then
    drop policy if exists "Users can read own checkout events" on public.checkout_events;
    create policy "Users can read own checkout events"
      on public.checkout_events
      for select
      to authenticated
      using (user_id = auth.uid());

    drop policy if exists "Allow insert checkout events" on public.checkout_events;
    create policy "Allow insert checkout events"
      on public.checkout_events
      for insert
      to anon, authenticated
      with check (user_id = auth.uid() OR user_id IS NULL);

    drop policy if exists "Allow service role to manage checkout events" on public.checkout_events;
    create policy "Allow service role to manage checkout events"
      on public.checkout_events
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- TRANSACTIONS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'transactions') then
    drop policy if exists "Buyers can read own transactions" on public.transactions;
    create policy "Buyers can read own transactions"
      on public.transactions
      for select
      to authenticated
      using (buyer_id = auth.uid());

    drop policy if exists "Sellers can read own transactions" on public.transactions;
    create policy "Sellers can read own transactions"
      on public.transactions
      for select
      to authenticated
      using (seller_id = auth.uid());

    drop policy if exists "Allow service role to manage transactions" on public.transactions;
    create policy "Allow service role to manage transactions"
      on public.transactions
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- WATCHLISTS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'watchlists') then
    drop policy if exists "Users can access own watchlist" on public.watchlists;
    create policy "Users can access own watchlist"
      on public.watchlists
      for all
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());

    drop policy if exists "Allow service role to manage watchlists" on public.watchlists;
    create policy "Allow service role to manage watchlists"
      on public.watchlists
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- NOTIFICATIONS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'notifications') then
    drop policy if exists "Users can read own notifications" on public.notifications;
    create policy "Users can read own notifications"
      on public.notifications
      for select
      to authenticated
      using (user_id = auth.uid());

    drop policy if exists "Users can update own notifications" on public.notifications;
    create policy "Users can update own notifications"
      on public.notifications
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());

    drop policy if exists "Allow service role to manage notifications" on public.notifications;
    create policy "Allow service role to manage notifications"
      on public.notifications
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- PRICE_HISTORY
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'price_history') then
    drop policy if exists "Allow read access to price history" on public.price_history;
    create policy "Allow read access to price history"
      on public.price_history
      for select
      to anon, authenticated
      using (true);

    drop policy if exists "Allow service role to manage price history" on public.price_history;
    create policy "Allow service role to manage price history"
      on public.price_history
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================
-- REVIEWS
-- ============================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'reviews') then
    drop policy if exists "Allow read access to reviews" on public.reviews;
    create policy "Allow read access to reviews"
      on public.reviews
      for select
      to anon, authenticated
      using (true);

    drop policy if exists "Users can insert reviews for own transactions" on public.reviews;
    create policy "Users can insert reviews for own transactions"
      on public.reviews
      for insert
      to authenticated
      with check (
        reviewer_id = auth.uid() AND
        EXISTS (
          SELECT 1 FROM public.transactions t
          WHERE t.id = transaction_id
          AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
        )
      );

    drop policy if exists "Users can update own reviews" on public.reviews;
    create policy "Users can update own reviews"
      on public.reviews
      for update
      to authenticated
      using (reviewer_id = auth.uid())
      with check (reviewer_id = auth.uid());

    drop policy if exists "Allow service role to manage reviews" on public.reviews;
    create policy "Allow service role to manage reviews"
      on public.reviews
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

