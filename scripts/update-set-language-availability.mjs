#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const LANGS = [
  { code: 'en', name: 'english' },
  { code: 'fr', name: 'french' },
  { code: 'de', name: 'german' },
  { code: 'es', name: 'spanish' },
  { code: 'it', name: 'italian' },
  { code: 'pt', name: 'portuguese' },
  { code: 'nl', name: 'dutch' },
  { code: 'ja', name: 'japanese' },
  { code: 'zh', name: 'chinese' },
  { code: 'ko', name: 'korean' },
  { code: 'id', name: 'indonesian' },
  { code: 'pl', name: 'polish' },
];

async function hasSet(langCode, setId) {
  const url = `https://api.tcgdex.net/v2/${langCode}/sets/${setId}`;
  try {
    const r = await fetch(url);
    return r.ok;
  } catch {
    return false;
  }
}

async function ensureTable() {
  // Create table if not exists
  const ddl = `
    create table if not exists public.set_language_availability (
      set_id text not null,
      language text not null,
      primary key (set_id, language)
    );
  `;
  // Run via RPC: execute arbitrary SQL is not allowed; fallback: try insert-select to detect table existence
  // We'll assume table exists or was created by migration; if not, log instruction:
  try {
    await supabase.from('set_language_availability').select('set_id').limit(1);
  } catch (e) {
    console.log('If table set_language_availability does not exist, create it with:\n', ddl);
  }
}

async function main() {
  const setId = process.argv[2] || 'base1';
  await ensureTable();
  const available = [];
  for (const { code, name } of LANGS) {
    const ok = await hasSet(code, setId);
    if (ok) available.push({ code, name });
  }
  console.log('Available languages for', setId, ':', available.map(a => a.name).join(', ') || '(none)');
  // Upsert rows
  for (const { name } of available) {
    await supabase.from('set_language_availability').upsert({ set_id: setId, language: name }, { onConflict: 'set_id,language' });
  }
  console.log('Upserted', available.length, 'rows to set_language_availability.');
}

main().catch(e => { console.error(e); process.exit(1); });


