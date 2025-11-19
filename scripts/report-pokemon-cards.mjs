#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from('cards')
    .select('set_name', { count: 'exact' })
    .eq('category_id', 'pokemon-tcg');
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  const counts = new Map();
  for (const row of data || []) {
    const key = row.set_name || '(null)';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const arr = Array.from(counts.entries()).sort((a,b) => b[1]-a[1]);
  const total = arr.reduce((s, [,n]) => s+n, 0);
  console.log('Total pokemon-tcg cards:', total);
  console.log('Top sets:');
  for (const [name, n] of arr.slice(0, 30)) {
    console.log(n.toString().padStart(6), '-', name);
  }
}

main().catch(e => { console.error(e); process.exit(1); });


