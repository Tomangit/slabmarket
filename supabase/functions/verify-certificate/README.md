# Verify Certificate Edge Function

Edge Function for verifying grading certificates from PSA, BGS, CGC, SGC, and other grading companies.

## Current Status: STUB

This is a stub implementation that simulates certificate verification. In production, this would integrate with actual grading company APIs:

- **PSA**: https://www.psacard.com/cert/
- **BGS**: https://www.beckett.com/grading/card-lookup
- **CGC**: https://www.cgccards.com/certlookup/
- **SGC**: https://sgcgrading.com/

## Usage

### Request

```typescript
POST /functions/v1/verify-certificate
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "grading_company": "PSA",
  "certificate_number": "82749361",
  "grade": "10" // optional
}
```

### Response

```typescript
{
  "verified": true,
  "valid": true,
  "data": {
    "certificate_number": "82749361",
    "grade": "10",
    "grading_date": "2024-01-15",
    "pop_report": {
      "grade": "10",
      "population": 42
    }
  }
}
```

## Error Responses

- `400`: Missing required fields
- `401`: Invalid or missing authentication
- `500`: Internal server error

## Deployment

```bash
# Deploy to Supabase
supabase functions deploy verify-certificate

# Test locally (requires Supabase CLI)
supabase functions serve verify-certificate
```

## Future Enhancements

1. Integrate with actual grading company APIs
2. Cache verification results to reduce API calls
3. Add rate limiting per user
4. Store verification history in database
5. Add webhook support for real-time updates

