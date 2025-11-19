#!/usr/bin/env node

/**
 * Import Pokemon cards for a set using TCGdex API (https://api.tcgdex.net)
 * POC: Base Set (EN). Can be extended to any set/language.
 */

import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const CARD_UUID_NAMESPACE = "3c7c5669-9c35-4d90-9f3f-9ad44e3d8adc";

function buildTcgdexAssetUrl(card, lang = 'en') {
  // Heurystycznie buduj URL do assets.tcgdex.net na podstawie card.id (np. swsh3-136)
  const id = String(card?.id || '');
  const m = id.match(/^([a-z0-9]+)-([0-9a-z]+)$/i);
  if (!m) return null;
  const setCode = m[1];
  const local = m[2];
  return `https://assets.tcgdex.net/${lang}/${setCode}/${local}/high.png`;
}

function extractLocalNumberFromCard(card) {
  // Porządkuj localId/number z TCGdex
  const num = card?.localId || card?.localID || card?.number || null;
  if (!num) return null;
  const m = String(num).match(/[0-9a-z]+/i);
  return m ? m[0] : null;
}

function normalizeImage(card, lang = 'en', tcgdexSetId) {
  // 1) Preferuj oficjalne obrazy images.pokemontcg.io dla EN, jeśli mamy tcgdexSetId i local number
  const local = extractLocalNumberFromCard(card);
  if (lang === 'en' && tcgdexSetId && local) {
    return `https://images.pokemontcg.io/${tcgdexSetId}/${local}_hires.png`;
  }
  // Preferuj card.images.{large, normal, small} lub card.image/url; napraw brak protokołu i rozszerzenia
  const raw = card?.images || card?.image || card?.imageUrl || null;
  let candidate = null;
  if (typeof raw === 'string') candidate = raw;
  if (!candidate && raw && typeof raw === 'object') {
    candidate = raw.large || raw.normal || raw.small || raw.high || raw.url || null;
  }
  if (candidate && typeof candidate === 'string') {
    let url = candidate;
    // Dodaj protokół jeśli zaczyna się od //
    if (url.startsWith('//')) url = `https:${url}`;
    // Zamień względne ścieżki na assets.tcgdex.net
    if (url.startsWith('/')) url = `https://assets.tcgdex.net${url}`;
    // Jeśli wskazuje na assets.tcgdex.net i kończy się na .../<num>.png → użyj wariantu high.png
    const m = url.match(/^https:\/\/assets\.tcgdex\.net\/.+\/([0-9a-z]+)\.(png|jpg|jpeg|webp)$/i);
    if (m) {
      const base = url.replace(/\.(png|jpg|jpeg|webp)$/i, '');
      url = `${base}/high.png`;
      return url;
    }
    // Jeśli brak rozszerzenia, dolej .png lub zbuduj high.png
    if (!/\.(png|jpg|jpeg|webp)$/i.test(url)) {
      // Spróbuj preferować high.png, jeśli wygląda jak .../<num>
      if (/\/[0-9a-z]+$/i.test(url)) {
        url = `${url}/high.png`;
      } else {
        url = `${url}.png`;
      }
    }
    return url;
  }
  // Fallback: zbuduj URL do assets.tcgdex.net
  return buildTcgdexAssetUrl(card, lang);
}

