#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const langMap = {
  en: 'english',
  fr: 'french',
  de: 'german',
  es: 'spanish',
  it: 'italian',
  pt: 'portuguese',
  ja: 'japanese',
  pl: 'polish',
};

async function main() {
  const [lang = 'fr', setId = 'base1'] = process.argv.slice(2);
  const url = `https://api.tcgdex.net/v2/${lang}/sets/${setId}`;
  const r = await fetch(url);
  if (!r.ok) {
    console.error('TCGdex error', r.status);
    process.exit(1);
  }
  const json = await r.json();
  const payload = {
    id: setId,
    name: json.name || setId,
    era: json.serie?.name || 'Unknown',
    language: langMap[lang] || 'english',
    release_year: json.releaseDate ? Number(String(json.releaseDate).slice(0, 4)) : null,
  };
  const { error } = await supabase.from('sets').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('Upsert error:', error.message);
    process.exit(1);
  }
  console.log('Upserted set:', payload);
}

main().catch(e => { console.error(e); process.exit(1); });


