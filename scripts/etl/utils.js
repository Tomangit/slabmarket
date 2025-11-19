/**
 * ETL Utilities - Helper functions for data normalization and validation
 */

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Generate URL-friendly slug from text
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-friendly slug
 */
export function generateSlug(text) {
  if (!text) return "";
  
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Generate unique slug with collision detection
 * @param {string} baseText - Base text for slug
 * @param {string} setName - Set name for uniqueness
 * @param {string|null} cardNumber - Optional card number
 * @returns {string} Unique slug
 */
export function generateCardSlug(baseText, setName, cardNumber = null) {
  const baseSlug = generateSlug(baseText);
  const setSlug = generateSlug(setName);
  
  let slug = `${setSlug}-${baseSlug}`;
  
  if (cardNumber) {
    const numberSlug = generateSlug(cardNumber);
    slug = `${slug}-${numberSlug}`;
  }
  
  return slug;
}

/**
 * Validate card data against schema
 * @param {object} card - Card data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCard(card) {
  const errors = [];
  
  // Required fields
  if (!card.name || typeof card.name !== "string" || card.name.trim().length === 0) {
    errors.push("Name is required and must be a non-empty string");
  }
  
  if (!card.set_name || typeof card.set_name !== "string" || card.set_name.trim().length === 0) {
    errors.push("Set name is required and must be a non-empty string");
  }
  
  // Optional fields validation
  if (card.year !== null && card.year !== undefined) {
    if (typeof card.year !== "number" || card.year < 1900 || card.year > 2100) {
      errors.push("Year must be a number between 1900 and 2100");
    }
  }
  
  if (card.card_number !== null && card.card_number !== undefined) {
    if (typeof card.card_number !== "string" && typeof card.card_number !== "number") {
      errors.push("Card number must be a string or number");
    }
  }
  
  if (card.image_url !== null && card.image_url !== undefined) {
    if (typeof card.image_url !== "string") {
      errors.push("Image URL must be a string");
    } else {
      try {
        new URL(card.image_url);
      } catch {
        errors.push("Image URL must be a valid URL");
      }
    }
  }
  
  if (card.slug !== null && card.slug !== undefined) {
    if (typeof card.slug !== "string" || card.slug.length === 0) {
      errors.push("Slug must be a non-empty string");
    } else if (!/^[a-z0-9-]+$/.test(card.slug)) {
      errors.push("Slug must contain only lowercase letters, numbers, and hyphens");
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize card data
 * @param {object} rawCard - Raw card data from API
 * @param {object} set - Set information
 * @returns {object} Normalized card data
 */
export function normalizeCard(rawCard, set) {
  const cardNumber = rawCard.number?.toString() || null;
  const name = (rawCard.name || "").trim();
  const setName = (set.name || "").trim();
  
  // Generate slug
  const slug = generateCardSlug(name, setName, cardNumber);
  
  // Normalize year
  let year = null;
  if (set.release_year) {
    year = set.release_year;
  } else if (rawCard.releaseDate) {
    const yearMatch = rawCard.releaseDate.match(/^(\d{4})/);
    if (yearMatch) {
      year = parseInt(yearMatch[1], 10);
    }
  }
  
  // Normalize image URL - prefer large, fallback to small
  const imageUrl = rawCard.images?.large || rawCard.images?.small || null;
  
  // Normalize rarity
  const rarity = rawCard.rarity ? rawCard.rarity.trim() : null;
  
  // Normalize description
  const description = rawCard.flavorText ? rawCard.flavorText.trim() : null;
  
  return {
    name,
    set_name: setName,
    card_number: cardNumber,
    slug,
    year,
    rarity,
    description,
    image_url: imageUrl,
  };
}

/**
 * Download image from URL and upload to Supabase Storage
 * @param {string} imageUrl - Source image URL
 * @param {string} slug - Card slug for file naming
 * @param {object} supabaseClient - Supabase client with service role key
 * @returns {Promise<string|null>} Public URL of uploaded image or null if failed
 */
export async function uploadImageToStorage(imageUrl, slug, supabaseClient) {
  if (!imageUrl) return null;
  
  try {
    // Download image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`  ⚠ Failed to download image from ${imageUrl}: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine file extension from URL or Content-Type
    let extension = "jpg";
    const urlPath = new URL(imageUrl).pathname;
    const urlExtension = urlPath.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    if (urlExtension) {
      extension = urlExtension[1].toLowerCase();
    } else {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("png")) extension = "png";
      else if (contentType?.includes("webp")) extension = "webp";
      else if (contentType?.includes("gif")) extension = "gif";
    }
    
    // Generate unique filename
    const hash = crypto.createHash("md5").update(slug + imageUrl).digest("hex").substring(0, 8);
    const filename = `${slug}-${hash}.${extension}`;
    const filePath = `cards/${filename}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from("card-images")
      .upload(filePath, buffer, {
        contentType: response.headers.get("content-type") || `image/${extension}`,
        upsert: true, // Overwrite if exists
      });
    
    if (error) {
      console.warn(`  ⚠ Failed to upload image to storage: ${error.message}`);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from("card-images")
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.warn(`  ⚠ Error uploading image: ${error.message}`);
    return null;
  }
}

/**
 * Detect certificate format from card data
 * @param {object} card - Card data
 * @returns {{ gradingCompany: string|null, grade: string|null, certNumber: string|null }}
 */
export function detectCertificateFormat(card) {
  // This is a placeholder - in real implementation, you'd parse card data
  // or metadata to detect certificate information
  // For now, we'll just return null values
  
  // Example patterns to look for:
  // PSA format: PSA ####### (7 digits)
  // BGS format: BGS ####### (7 digits)
  // CGC format: CGC ####### (7 digits)
  
  const certNumber = card.cert_number || null;
  const grade = card.grade || null;
  
  let gradingCompany = null;
  
  if (certNumber) {
    if (/^PSA\s?\d+$/i.test(certNumber)) {
      gradingCompany = "PSA";
    } else if (/^BGS\s?\d+$/i.test(certNumber)) {
      gradingCompany = "BGS";
    } else if (/^CGC\s?\d+$/i.test(certNumber)) {
      gradingCompany = "CGC";
    }
  }
  
  return {
    gradingCompany,
    grade,
    certNumber,
  };
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1, where 1 is identical)
 */
export function calculateSimilarity(str1, str2) {
  // Handle null/undefined
  if (str1 == null || str2 == null) return 0;
  
  // Both empty strings are identical
  if (str1 === '' && str2 === '') return 1;
  
  if (str1 === str2) return 1;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (longer.length - distance) / longer.length;
}

/**
 * Levenshtein distance implementation
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Find potential duplicates using fuzzy matching
 * @param {object} card - Card to check for duplicates
 * @param {Array<object>} existingCards - Array of existing cards
 * @param {number} similarityThreshold - Minimum similarity score (0-1)
 * @returns {Array<{ card: object, similarity: number }>} Potential duplicates
 */
export function findPotentialDuplicates(card, existingCards, similarityThreshold = 0.85) {
  const potentialDuplicates = [];
  
  for (const existingCard of existingCards) {
    // Check if same set
    if (existingCard.set_name !== card.set_name) continue;
    
    // Calculate similarity for name
    const nameSimilarity = calculateSimilarity(
      (card.name || "").toLowerCase(),
      (existingCard.name || "").toLowerCase()
    );
    
    // Calculate similarity for card number if both have it
    let numberSimilarity = 1;
    if (card.card_number && existingCard.card_number) {
      numberSimilarity = calculateSimilarity(
        card.card_number.toString(),
        existingCard.card_number.toString()
      );
    }
    
    // Combined similarity (weighted)
    const combinedSimilarity = (nameSimilarity * 0.7) + (numberSimilarity * 0.3);
    
    if (combinedSimilarity >= similarityThreshold) {
      potentialDuplicates.push({
        card: existingCard,
        similarity: combinedSimilarity,
        nameSimilarity,
        numberSimilarity,
      });
    }
  }
  
  return potentialDuplicates.sort((a, b) => b.similarity - a.similarity);
}

