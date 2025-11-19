// Updates variant_capabilities for Base Set (base1):
// - Sets holo=true for cards whose rarity contains "Holo"
// - Ensures reverse_holo=false (Base Set has no reverse holos)
// - Leaves other flags unchanged
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  try {
    // Fetch Base Set cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('id, rarity, set_name, category_id')
      .eq('set_name', 'Base Set')
      .eq('category_id', 'pokemon-tcg');
    if (cardsError) throw cardsError;

    console.log(`Found ${cards?.length || 0} Base Set cards.`);

    let updated = 0;
    for (const card of cards || []) {
      const isHolo = typeof card.rarity === 'string' && /holo/i.test(card.rarity);
      // Base Set has no reverse holo; ensure false
      const reverseHolo = false;

      // Upsert into variant_capabilities
      const { error: upsertError } = await supabase
        .from('variant_capabilities')
        .upsert(
          {
            card_id: card.id,
            first_edition: true,
            shadowless: true,
            holo: isHolo,
            reverse_holo: reverseHolo
          },
          { onConflict: 'card_id' }
        );
      if (upsertError) {
        console.error(`Upsert failed for card ${card.id}:`, upsertError.message);
        continue;
      }
      updated++;
    }

    console.log(`Updated variant_capabilities for ${updated} cards (holo/reverse_holo).`);
  } catch (e) {
    console.error('Fatal error:', e);
    process.exit(1);
  }
}

main();

