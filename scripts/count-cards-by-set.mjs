#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const setName = process.argv[2] || 'Base Set';
const { data, error, count } = await supabase
  .from('cards')
  .select('id, set_name, category_id', { count: 'exact' })
  .eq('set_name', setName);
if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log('count:', count);
console.log(data.slice(0, 5));


