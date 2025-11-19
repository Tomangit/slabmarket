#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchCardFromTcgdex(lang, setId, localId) {
  const id = `${setId}-${localId}`;
  const url = `https://api.tcgdex.net/v2/${lang}/cards/${id}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

async function fetchDescriptionFromPokeTCG(setId, localId) {
  const id = `${setId}-${localId}`;
  const url = `https://api.pokemontcg.io/v2/cards/${id}`;
  const headers = { "User-Agent": "SlabMarket-Importer/1.0" };
  if (process.env.POKEMON_TCG_API_KEY) headers["X-Api-Key"] = process.env.POKEMON_TCG_API_KEY;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const json = await res.json();
    const c = json?.data;
    if (!c) return null;
    const items = [];
    if (Array.isArray(c.rules)) items.push(c.rules.join(" "));
    if (typeof c.flavorText === "string") items.push(c.flavorText);
    // Trainers often have 'rules' only
    return items.find((s) => typeof s === "string" && s.trim().length > 0) || null;
  } catch {
    return null;
  }
}

function buildDescription(tcgdexCard) {
  const c = tcgdexCard || {};
  const items = [];
  if (Array.isArray(c.description)) items.push(c.description.join(" "));
  if (typeof c.description === "string") items.push(c.description);
  if (c.description?.value) items.push(c.description.value);
  if (Array.isArray(c.text)) items.push(c.text.join(" "));
  if (typeof c.text === "string") items.push(c.text);
  if (Array.isArray(c.rules)) items.push(c.rules.join(" "));
  if (typeof c.rules === "string") items.push(c.rules);
  if (Array.isArray(c.effects)) items.push(c.effects.join(" "));
  if (typeof c.effect === "string") items.push(c.effect);
  if (c.flavorText) items.push(c.flavorText);
  return items.find((s) => typeof s === "string" && s.trim().length > 0) || null;
}

async function main() {
  const setName = process.argv[2] || 'Base Set';
  const lang = 'en';
  const setId = 'base1';

  const { data, error } = await supabase
    .from('cards')
    .select('id, name, card_number, description')
    .eq('set_name', setName);
  if (error) throw error;

  let updated = 0;
  for (const row of data || []) {
    if (row.description && row.description.trim()) continue;
    if (!row.card_number) continue;
    const tcg = await fetchCardFromTcgdex(lang, setId, row.card_number);
    const desc = buildDescription(tcg);
    let finalDesc = desc;
    if (!finalDesc) {
      // Fallback to PokemonTCG API for description only
      finalDesc = await fetchDescriptionFromPokeTCG(setId, row.card_number);
    }
    if (finalDesc) {
      const { error: upErr } = await supabase
        .from('cards')
        .update({ description: finalDesc, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (upErr) throw upErr;
      updated++;
    }
  }
  console.log(`Updated descriptions for ${updated} cards in "${setName}".`);
}

main().catch(e => { console.error(e); process.exit(1); });


