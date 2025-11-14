# Supabase Configuration

This directory contains Supabase migrations and Edge Functions for the Slab Market project.

## Structure

```
supabase/
├── migrations/          # Database migrations (SQL)
├── functions/          # Edge Functions (Deno)
│   └── verify-certificate/  # Certificate verification function
└── config.toml         # Supabase CLI configuration
```

## Edge Functions

### verify-certificate

Edge Function for verifying grading certificates from PSA, BGS, CGC, SGC, and other grading companies.

**Status**: STUB implementation (simulates verification)

**Location**: `supabase/functions/verify-certificate/`

**Usage**: See `supabase/functions/verify-certificate/README.md`

## Migrations

All database migrations are in the `migrations/` directory:

- `20251113_create_sets_table.sql` - Creates sets table
- `20250114_add_slab_edition_fields.sql` - Adds edition fields to slabs table
- `20250114_add_rls_policies.sql` - Adds Row Level Security policies

## Deployment

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref xxsnsomathouvuhtshyw
   ```

### Deploy Migrations

```bash
# Deploy all migrations
supabase db push

# Or deploy specific migration
supabase migration up
```

### Deploy Edge Functions

```bash
# Deploy verify-certificate function
supabase functions deploy verify-certificate

# Deploy all functions
supabase functions deploy
```

### Local Development

```bash
# Start local Supabase (requires Docker)
supabase start

# Serve Edge Functions locally
supabase functions serve verify-certificate

# Stop local Supabase
supabase stop
```

## Environment Variables

Edge Functions have access to these environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

These are automatically set when deploying to Supabase Cloud.

