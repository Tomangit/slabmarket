#!/usr/bin/env node

/**
 * Import Pokemon sets and cards for multiple languages
 * Supports: english, polish, french, german, spanish, italian, portuguese
 * Excludes: japanese, korean, chinese
 */

import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const LANGUAGES = [
  'english',
  'polish',
  'french',
  'german',
  'spanish',
  'italian',
  'portuguese',
];

async function runCommand(command) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${command}`);
  console.log('='.repeat(60));
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });
    
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
    
    return { success: true, stdout, stderr };
  } catch (error) {
    console.error(`Error running command: ${error.message}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return { success: false, error: error.message };
  }
}

async function importLanguage(language) {
  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# Importing ${language.toUpperCase()} sets and cards`);
  console.log('#'.repeat(60));
  
  // Step 1: Import sets for this language
  console.log(`\n[1/2] Importing sets for ${language}...`);
  const setsResult = await runCommand(
    `node scripts/import-pokemon-sets.mjs --language ${language}`
  );
  
  if (!setsResult.success) {
    console.error(`Failed to import sets for ${language}. Skipping cards.`);
    return false;
  }
  
  // Step 2: Import cards for this language
  console.log(`\n[2/2] Importing cards for ${language}...`);
  const cardsResult = await runCommand(
    `node scripts/import-pokemon-cards.mjs --language ${language}`
  );
  
  if (!cardsResult.success) {
    console.error(`Failed to import cards for ${language}.`);
    return false;
  }
  
  console.log(`\n✓ Successfully imported ${language} sets and cards`);
  return true;
}

async function main() {
  console.log('Pokemon TCG Multi-Language Import Script');
  console.log('========================================');
  console.log(`Languages to import: ${LANGUAGES.join(', ')}`);
  console.log(`Excluded languages: japanese, korean, chinese`);
  
  const results = {};
  
  for (const language of LANGUAGES) {
    results[language] = await importLanguage(language);
    
    // Add a small delay between languages to avoid API rate limits
    if (language !== LANGUAGES[LANGUAGES.length - 1]) {
      console.log('\nWaiting 5 seconds before next language...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));
  
  for (const [language, success] of Object.entries(results)) {
    console.log(`${language.padEnd(15)}: ${success ? '✓ SUCCESS' : '✗ FAILED'}`);
  }
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\nTotal: ${successCount}/${totalCount} languages imported successfully`);
  
  if (successCount < totalCount) {
    console.log('\n⚠ Some languages failed to import. Check the logs above for details.');
    process.exit(1);
  } else {
    console.log('\n✓ All languages imported successfully!');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

