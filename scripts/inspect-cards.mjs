#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const setName = process.argv[2] || 'Base Set';
  const { data, error, count } = await supabase
    .from('cards')
    .select('id,name,card_number,image_url,description,slug', { count: 'exact' })
    .eq('set_name', setName)
    .order('card_number', { ascending: true })
    .limit(5);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  console.log('count:', count);
  console.log(JSON.stringify(data, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });


