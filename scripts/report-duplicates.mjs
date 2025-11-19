#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const setName = process.argv[2] || 'Base Set';
  const { data, error } = await supabase
    .from('cards')
    .select('id,name,card_number,set_name,slug')
    .eq('set_name', setName);
  if (error) throw error;
  const map = new Map();
  for (const c of data || []) {
    const key = `${c.name}::${c.card_number ?? ""}`;
    const arr = map.get(key) || [];
    arr.push(c);
    map.set(key, arr);
  }
  let dupCount = 0;
  for (const [key, arr] of map.entries()) {
    if (arr.length > 1) {
      dupCount += arr.length - 1;
      console.log('DUP', key, '→', arr.length, 'ids=', arr.map(a => a.id).join(','));
    }
  }
  console.log('Total records:', (data||[]).length, 'Expected unique keys:', map.size, 'Extra:', (data||[]).length - map.size, 'DupCount:', dupCount);
}
main().catch(e => { console.error(e); process.exit(1); });


