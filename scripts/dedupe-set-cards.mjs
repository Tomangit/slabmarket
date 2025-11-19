#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const setName = process.argv[2] || 'Base Set';
  console.log(`Deduping cards for "${setName}" by (name, card_number)...`);
  const { data, error } = await supabase
    .from('cards')
    .select('id, name, card_number, image_url, description, created_at')
    .eq('set_name', setName);
  if (error) throw error;
  const groups = new Map();
  for (const c of data || []) {
    const key = `${c.name}::${c.card_number ?? ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const toDelete = [];
  for (const [key, arr] of groups.entries()) {
    if (arr.length <= 1) continue;
    // pick best: has image, then has description, then oldest
    const best = arr.slice().sort((a,b) => {
      const ai = a.image_url ? 1 : 0; const bi = b.image_url ? 1 : 0;
      if (ai !== bi) return bi - ai;
      const ad = a.description ? 1 : 0; const bd = b.description ? 1 : 0;
      if (ad !== bd) return bd - ad;
      return new Date(a.created_at) - new Date(b.created_at);
    })[0];
    arr.forEach((c) => { if (c.id !== best.id) toDelete.push(c.id); });
  }
  if (toDelete.length === 0) {
    console.log('No duplicates found.');
    return;
  }
  const { error: delErr } = await supabase.from('cards').delete().in('id', toDelete);
  if (delErr) throw delErr;
  console.log(`Deleted ${toDelete.length} duplicates.`);
}

main().catch(e => { console.error(e); process.exit(1); });


