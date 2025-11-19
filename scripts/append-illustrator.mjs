#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getIllustrator(lang, setId, localId) {
  const url = `https://api.tcgdex.net/v2/${lang}/cards/${setId}-${localId}`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  if (Array.isArray(j.illustrators) && j.illustrators.length > 0) return j.illustrators.join(", ");
  if (j.illustrator) return j.illustrator;
  if (j.artist) return j.artist;
  return null;
}

async function main() {
  const setName = 'Base Set';
  const setId = 'base1';
  const langs = ['en','fr','de'];
  const { data: cards, error } = await supabase
    .from('cards')
    .select('id, card_number, description, set_name')
    .in('set_name', [setName, 'Set de Base', 'Grundset']);
  if (error) throw error;
  let updated = 0;
  for (const c of cards || []) {
    const num = c.card_number;
    if (!num) continue;
    if (c.description && /Illustrator:\s*/i.test(c.description)) continue;
    let illustrator = null;
    for (const lang of langs) {
      illustrator = await getIllustrator(lang, setId, num);
      if (illustrator) break;
    }
    if (!illustrator) continue;
    const newDesc = `Illustrator: ${illustrator}\n${c.description || ''}`.trim();
    const { error: upErr } = await supabase
      .from('cards')
      .update({ description: newDesc, updated_at: new Date().toISOString() })
      .eq('id', c.id);
    if (upErr) throw upErr;
    updated++;
  }
  console.log('Updated illustrator for', updated, 'cards.');
}

main().catch(e => { console.error(e); process.exit(1); });


