#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function ptcgImage(number) {
  const n = String(number).replace(/[^0-9]/g, '');
  if (!n) return null;
  return `https://images.pokemontcg.io/base1/${n}_hires.png`;
}

async function main() {
  const setName = 'Base Set';
  const { data, error } = await supabase
    .from('cards')
    .select('id, card_number, image_url')
    .eq('set_name', setName);
  if (error) throw error;
  let updated = 0;
  for (const c of data || []) {
    const desired = ptcgImage(c.card_number);
    if (!desired) continue;
    const needsUpdate =
      !c.image_url ||
      c.image_url.includes('assets.tcgdex.net') ||
      !/\.(png|jpg|jpeg|webp)$/i.test(c.image_url);
    if (needsUpdate) {
      const { error: upErr } = await supabase
        .from('cards')
        .update({ image_url: desired, updated_at: new Date().toISOString() })
        .eq('id', c.id);
      if (upErr) throw upErr;
      updated++;
    }
  }
  console.log(`Updated images for ${updated} cards in "${setName}".`);
}

main().catch(e => { console.error(e); process.exit(1); });


