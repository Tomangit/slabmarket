# Check Price Alerts Edge Function

This Edge Function checks watchlist items with price alerts and creates notifications when prices drop to or below the alert threshold.

## Purpose

Automatically monitor watchlist items with price alerts and notify users when their target prices are reached.

## Usage

### Manual Invocation

```bash
curl -X POST https://<your-project>.supabase.co/functions/v1/check-price-alerts \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json"
```

### Cron Job Setup

This function should be run periodically (e.g., every hour) using Supabase Cron Jobs or an external scheduler.

To set up a cron job in Supabase:

1. Go to Database → Cron Jobs
2. Create a new cron job:
   - Schedule: `0 * * * *` (every hour)
   - Command: `SELECT net.http_post(
     url := 'https://<your-project>.supabase.co/functions/v1/check-price-alerts',
     headers := '{"Authorization": "Bearer <service-role-key>", "Content-Type": "application/json"}'::jsonb
   );`

## How It Works

1. Fetches all watchlist items that have a `price_alert` set
2. For each item, checks if the current slab price is at or below the alert threshold
3. Creates a notification if:
   - Price condition is met
   - No unread notification already exists for this alert
4. Returns summary of notifications created

## Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations

## Response

```json
{
  "message": "Price alerts checked",
  "notificationsCreated": 5,
  "errors": []
}
```

