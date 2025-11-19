#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function extractLocalNumber(cardNumber) {
  if (!cardNumber) return null;
  const part = String(cardNumber).split('/')[0];
  const m = part.match(/\d+/);
  return m ? m[0] : null;
}

async function resolveTcgdexSetId(langCode, setName) {
  const url = `https://api.tcgdex.net/v2/${langCode}/sets`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const sets = await res.json();
  let found = sets.find((s) => (s.name || '').toLowerCase() === setName.toLowerCase());
  if (!found) found = sets.find((s) => (s.name || '').toLowerCase().includes(setName.toLowerCase()));
  return found ? found.id : null;
}

function buildAssetUrl(langCode, tcgdexSetId, localNumber) {
  if (!langCode || !tcgdexSetId || !localNumber) return null;
  if (langCode === 'en') {
    // Prefer official hires images for EN
    return `https://images.pokemontcg.io/${tcgdexSetId}/${localNumber}_hires.png`;
  }
  return `https://assets.tcgdex.net/${langCode}/${tcgdexSetId}/${localNumber}/high.png`;
}

function looksInvalidImage(url) {
  if (!url) return true;
  const s = String(url);
  if (s.startsWith('//') || s.startsWith('/')) return true;
  if (!/^https?:\/\//i.test(s)) return true;
  // Jeżeli to assets.tcgdex.net i kończy się na .../<num>.png → traktuj jako do poprawy na /high.png
  if (/^https:\/\/assets\.tcgdex\.net\//i.test(s) && /\/[0-9a-z]+\.(png|jpg|jpeg|webp)$/i.test(s)) return true;
  return !/\.(png|jpg|jpeg|webp)$/i.test(s);
}

async function main() {
  console.log('=== Backfill Pokémon images from TCGdex assets ===');
  // Bierzemy tylko EN sety na start
  const { data: sets, error: setsErr } = await supabase
    .from('sets')
    .select('id,name,language')
    .eq('language', 'english');
  if (setsErr) {
    console.error('Sets load error:', setsErr.message);
    process.exit(1);
  }
  console.log(`Found ${sets.length} EN sets`);

  let totalUpdated = 0;
  for (const set of sets) {
    // Szukamy kart z brakującym/nieprawidłowym image_url
    const { data: cards, error: cardsErr } = await supabase
      .from('cards')
      .select('id, set_name, card_number, image_url, category_id')
      .eq('category_id', 'pokemon-tcg')
      .eq('set_name', set.name);
    if (cardsErr) {
      console.error('Cards load error:', cardsErr.message);
      continue;
    }
    const need = (cards || []).filter((c) => looksInvalidImage(c.image_url));
    if (need.length === 0) continue;

    // Ustal TCGdex set id jeden raz
    const tcgdexSetId = await resolveTcgdexSetId('en', set.name);
    if (!tcgdexSetId) {
      console.log(`Skip ${set.name}: cannot resolve TCGdex set id`);
      continue;
    }

    const updates = [];
    for (const c of need) {
      const local = extractLocalNumber(c.card_number);
      const url = buildAssetUrl('en', tcgdexSetId, local);
      if (url) {
        updates.push({ id: c.id, image_url: url });
      }
    }
    if (updates.length === 0) continue;

    console.log(`Updating ${updates.length} cards in ${set.name}`);
    // Aktualizuj rekordy pojedynczo, aby uniknąć prób insertów
    for (const u of updates) {
      const { error } = await supabase.from('cards').update({ image_url: u.image_url }).eq('id', u.id);
      if (error) {
        console.error(`Update error for card ${u.id} in ${set.name}:`, error.message);
      } else {
        totalUpdated += 1;
      }
    }
  }
  console.log(`Done. Updated ${totalUpdated} cards.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


