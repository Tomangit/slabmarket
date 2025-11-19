#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const categoryId = 'pokemon-tcg';
  console.log(`Setting category_id='${categoryId}' for all cards with NULL category_id...`);
  const { error, count } = await supabase
    .from('cards')
    .update({ category_id: categoryId })
    .is('category_id', null)
    .select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Update error:', error.message);
    process.exit(1);
  }
  console.log(`Updated ${count || 0} cards.`);
}

main().catch(e => { console.error(e); process.exit(1); });