function mapCardPayload(card, setName, setYear, opts = {}) {
  const number =
    card?.localId ||
    card?.localID ||
    card?.number ||
    (typeof card?.id === "string" && card.id.includes("-") ? card.id.split("-")[1] : null);
  const uniqueKey = `${setName}::${card.name}::${number ?? ""}`;
  const uuid = uuidv5(uniqueKey, CARD_UUID_NAMESPACE);
  const baseSlug =
    `${(setName || "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}-` +
    `${(card.name || "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")}`;
  const slug = number ? `${baseSlug}-${number}` : baseSlug;
  // Build description candidates from various possible TCGdex fields
  const descCandidates = [];
  if (Array.isArray(card.description)) descCandidates.push(card.description.join(" "));
  if (typeof card.description === "string") descCandidates.push(card.description);
  if (card.description?.value) descCandidates.push(card.description.value);
  if (Array.isArray(card.text)) descCandidates.push(card.text.join(" "));
  if (typeof card.text === "string") descCandidates.push(card.text);
  if (Array.isArray(card.rules)) descCandidates.push(card.rules.join(" "));
  if (typeof card.rules === "string") descCandidates.push(card.rules);
  if (Array.isArray(card.effects)) descCandidates.push(card.effects.join(" "));
  if (typeof card.effect === "string") descCandidates.push(card.effect);
  if (card.flavorText) descCandidates.push(card.flavorText);
  // Illustrator fallback if no textual description available
  let illustrator = null;
  if (Array.isArray(card.illustrators) && card.illustrators.length > 0) {
    illustrator = card.illustrators.join(", ");
  } else if (card.illustrator) {
    illustrator = card.illustrator;
  } else if (card.artist) {
    illustrator = card.artist;
  }

  const description =
    descCandidates.find((s) => typeof s === "string" && s.trim().length > 0) ||
    (illustrator ? `Illustrator: ${illustrator}` : null);

  return {
    id: uuid,
    name: card.name,
    set_name: setName,
    slug: slug.replace(/--+/g, "-").replace(/^-+|-+$/g, ""),
    year: setYear ?? (card.releaseDate ? Number(String(card.releaseDate).slice(0, 4)) : null),
    card_number: number ?? null,
    rarity: card.rarity || card.rarityCode || null,
    image_url: normalizeImage(card, opts.lang || 'en', opts.tcgdexSetId),
    description,
    category_id: 'pokemon-tcg',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function getExistingKeys(setName) {
  const { data, error } = await supabase
    .from("cards")
    .select("id, name, set_name, card_number, image_url, description, rarity, year, category_id")
    .eq("set_name", setName);
  if (error) throw new Error(error.message);
  const byKey = new Map();
  (data || []).forEach((c) => {
    const key = `${c.set_name}::${c.name}::${c.card_number ?? ""}`;
    byKey.set(key, c);
  });
  return byKey;
}

async function upsertOrUpdateCards(mapped, setName) {
  const existingByKey = await getExistingKeys(setName);
  const toInsert = [];
  const toUpdate = [];

  for (const c of mapped) {
    const key = `${c.set_name}::${c.name}::${c.card_number ?? ""}`;
    const ex = existingByKey.get(key);
    if (!ex) {
      toInsert.push(c);
    } else {
      const patch = {};
      const needsImageExtFix = ex.image_url && typeof ex.image_url === 'string' && !/\.(png|jpg|jpeg|webp)$/i.test(ex.image_url);
      if ((!ex.image_url || needsImageExtFix) && c.image_url) patch.image_url = c.image_url;
      if (!ex.description && c.description) patch.description = c.description;
      if (!ex.rarity && c.rarity) patch.rarity = c.rarity;
      if (!ex.year && c.year) patch.year = c.year;
      if (!ex.category_id && c.category_id) patch.category_id = c.category_id;
      if (Object.keys(patch).length > 0) {
        patch.updated_at = new Date().toISOString();
        toUpdate.push({ id: ex.id, patch });
      }
    }
  }

  // Insert new
  if (toInsert.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const { error } = await supabase.from("cards").insert(chunk);
      if (error) throw new Error(`Insert error: ${error.message}`);
    }
  }
  // Update existing (targeted by id)
  for (const u of toUpdate) {
    const { error } = await supabase.from("cards").update(u.patch).eq("id", u.id);
    if (error) throw new Error(`Update error: ${error.message}`);
  }
  console.log(`Inserted ${toInsert.length}, updated ${toUpdate.length}`);
  return { inserted: toInsert.length, updated: toUpdate.length };
}

async function findSetIdOnTcgdex({ language = "en", setName = "Base Set" }) {
  const url = `https://api.tcgdex.net/v2/${language}/sets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TCGdex sets error: ${res.status}`);
  const sets = await res.json();
  // Try exact match first, then contains
  let found = sets.find(s => (s.name || "").toLowerCase() === setName.toLowerCase());
  if (!found) found = sets.find(s => (s.name || "").toLowerCase().includes(setName.toLowerCase()));
  return found;
}

