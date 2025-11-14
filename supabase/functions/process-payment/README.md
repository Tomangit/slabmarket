# Process Payment Edge Function

This Edge Function handles payment processing with escrow functionality. Currently implemented as a stub, ready for integration with Stripe Connect or Mangopay.

## Features

- Escrow account management for sellers
- Payment processing with funds held in escrow
- Transaction status updates
- Ready for Stripe Connect or Mangopay integration

## Usage

### Invoke the function

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/process-payment`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      transactionId: "transaction-id",
      amount: 2500.00,
      currency: "USD",
      buyerId: "buyer-user-id",
      sellerId: "seller-user-id",
      description: "Pikachu VMAX PSA 10",
    }),
  }
);
```

### Request Body

```json
{
  "transactionId": "string",
  "amount": 2500.00,
  "currency": "USD",
  "buyerId": "string",
  "sellerId": "string",
  "description": "optional description"
}
```

## Integration Options

### Option 1: Stripe Connect (Recommended)

Stripe Connect allows you to:
- Create connected accounts for sellers
- Hold funds in escrow
- Transfer funds to sellers after delivery confirmation
- Handle disputes and refunds

#### Setup Steps

1. Install Stripe SDK:
```bash
npm install stripe
```

2. Update the function:

```typescript
import Stripe from "npm:stripe@14.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

// Create seller account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: sellerEmail,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
});

// Create payment intent with destination
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100), // Convert to cents
  currency: currency.toLowerCase(),
  application_fee_amount: Math.round(marketplaceFee * 100),
  transfer_data: {
    destination: sellerAccount.accountId,
  },
  on_behalf_of: sellerAccount.accountId,
  metadata: {
    transaction_id: transactionId,
    buyer_id: buyerId,
    seller_id: sellerId,
  },
});

// Hold funds in escrow (use Stripe's capture later feature)
// Funds are held until you call paymentIntent.capture()
```

3. Environment Variables:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - For webhook verification

### Option 2: Mangopay

Mangopay provides marketplace payment solutions with escrow.

#### Setup Steps

1. Install Mangopay SDK:
```bash
npm install mangopay2-nodejs-sdk
```

2. Update the function:

```typescript
import { MangoPay } from "npm:mangopay2-nodejs-sdk@3.0.0";

const mangoPay = new MangoPay({
  clientId: Deno.env.get("MANGOPAY_CLIENT_ID")!,
  clientApiKey: Deno.env.get("MANGOPAY_API_KEY")!,
  baseURL: Deno.env.get("MANGOPAY_BASE_URL") || "https://api.sandbox.mangopay.com",
});

// Create seller wallet
const sellerWallet = await mangoPay.Wallets.create({
  Owners: [sellerId],
  Currency: currency,
  Description: `Wallet for seller ${sellerId}`,
});

// Create escrow transfer
const transfer = await mangoPay.Transfers.create({
  AuthorId: buyerId,
  DebitedFunds: {
    Amount: Math.round(amount * 100),
    Currency: currency,
  },
  Fees: {
    Amount: Math.round(marketplaceFee * 100),
    Currency: currency,
  },
  DebitedWalletID: buyerWalletId,
  CreditedWalletID: sellerWalletId,
  Tag: transactionId,
});
```

3. Environment Variables:
- `MANGOPAY_CLIENT_ID`
- `MANGOPAY_API_KEY`
- `MANGOPAY_BASE_URL` (sandbox or production)

## Escrow Workflow

1. **Payment Processing**: Buyer pays, funds held in escrow
2. **Shipping**: Seller ships item, updates tracking
3. **Delivery Confirmation**: Buyer confirms delivery
4. **Fund Release**: Funds released to seller (minus marketplace fees)
5. **Dispute Handling**: If dispute, funds held until resolution

## Database Schema Updates Needed

Add to `profiles` table:
```sql
ALTER TABLE profiles
  ADD COLUMN stripe_account_id TEXT,
  ADD COLUMN mangopay_user_id TEXT,
  ADD COLUMN escrow_enabled BOOLEAN DEFAULT true;
```

Add to `transactions` table:
```sql
ALTER TABLE transactions
  ADD COLUMN payment_intent_id TEXT,
  ADD COLUMN escrow_id TEXT,
  ADD COLUMN payment_method_id TEXT;
```

## Webhook Handling

Create a webhook handler for payment status updates:

```typescript
// supabase/functions/handle-payment-webhook/index.ts
serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get("STRIPE_WEBHOOK_SECRET")!
  );
  
  if (event.type === "payment_intent.succeeded") {
    // Update transaction status
  } else if (event.type === "payment_intent.payment_failed") {
    // Handle failed payment
  }
});
```

## Deployment

```bash
supabase functions deploy process-payment
```

## Testing

Test locally:
```bash
supabase functions serve process-payment
```

Then invoke:
```bash
curl -X POST http://localhost:54321/functions/v1/process-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "transactionId": "test-tx-id",
    "amount": 100.00,
    "currency": "USD",
    "buyerId": "buyer-id",
    "sellerId": "seller-id"
  }'
```

