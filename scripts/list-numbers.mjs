#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const setName = process.argv[2] || 'Base Set';
const { data, error } = await supabase
  .from('cards')
  .select('card_number')
  .eq('set_name', setName);
if (error) throw error;
const nums = (data||[]).map(r => r.card_number).filter(Boolean);
console.log('count:', nums.length);
console.log('unique:', new Set(nums).size);
console.log('max:', Math.max(...nums.map(n => parseInt(String(n).replace(/[^0-9]/g,''),10)).filter(n=>!isNaN(n))));
console.log('sample:', Array.from(new Set(nums)).slice(0,30).join(', '));