function fetchWithTimeout(url, opts = {}, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

async function fetchCardsFromTcgdex({ language = "en", tcgdexSetId }) {
  // Try direct cards endpoint
  {
    const url = `https://api.tcgdex.net/v2/${language}/sets/${tcgdexSetId}/cards`;
    let res;
    try {
      res = await fetchWithTimeout(url, {}, 20000);
    } catch (_) {
      res = null;
    }
    if (res.ok) {
      const cards = await res.json();
      if (Array.isArray(cards)) return cards;
    }
  }
  // Fallback: fetch set meta, then fetch each card by id under /cards/<id>
  const setUrl = `https://api.tcgdex.net/v2/${language}/sets/${tcgdexSetId}`;
  let setRes;
  try {
    setRes = await fetchWithTimeout(setUrl, {}, 20000);
  } catch (_) {
    setRes = null;
  }
  if (!setRes || !setRes.ok) throw new Error(`TCGdex cards error: ${setRes ? setRes.status : 'timeout'}`);
  const setJson = await setRes.json();
  const cardIds = (setJson?.cards || setJson?.cardlist || []).filter(Boolean);
  // If set meta didn't include ids, return empty and let limited fallback run below
  const hasCardIds = Array.isArray(cardIds) && cardIds.length > 0;

  // Limited concurrency
  const limit = 6;
  const out = [];
  let index = 0;
  async function worker() {
    while (index < (cardIds?.length || 0)) {
      const my = index++;
      const cid = cardIds[my];
      const cardUrl = `https://api.tcgdex.net/v2/${language}/cards/${cid}`;
      try {
        const r = await fetchWithTimeout(cardUrl, {}, 20000);
        if (r.ok) {
          const cj = await r.json();
          out.push(cj);
        }
      } catch (_) {
        // skip failed
      }
    }
  }
  if (hasCardIds) {
    const workers = Array.from({ length: Math.min(limit, cardIds.length) }, () => worker());
    await Promise.all(workers);
    if (out.length > 0) {
      return out;
    }
    // Jeśli lista ID była, ale żadne pobranie nie zwróciło danych (np. 404/timeouty),
    // uruchom ograniczony fallback po wzorcach numeracji.
    // (poniżej ten sam mechanizm co dla braku ID w secie)
  }

  // Limited, last-resort fallback when set meta didn't provide card IDs
  const prefixes = ['AR', 'SH', 'TG', 'SV', 'GG', 'RC'];
  const guesses = [
    ...Array.from({ length: 150 }, (_, i) => `${tcgdexSetId}-${i + 1}`), // numeric 1..150
  ];
  for (const p of prefixes) {
    for (let i = 1; i <= 30; i++) {
      guesses.push(`${tcgdexSetId}-${p}${i}`);
    }
  }
  const outFallback = [];
  let gi = 0;
  async function gworker() {
    while (gi < guesses.length) {
      const my = gi++;
      const cid = guesses[my];
      const url = `https://api.tcgdex.net/v2/${language}/cards/${cid}`;
      try {
        const r = await fetchWithTimeout(url, {}, 10000);
        if (r.ok) {
          const cj = await r.json();
          outFallback.push(cj);
        }
      } catch (_) {}
    }
  }
  const w2 = Array.from({ length: 6 }, () => gworker());
  await Promise.all(w2);
  return outFallback;
}

async function main() {
  const args = process.argv.slice(2);
  const languageIdx = args.indexOf("--language");
  const language = languageIdx !== -1 ? args[languageIdx + 1] : "en";
  const setIdx = args.indexOf("--set");
  const setName = setIdx !== -1 ? args[setIdx + 1] : "Base Set";
  const setIdIdx = args.indexOf("--setId");
  const overrideSetId = setIdIdx !== -1 ? args[setIdIdx + 1] : null;

  console.log(`TCGdex import: language=${language}, set="${setName}"`);
  // Load year for set from DB if available
  let setYear = null;
  {
    const { data } = await supabase.from("sets").select("release_year").eq("name", setName).maybeSingle();
    setYear = data?.release_year ?? null;
  }

  const setInfo = overrideSetId
    ? await (async () => {
        const url = `https://api.tcgdex.net/v2/${language}/sets/${overrideSetId}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`TCGdex set error: ${r.status}`);
        return await r.json();
      })()
    : await findSetIdOnTcgdex({ language, setName });
  if (!setInfo) {
    console.error(`Set not found on TCGdex for name "${setName}"`);
    process.exit(1);
  }
  console.log(`Found on TCGdex: ${setInfo.name} (id=${setInfo.id})`);

  const cards = await fetchCardsFromTcgdex({ language, tcgdexSetId: setInfo.id });
  console.log(`Fetched ${cards.length} cards from TCGdex`);

  // Use localized set name from TCGdex for set_name consistency per language
  const localizedSetName = setInfo.name || setName;
  const mapped = cards.map(c => mapCardPayload(c, localizedSetName, setYear, { lang: language, tcgdexSetId: setInfo.id }));
  console.log(`Mapped ${mapped.length} cards. Applying changes...`);
  await upsertOrUpdateCards(mapped, setName);
  console.log("Done.");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});


