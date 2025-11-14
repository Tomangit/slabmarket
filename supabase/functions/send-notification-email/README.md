# Send Notification Email Edge Function

This Edge Function handles sending email notifications with templates for various events in the Slab Market platform.

## Features

- Email templates for different notification types
- HTML and plain text versions
- Responsive email design
- Support for multiple notification types

## Notification Types

1. **transaction_created** - Sent when a new transaction is created
2. **transaction_shipped** - Sent when an order is shipped with tracking info
3. **dispute_opened** - Sent when a dispute is opened
4. **price_alert** - Sent when a watchlist item reaches target price

## Usage

### Invoke the function

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-notification-email`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      type: "transaction_created",
      email: "user@example.com",
      data: {
        userName: "John Doe",
        itemName: "Pikachu VMAX PSA 10",
        price: 2500,
        transactionId: "transaction-id",
      },
    }),
  }
);
```

### Request Body

```json
{
  "type": "transaction_created | transaction_shipped | dispute_opened | price_alert",
  "email": "user@example.com",
  "data": {
    // Type-specific data
  }
}
```

## Email Service Integration

Currently, this function is a stub that logs emails. To enable actual email sending, integrate with one of these services:

### Option 1: Resend (Recommended)

```typescript
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
await resend.emails.send({
  from: "noreply@slabmarket.com",
  to: email,
  subject: template.subject,
  html: template.html,
  text: template.text,
});
```

### Option 2: SendGrid

```typescript
import sgMail from "npm:@sendgrid/mail@7.7.0";

sgMail.setApiKey(Deno.env.get("SENDGRID_API_KEY"));
await sgMail.send({
  to: email,
  from: "noreply@slabmarket.com",
  subject: template.subject,
  html: template.html,
  text: template.text,
});
```

### Option 3: Mailgun

```typescript
const formData = new FormData();
formData.append("from", "noreply@slabmarket.com");
formData.append("to", email);
formData.append("subject", template.subject);
formData.append("html", template.html);
formData.append("text", template.text);

await fetch(
  `https://api.mailgun.net/v3/${DOMAIN}/messages`,
  {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`api:${Deno.env.get("MAILGUN_API_KEY")}`)}`,
    },
    body: formData,
  }
);
```

## Environment Variables

Add these to your Supabase project secrets:

- `SITE_URL` - Your site URL (e.g., https://slabmarket.com)
- `RESEND_API_KEY` (or other email service API key)

## Deployment

```bash
supabase functions deploy send-notification-email
```

## Testing

You can test the function locally:

```bash
supabase functions serve send-notification-email
```

Then invoke it with:

```bash
curl -X POST http://localhost:54321/functions/v1/send-notification-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "price_alert",
    "email": "test@example.com",
    "data": {
      "userName": "Test User",
      "itemName": "Test Item",
      "targetPrice": 100,
      "currentPrice": 95,
      "slabId": "test-id"
    }
  }'
```

