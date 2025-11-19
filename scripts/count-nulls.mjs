#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const setName = process.argv[2] || 'Base Set';
const { data, error } = await supabase
  .from('cards')
  .select('id, name, card_number')
  .eq('set_name', setName);
if (error) throw error;
const all = data || [];
const nulls = all.filter(r => !r.card_number);
console.log('total:', all.length, 'null card_number:', nulls.length);
console.log('first nulls:', nulls.slice(0,10));


