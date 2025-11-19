# ETL Pipeline - Enhanced Pokemon Cards Import

## Overview

Enhanced ETL (Extract, Transform, Load) pipeline for importing Pokemon TCG cards with advanced features:

- **Data Normalization**: Automatic slug generation for URL-friendly identifiers
- **Data Validation**: JSON Schema-like validation to ensure data quality
- **Advanced Deduplication**: Fuzzy matching to detect potential duplicates
- **Image Management**: Optional upload to Supabase Storage
- **Certificate Detection**: Automatic detection of grading certificate formats (PSA/BGS/CGC)
- **Comprehensive Logging**: Detailed statistics and error reporting

## Files

- `utils.js` - ETL utility functions (normalization, validation, fuzzy matching, etc.)
- `import-pokemon-cards-enhanced.mjs` - Enhanced import script using ETL utilities

## Installation

No additional dependencies required beyond existing project setup.

## Usage

### Basic Import (with enhanced features)

```bash
node scripts/import-pokemon-cards-enhanced.mjs
```

### With Options

```bash
# Import specific set
node scripts/import-pokemon-cards-enhanced.mjs --set "Base Set"

# Import with language filter
node scripts/import-pokemon-cards-enhanced.mjs --language english

# Import with limit
node scripts/import-pokemon-cards-enhanced.mjs --limit 10
```

### Environment Variables

Add to `.env`:

```env
# Enable image upload to Supabase Storage
UPLOAD_CARD_IMAGES=true

# Enable/disable fuzzy matching (default: enabled)
FUZZY_MATCHING=true

# Similarity threshold for fuzzy matching (0-1, default: 0.85)
SIMILARITY_THRESHOLD=0.85
```

## Features

### 1. Data Normalization

**Slug Generation**: Automatically generates URL-friendly slugs from card names:
- `generateSlug(text)` - Basic slug generation
- `generateCardSlug(name, setName, cardNumber)` - Card-specific slug with uniqueness

Example:
```javascript
generateCardSlug("Charizard", "Base Set", "4") 
// → "base-set-charizard-4"
```

### 2. Data Validation

**Schema Validation**: Validates card data against rules:
- Required fields: `name`, `set_name`
- Optional fields: `year`, `card_number`, `image_url`, `slug`
- Type checking and format validation

Example:
```javascript
const validation = validateCard(card);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### 3. Fuzzy Matching

**Duplicate Detection**: Uses Levenshtein distance to find similar cards:
- Calculates similarity score (0-1)
- Configurable threshold (default: 0.85)
- Finds potential duplicates before insertion

Example:
```javascript
const duplicates = findPotentialDuplicates(card, existingCards, 0.85);
```

### 4. Image Upload

**Storage Integration**: Optionally uploads images to Supabase Storage:
- Downloads from Pokemon TCG API
- Uploads to `card-images` bucket
- Generates unique filenames
- Returns public URL

Requires:
- `card-images` bucket in Supabase Storage
- `UPLOAD_CARD_IMAGES=true` environment variable

### 5. Certificate Detection

**Format Recognition**: Detects grading certificate formats:
- PSA: `PSA 1234567`
- BGS: `BGS 1234567`
- CGC: `CGC 1234567`

## Database Migration

Before using enhanced import, run migration to add `slug` column:

```bash
# Run migration via SQL Editor or CLI
supabase migration up 20250121_add_slug_to_cards
```

Or manually in SQL Editor:

```sql
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE INDEX IF NOT EXISTS idx_cards_slug ON public.cards(slug);
```

## Statistics

The enhanced script provides comprehensive statistics:

```
=== Import Statistics ===
Total cards processed: 1000
Inserted: 850
Skipped: 120
Validation errors: 10
Duplicate detections (fuzzy matching): 20
Images uploaded: 800
Image upload errors: 5
```

## Error Handling

- **Validation Errors**: Logged but don't stop import
- **Fuzzy Matching Warnings**: Logged for manual review
- **Image Upload Errors**: Logged but don't stop import
- **API Errors**: Partial data saved if available

## Performance

- Processes cards in chunks (500 per batch)
- Rate limiting: 1 second between API requests
- Timeout handling: 60 seconds per API request
- Efficient deduplication using Set lookups

## Comparison: Original vs Enhanced

| Feature | Original | Enhanced |
|---------|----------|----------|
| Slug generation | ❌ | ✅ |
| Data validation | ❌ | ✅ |
| Fuzzy matching | ❌ | ✅ |
| Image upload | ❌ | ✅ (optional) |
| Certificate detection | ❌ | ✅ |
| Statistics | Basic | Comprehensive |
| Error handling | Basic | Advanced |

## Troubleshooting

### Image Upload Fails

1. Check if `card-images` bucket exists in Supabase Storage
2. Verify bucket permissions (should be public or service role accessible)
3. Check network connectivity to Pokemon TCG API

### Fuzzy Matching Too Aggressive

Lower similarity threshold:
```env
SIMILARITY_THRESHOLD=0.90
```

### Too Many Validation Errors

Check card data from API:
```javascript
console.log(card); // Inspect raw card data
```

### Slug Collisions

Slugs are automatically made unique by appending hash if collision detected.

## Future Enhancements

- [ ] Parallel image uploads for faster processing
- [ ] Caching for duplicate detection
- [ ] Progress bars for long imports
- [ ] CSV export of validation errors
- [ ] Automatic retry for failed image uploads
- [ ] Integration with image optimization (resize, format conversion)

## Testing

See `__tests__/etl.test.ts` for unit tests (to be created).

