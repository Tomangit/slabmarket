#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { promisify } from 'node:util';
import { exec as _exec } from 'node:child_process';

const exec = promisify(_exec);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== TCGdex EN import orchestrator ===');
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const { data, error } = await supabase
    .from('sets')
    .select('id,name')
    .eq('language', 'english')
    .order('name');
  if (error) {
    console.error('Failed to load sets:', error.message);
    process.exit(1);
  }
  let sets = data || [];
  if (limit && Number.isFinite(limit)) {
    sets = sets.slice(0, Math.max(0, limit));
  }
  console.log(`Found ${sets.length} EN sets to process${limit ? ` (limited to ${limit})` : ''}.`);
  let processed = 0;
  for (const s of sets) {
    const setName = s.name;
    const setId = s.id;
    console.log(`\n→ Importing: ${setName} (${setId})`);
    try {
      const cmd = `node scripts/import-pokemon-cards-tcgdex.mjs --language en --set "${setName.replace(/"/g, '\\"')}" --setId "${setId}"`;
      const { stdout, stderr } = await exec(cmd, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 20 });
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      processed += 1;
    } catch (e) {
      console.error(`Import failed for ${setName}:`, e.message);
      // Continue with next sets
    }
  }
  console.log(`\nDone. Processed ${processed}/${sets.length} sets.`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});


