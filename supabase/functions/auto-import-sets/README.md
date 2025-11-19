# Auto Import Sets Edge Function

Edge Function for automatically detecting and importing new Pokemon TCG sets from the Pokemon TCG API.

## Features

- Automatically detects new sets in Pokemon TCG API
- Only imports sets that don't exist in the database (delta updates)
- Supports multiple languages (English, Japanese)
- Handles API rate limiting and timeouts

## Usage

### Manual Invocation

```bash
curl -X POST https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### Scheduled Execution (Supabase Cron)

Configure in Supabase Dashboard → Database → Cron Jobs:

```sql
-- Run weekly on Monday at 2 AM UTC
SELECT cron.schedule(
  'auto-import-sets',
  '0 2 * * 1', -- Weekly on Monday at 2 AM
  $$
  SELECT
    net.http_post(
      url:='https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/auto-import-sets?language=english',
      headers:='{"Content-Type": "application/json", "x-cron-secret": "YOUR_SECRET"}'::jsonb
    ) AS request_id;
  $$
);
```

### Query Parameters

- `language` (optional): Language to import sets for. Default: `english`. Options: `english`, `japanese`

## Response

```json
{
  "message": "Auto-import completed",
  "imported": 5,
  "skipped": 150,
  "errors": 0,
  "total": 155,
  "newSets": [
    { "id": "sv5", "name": "Temporal Forces" },
    { "id": "sv6", "name": "Twilight Masquerade" }
  ]
}
```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL (automatically set)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (automatically set)
- `POKEMON_TCG_API_KEY` - Optional: Pokemon TCG API key for higher rate limits
- `CRON_SECRET` - Secret for authenticating cron requests

## Next Steps

After importing sets, you may want to:
1. Import cards for new sets using `import-pokemon-cards.mjs` script
2. Or create another Edge Function to auto-import cards for new sets

