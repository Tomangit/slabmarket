# Update Price History Edge Function

Edge Function for updating price history table with current prices from active slabs. This function should be scheduled to run daily to track price changes over time.

## Current Status: STUB

This function:
1. Fetches all active slabs
2. Checks if price_history table exists
3. Creates or updates price entries for today's date
4. Skips if entry already exists for today

## Usage

### Manual Invocation

```bash
curl -X POST https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/update-price-history \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### Scheduled Execution (Supabase Cron)

Configure in Supabase Dashboard → Database → Cron Jobs:

```sql
-- Run daily at midnight UTC
SELECT cron.schedule(
  'update-price-history',
  '0 0 * * *', -- Daily at midnight
  $$
  SELECT
    net.http_post(
      url:='https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/update-price-history',
      headers:='{"Content-Type": "application/json", "x-cron-secret": "YOUR_SECRET"}'::jsonb
    ) AS request_id;
  $$
);
```

## Response

```json
{
  "message": "Price history updated successfully",
  "processed": 150,
  "skipped": 5,
  "total": 155
}
```

## Future Enhancements

1. Track price changes and calculate percentage changes
2. Generate price alerts for watchlist items
3. Create price indices for categories/sets
4. Export price data for analytics
5. Support multiple currencies

