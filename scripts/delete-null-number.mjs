#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const setName = process.argv[2] || 'Base Set';
const { data, error } = await supabase
  .from('cards')
  .select('id')
  .eq('set_name', setName)
  .is('card_number', null);
if (error) {
  console.error(error.message);
  process.exit(1);
}
const ids = (data||[]).map(r => r.id);
if (ids.length === 0) {
  console.log('No null-number cards to delete.');
  process.exit(0);
}
const { error: delErr } = await supabase.from('cards').delete().in('id', ids);
if (delErr) {
  console.error(delErr.message);
  process.exit(1);
}
console.log(`Deleted ${ids.length} cards with null card_number from "${setName}".`);


