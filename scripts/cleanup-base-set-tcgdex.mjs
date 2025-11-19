#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const setName = process.argv[2] || 'Base Set';
  console.log(`Cleaning duplicates for "${setName}"...`);
  // Usuń rekordy bez numeru, jeśli istnieje rekord z tym samym name + niepustym numerem
  const { data: withNumber, error: e1 } = await supabase
    .from('cards')
    .select('name, card_number')
    .eq('set_name', setName)
    .not('card_number', 'is', null);
  if (e1) throw e1;
  const namesWithNumber = new Set((withNumber || []).map(r => r.name));
  const { data: toDelete, error: e2 } = await supabase
    .from('cards')
    .select('id, name, card_number')
    .eq('set_name', setName)
    .is('card_number', null);
  if (e2) throw e2;
  const ids = (toDelete || []).filter(r => namesWithNumber.has(r.name)).map(r => r.id);
  if (ids.length === 0) {
    console.log('Nothing to delete.');
    return;
  }
  const { error: delErr } = await supabase.from('cards').delete().in('id', ids);
  if (delErr) throw delErr;
  console.log(`Deleted ${ids.length} duplicate records without card_number.`);
}

main().catch(err => { console.error(err); process.exit(1); });


