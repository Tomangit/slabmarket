#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const pattern = process.argv[2] || 'Base Set%';
const { data, error } = await supabase
  .from('sets')
  .select('id, name, language, release_year')
  .ilike('name', pattern)
  .order('language')
  .order('name');
if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(JSON.stringify(data, null, 2));


