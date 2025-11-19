/**
 * Script to check if the slug trigger exists in the database
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkSlugTrigger() {
  console.log("Checking if slug trigger exists...\n");

  // Check if trigger function exists
  const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN ('set_card_slug', 'generate_card_slug')
      ORDER BY routine_name;
    `
  });

  // Check if trigger exists
  const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name = 'cards_set_slug_trigger'
        AND event_object_table = 'cards';
    `
  });

  // Try direct SQL query instead
  const { data: triggerCheck, error: triggerCheckError } = await supabase
    .from('information_schema.triggers')
    .select('trigger_name')
    .eq('trigger_name', 'cards_set_slug_trigger')
    .limit(1);

  console.log("Checking via SQL query...");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({
      sql: `
        SELECT 
          EXISTS(
            SELECT 1 
            FROM pg_trigger 
            WHERE tgname = 'cards_set_slug_trigger'
          ) as trigger_exists,
          EXISTS(
            SELECT 1 
            FROM pg_proc 
            WHERE proname = 'set_card_slug'
          ) as function_exists;
      `
    })
  });

  if (response.ok) {
    const result = await response.json();
    console.log("\n" + "=".repeat(60));
    console.log("Trigger Status:");
    console.log(`  Trigger 'cards_set_slug_trigger': ${result.trigger_exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
    console.log(`  Function 'set_card_slug': ${result.function_exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
    console.log("=".repeat(60));
    
    if (!result.trigger_exists || !result.function_exists) {
      console.log("\n⚠ Migracja triggera NIE została uruchomiona!");
      console.log("Uruchom migrację: supabase/migrations/20250121_add_slug_trigger_to_cards.sql");
      console.log("w Supabase SQL Editor.");
    } else {
      console.log("\n✓ Trigger działa! Slugi będą dodawane automatycznie dla nowych kart.");
    }
  } else {
    console.error("Error checking trigger:", await response.text());
  }
}

checkSlugTrigger().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

