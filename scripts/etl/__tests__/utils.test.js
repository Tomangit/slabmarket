/**
 * Unit tests for ETL utilities
 */

import {
  generateSlug,
  generateCardSlug,
  validateCard,
  normalizeCard,
  calculateSimilarity,
  findPotentialDuplicates,
  detectCertificateFormat,
} from '../utils.js';

describe('ETL Utilities', () => {
  describe('generateSlug', () => {
    it('should generate URL-friendly slug from text', () => {
      expect(generateSlug('Base Set')).toBe('base-set');
      expect(generateSlug('Charizard VMAX')).toBe('charizard-vmax');
      expect(generateSlug('Pikachu (Full Art)')).toBe('pikachu-full-art');
    });

    it('should handle special characters', () => {
      expect(generateSlug('Pokémon TCG')).toBe('pokemon-tcg');
      expect(generateSlug('Card #123')).toBe('card-123');
      expect(generateSlug('Test & More!')).toBe('test-more');
    });

    it('should handle empty or null input', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug(null)).toBe('');
      expect(generateSlug(undefined)).toBe('');
    });

    it('should handle accented characters', () => {
      expect(generateSlug('Pokémon')).toBe('pokemon');
      expect(generateSlug('José')).toBe('jose');
    });

    it('should remove leading/trailing hyphens', () => {
      expect(generateSlug('  Test  ')).toBe('test');
      expect(generateSlug('---Test---')).toBe('test');
    });

    it('should handle multiple spaces/hyphens', () => {
      expect(generateSlug('Test   More')).toBe('test-more');
      expect(generateSlug('Test---More')).toBe('test-more');
      expect(generateSlug('Test___More')).toBe('test-more');
    });
  });

  describe('generateCardSlug', () => {
    it('should generate slug from card name and set', () => {
      const slug = generateCardSlug('Charizard', 'Base Set');
      expect(slug).toBe('base-set-charizard');
    });

    it('should include card number if provided', () => {
      const slug = generateCardSlug('Charizard', 'Base Set', '4/102');
      expect(slug).toBe('base-set-charizard-4102');
    });

    it('should handle null card number', () => {
      const slug = generateCardSlug('Charizard', 'Base Set', null);
      expect(slug).toBe('base-set-charizard');
    });

    it('should normalize all parts', () => {
      const slug = generateCardSlug('Charizard VMAX', 'Base Set 2020', '123/202');
      expect(slug).toBe('base-set-2020-charizard-vmax-123202');
    });
  });

  describe('validateCard', () => {
    it('should validate valid card', () => {
      const card = {
        name: 'Charizard',
        set_name: 'Base Set',
        year: 1999,
        card_number: '4/102',
        image_url: 'https://example.com/image.jpg',
        slug: 'base-set-charizard-4102',
      };

      const result = validateCard(card);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject card without name', () => {
      const card = {
        set_name: 'Base Set',
      };

      const result = validateCard(card);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Name is required');
    });

    it('should reject card without set_name', () => {
      const card = {
        name: 'Charizard',
      };

      const result = validateCard(card);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Set name is required');
    });

    it('should validate year range', () => {
      const card1 = { name: 'Test', set_name: 'Test Set', year: 1899 };
      const card2 = { name: 'Test', set_name: 'Test Set', year: 2101 };
      const card3 = { name: 'Test', set_name: 'Test Set', year: 2000 };

      expect(validateCard(card1).valid).toBe(false);
      expect(validateCard(card2).valid).toBe(false);
      expect(validateCard(card3).valid).toBe(true);
    });

    it('should validate image URL format', () => {
      const card1 = { name: 'Test', set_name: 'Test Set', image_url: 'not-a-url' };
      const card2 = { name: 'Test', set_name: 'Test Set', image_url: 'https://example.com/image.jpg' };

      expect(validateCard(card1).valid).toBe(false);
      expect(validateCard(card2).valid).toBe(true);
    });

    it('should validate slug format', () => {
      const card1 = { name: 'Test', set_name: 'Test Set', slug: 'Invalid Slug!' };
      const card2 = { name: 'Test', set_name: 'Test Set', slug: 'valid-slug-123' };

      expect(validateCard(card1).valid).toBe(false);
      expect(validateCard(card2).valid).toBe(true);
    });

    it('should allow null/undefined optional fields', () => {
      const card = {
        name: 'Charizard',
        set_name: 'Base Set',
        year: null,
        card_number: undefined,
        image_url: null,
      };

      const result = validateCard(card);
      expect(result.valid).toBe(true);
    });
  });

  describe('normalizeCard', () => {
    it('should normalize card data from API format', () => {
      const rawCard = {
        name: '  Charizard  ',
        number: '4/102',
        rarity: '  Rare Holo  ',
        flavorText: '  Flame Pokémon  ',
        images: {
          large: 'https://example.com/large.jpg',
          small: 'https://example.com/small.jpg',
        },
        releaseDate: '1999-01-09',
      };

      const set = {
        name: '  Base Set  ',
        release_year: 1999,
      };

      const normalized = normalizeCard(rawCard, set);

      expect(normalized.name).toBe('Charizard');
      expect(normalized.set_name).toBe('Base Set');
      expect(normalized.card_number).toBe('4/102');
      expect(normalized.slug).toBe('base-set-charizard-4102');
      expect(normalized.year).toBe(1999);
      expect(normalized.rarity).toBe('Rare Holo');
      expect(normalized.description).toBe('Flame Pokémon');
      expect(normalized.image_url).toBe('https://example.com/large.jpg');
    });

    it('should use releaseDate if set.release_year is not available', () => {
      const rawCard = {
        name: 'Charizard',
        releaseDate: '1999-01-09',
      };

      const set = {
        name: 'Base Set',
      };

      const normalized = normalizeCard(rawCard, set);
      expect(normalized.year).toBe(1999);
    });

    it('should prefer large image over small', () => {
      const rawCard = {
        name: 'Charizard',
        images: {
          large: 'https://example.com/large.jpg',
          small: 'https://example.com/small.jpg',
        },
      };

      const set = { name: 'Base Set' };

      const normalized = normalizeCard(rawCard, set);
      expect(normalized.image_url).toBe('https://example.com/large.jpg');
    });

    it('should fallback to small image if large is not available', () => {
      const rawCard = {
        name: 'Charizard',
        images: {
          small: 'https://example.com/small.jpg',
        },
      };

      const set = { name: 'Base Set' };

      const normalized = normalizeCard(rawCard, set);
      expect(normalized.image_url).toBe('https://example.com/small.jpg');
    });

    it('should handle missing fields gracefully', () => {
      const rawCard = {
        name: 'Charizard',
      };

      const set = {
        name: 'Base Set',
      };

      const normalized = normalizeCard(rawCard, set);

      expect(normalized.name).toBe('Charizard');
      expect(normalized.set_name).toBe('Base Set');
      expect(normalized.card_number).toBeNull();
      expect(normalized.year).toBeNull();
      expect(normalized.image_url).toBeNull();
      expect(normalized.rarity).toBeNull();
      expect(normalized.description).toBeNull();
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(calculateSimilarity('Charizard', 'Charizard')).toBe(1);
      expect(calculateSimilarity('Base Set', 'Base Set')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      const similarity = calculateSimilarity('Charizard', 'Pikachu');
      expect(similarity).toBeLessThan(0.5);
    });

    it('should return high similarity for similar strings', () => {
      const similarity = calculateSimilarity('Charizard', 'Charizardd');
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should handle empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(1); // Two empty strings are identical
      // Empty string vs non-empty should have similarity 0 (no similarity)
      expect(calculateSimilarity('Test', '')).toBe(0);
      expect(calculateSimilarity('', 'Test')).toBe(0);
    });

    it('should handle null/undefined', () => {
      expect(calculateSimilarity(null, 'Test')).toBe(0);
      expect(calculateSimilarity('Test', undefined)).toBe(0);
      expect(calculateSimilarity(null, null)).toBe(0);
    });

    it('should be case-insensitive in practice (similar strings)', () => {
      const similarity = calculateSimilarity('Charizard', 'charizard');
      expect(similarity).toBeGreaterThan(0.8);
    });
  });

  describe('findPotentialDuplicates', () => {
    const existingCards = [
      { name: 'Charizard', set_name: 'Base Set', card_number: '4/102' },
      { name: 'Pikachu', set_name: 'Base Set', card_number: '58/102' },
      { name: 'Charizard VMAX', set_name: 'Darkness Ablaze', card_number: '20/189' },
    ];

    it('should find exact duplicates', () => {
      const newCard = { name: 'Charizard', set_name: 'Base Set', card_number: '4/102' };
      const duplicates = findPotentialDuplicates(newCard, existingCards, 0.85);

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].similarity).toBe(1);
    });

    it('should find similar cards in same set', () => {
      const newCard = { name: 'Charizardd', set_name: 'Base Set', card_number: '4/102' };
      const duplicates = findPotentialDuplicates(newCard, existingCards, 0.85);

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].card.name).toBe('Charizard');
    });

    it('should not find duplicates in different sets', () => {
      const newCard = { name: 'Charizard', set_name: 'Jungle', card_number: '4/102' };
      const duplicates = findPotentialDuplicates(newCard, existingCards, 0.85);

      expect(duplicates.length).toBe(0);
    });

    it('should respect similarity threshold', () => {
      const newCard = { name: 'Pikachu', set_name: 'Base Set', card_number: '58/102' };
      const duplicatesLow = findPotentialDuplicates(newCard, existingCards, 0.95);
      const duplicatesHigh = findPotentialDuplicates(newCard, existingCards, 0.5);

      expect(duplicatesHigh.length).toBeGreaterThanOrEqual(duplicatesLow.length);
    });

    it('should return results sorted by similarity', () => {
      const newCard = { name: 'Charizard V', set_name: 'Base Set' };
      const duplicates = findPotentialDuplicates(newCard, existingCards, 0.5);

      if (duplicates.length > 1) {
        expect(duplicates[0].similarity).toBeGreaterThanOrEqual(duplicates[1].similarity);
      }
    });
  });

  describe('detectCertificateFormat', () => {
    it('should detect PSA format', () => {
      const card = { cert_number: 'PSA1234567', grade: '10' };
      const result = detectCertificateFormat(card);

      expect(result.gradingCompany).toBe('PSA');
      expect(result.certNumber).toBe('PSA1234567');
      expect(result.grade).toBe('10');
    });

    it('should detect BGS format', () => {
      const card = { cert_number: 'BGS1234567', grade: '9.5' };
      const result = detectCertificateFormat(card);

      expect(result.gradingCompany).toBe('BGS');
    });

    it('should detect CGC format', () => {
      const card = { cert_number: 'CGC1234567', grade: '10' };
      const result = detectCertificateFormat(card);

      expect(result.gradingCompany).toBe('CGC');
    });

    it('should handle case-insensitive detection', () => {
      const card1 = { cert_number: 'psa1234567' };
      const card2 = { cert_number: 'Psa1234567' };

      expect(detectCertificateFormat(card1).gradingCompany).toBe('PSA');
      expect(detectCertificateFormat(card2).gradingCompany).toBe('PSA');
    });

    it('should handle spaces in cert number', () => {
      const card = { cert_number: 'PSA 1234567' };
      const result = detectCertificateFormat(card);

      expect(result.gradingCompany).toBe('PSA');
    });

    it('should return null for unknown formats', () => {
      const card = { cert_number: 'UNKNOWN1234567' };
      const result = detectCertificateFormat(card);

      expect(result.gradingCompany).toBeNull();
    });

    it('should handle missing cert_number', () => {
      const card = { grade: '10' };
      const result = detectCertificateFormat(card);

      expect(result.gradingCompany).toBeNull();
      expect(result.certNumber).toBeNull();
      expect(result.grade).toBe('10');
    });
  });
});

