-- Wallet accounts - one per user
create table if not exists public.wallet_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_cents bigint not null default 0,
  currency text not null default 'USD',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Wallet transactions - immutable ledger
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('deposit','charge','refund','adjustment')),
  amount_cents bigint not null, -- positive for credit to user, negative for debit
  currency text not null default 'USD',
  reference_id text, -- optional external reference (order id, stripe id)
  metadata jsonb,
  created_at timestamp with time zone not null default now()
);

-- Maintain updated_at
create or replace function public.set_wallet_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_wallet_updated_at on public.wallet_accounts;
create trigger trg_wallet_updated_at
before update on public.wallet_accounts
for each row execute function public.set_wallet_updated_at();

-- Helper function: apply transaction and update balance atomically
create or replace function public.wallet_apply_tx(p_user_id uuid, p_type text, p_amount_cents bigint, p_currency text default 'USD', p_reference_id text default null, p_metadata jsonb default '{}'::jsonb)
returns public.wallet_transactions
language plpgsql
as $$
declare
  tx public.wallet_transactions;
begin
  if p_amount_cents = 0 then
    raise exception 'Amount must be non-zero';
  end if;

  -- Ensure account exists
  insert into public.wallet_accounts(user_id, balance_cents, currency)
  values (p_user_id, 0, coalesce(p_currency, 'USD'))
  on conflict (user_id) do nothing;

  -- Insert transaction
  insert into public.wallet_transactions(user_id, type, amount_cents, currency, reference_id, metadata)
  values (p_user_id, p_type, p_amount_cents, coalesce(p_currency, 'USD'), p_reference_id, p_metadata)
  returning * into tx;

  -- Update balance
  update public.wallet_accounts
  set balance_cents = balance_cents + p_amount_cents,
      updated_at = now()
  where user_id = p_user_id;

  return tx;
end;
$$;

-- RLS
alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wallet_accounts' and policyname='wallet_accounts_select_own') then
    create policy wallet_accounts_select_own
      on public.wallet_accounts
      for select
      using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wallet_transactions' and policyname='wallet_tx_select_own') then
    create policy wallet_tx_select_own
      on public.wallet_transactions
      for select
      using (auth.uid() = user_id);
  end if;
end$$;


