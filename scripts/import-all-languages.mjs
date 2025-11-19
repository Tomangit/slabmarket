#!/usr/bin/env node

/**
 * Import Pokemon sets and cards for ALL supported languages
 * Supports: english, polish, french, german, spanish, italian, portuguese
 * Excludes: japanese, korean, chinese
 * 
 * This script will:
 * 1. Import sets for all languages
 * 2. Import cards for all languages
 * 3. Use upsert to avoid duplicates
 */

import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import { setTimeout as sleep } from "node:timers/promises";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const LANGUAGES = [
  'english',
  'polish',
  'french',
  'german',
  'spanish',
  'italian',
  'portuguese',
];

// Import sets and cards modules dynamically
async function importSetsForLanguage(language) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  console.log(`\n[SETS] Importing sets for ${language}...`);
  
  try {
    const { stdout, stderr } = await execAsync(
      `node scripts/import-pokemon-sets.mjs --language ${language}`,
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      }
    );
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('Upserted')) console.error(stderr);
    
    return { success: true };
  } catch (error) {
    console.error(`Error importing sets for ${language}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function importCardsForLanguage(language) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  console.log(`\n[CARDS] Importing cards for ${language}...`);
  
  try {
    const { stdout, stderr } = await execAsync(
      `node scripts/import-pokemon-cards.mjs --language ${language}`,
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      }
    );
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('imported') && !stderr.includes('skipped')) console.error(stderr);
    
    return { success: true };
  } catch (error) {
    console.error(`Error importing cards for ${language}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Pokemon TCG Multi-Language Import Script                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\nLanguages to import: ${LANGUAGES.join(', ')}`);
  console.log(`Excluded languages: japanese, korean, chinese`);
  console.log(`\nThis will import sets and cards for all languages.`);
  console.log(`Using upsert - existing data will be updated, not duplicated.\n`);

  const startTime = Date.now();
  const results = {
    sets: {},
    cards: {},
  };

  // Step 1: Import sets for all languages
  console.log('\n' + '═'.repeat(60));
  console.log('STEP 1: IMPORTING SETS');
  console.log('═'.repeat(60));
  
  for (const language of LANGUAGES) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Processing: ${language.toUpperCase()}`);
    console.log('─'.repeat(60));
    
    const result = await importSetsForLanguage(language);
    results.sets[language] = result.success;
    
    if (!result.success) {
      console.error(`⚠ Failed to import sets for ${language}`);
    } else {
      console.log(`✓ Sets imported for ${language}`);
    }
    
    // Small delay between languages to avoid API rate limits
    if (language !== LANGUAGES[LANGUAGES.length - 1]) {
      console.log('Waiting 3 seconds before next language...');
      await sleep(3000);
    }
  }

  // Step 2: Import cards for all languages
  console.log('\n\n' + '═'.repeat(60));
  console.log('STEP 2: IMPORTING CARDS');
  console.log('═'.repeat(60));
  
  for (const language of LANGUAGES) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Processing: ${language.toUpperCase()}`);
    console.log('─'.repeat(60));
    
    const result = await importCardsForLanguage(language);
    results.cards[language] = result.success;
    
    if (!result.success) {
      console.error(`⚠ Failed to import cards for ${language}`);
    } else {
      console.log(`✓ Cards imported for ${language}`);
    }
    
    // Small delay between languages to avoid API rate limits
    if (language !== LANGUAGES[LANGUAGES.length - 1]) {
      console.log('Waiting 5 seconds before next language...');
      await sleep(5000);
    }
  }

  // Summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

  console.log('\n\n' + '═'.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('═'.repeat(60));
  
  console.log('\nSETS:');
  for (const [language, success] of Object.entries(results.sets)) {
    console.log(`  ${language.padEnd(15)}: ${success ? '✓ SUCCESS' : '✗ FAILED'}`);
  }
  
  console.log('\nCARDS:');
  for (const [language, success] of Object.entries(results.cards)) {
    console.log(`  ${language.padEnd(15)}: ${success ? '✓ SUCCESS' : '✗ FAILED'}`);
  }
  
  const setsSuccessCount = Object.values(results.sets).filter(Boolean).length;
  const cardsSuccessCount = Object.values(results.cards).filter(Boolean).length;
  const totalCount = LANGUAGES.length;
  
  console.log(`\nSets: ${setsSuccessCount}/${totalCount} languages imported successfully`);
  console.log(`Cards: ${cardsSuccessCount}/${totalCount} languages imported successfully`);
  console.log(`\nTotal time: ${duration} minutes`);
  
  if (setsSuccessCount < totalCount || cardsSuccessCount < totalCount) {
    console.log('\n⚠ Some languages failed to import. Check the logs above for details.');
    console.log('You can re-run this script - it will use upsert and skip existing data.');
    process.exit(1);
  } else {
    console.log('\n✓ All languages imported successfully!');
    console.log('\nYou can now check the marketplace to see cards in different languages.');
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});




