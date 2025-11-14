# Process Auctions Edge Function

Edge Function for processing ending auctions (cron job). This function should be scheduled to run periodically (e.g., every minute) to check for auctions that have ended and update their status.

## Current Status: STUB

This is a stub implementation. In production, this would:
1. Check for auctions that have ended
2. Find the highest bid for each auction
3. Create transactions for winning bids
4. Mark auctions as "sold" or "expired"
5. Notify winners and sellers

## Usage

### Manual Invocation

```bash
curl -X POST https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/process-auctions \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### Scheduled Execution (Supabase Cron)

Configure in Supabase Dashboard → Database → Cron Jobs:

```sql
-- Run every minute
SELECT cron.schedule(
  'process-auctions',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
      url:='https://xxsnsomathouvuhtshyw.supabase.co/functions/v1/process-auctions',
      headers:='{"Content-Type": "application/json", "x-cron-secret": "YOUR_SECRET"}'::jsonb
    ) AS request_id;
  $$
);
```

## Response

```json
{
  "message": "Auctions processed successfully",
  "processed": 5,
  "results": [
    {
      "slab_id": "abc123",
      "status": "sold"
    },
    {
      "slab_id": "def456",
      "status": "expired"
    }
  ]
}
```

## Future Enhancements

1. Integrate with bids table to find winning bids
2. Create transactions automatically for sold auctions
3. Send notifications to winners and sellers
4. Handle reserve prices
5. Support automatic bid extensions (sniping protection)

