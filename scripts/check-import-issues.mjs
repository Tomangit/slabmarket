import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("Analiza importu kart...\n");

// Sprawdź ile kart jest w bazie
const { count: totalCards } = await supabase
  .from("cards")
  .select("*", { count: "exact", head: true });

console.log(`✓ Karty w bazie: ${totalCards || 0}\n`);

// Sprawdź zestawy z kartami vs wszystkie zestawy
const { data: setsWithCards } = await supabase
  .from("cards")
  .select("set_name");

const uniqueSets = new Set((setsWithCards || []).map(c => c.set_name));

const { count: totalEnglishSets } = await supabase
  .from("sets")
  .select("*", { count: "exact", head: true })
  .eq("language", "english");

console.log(`Zestawy z kartami: ${uniqueSets.size} / ${totalEnglishSets || 0}`);
console.log(`Pozostało: ${(totalEnglishSets || 0) - uniqueSets.size} zestawów\n`);

// Sprawdź logi importu
const logFile = "import-progress.log";
if (fs.existsSync(logFile)) {
  const logContent = fs.readFileSync(logFile, "utf-8");
  const lines = logContent.split("\n");
  
  // Znajdź ostatnie błędy
  const errors = lines.filter(l => 
    l.includes("Failed to import") || 
    l.includes("Error:") || 
    l.includes("✗")
  ).slice(-10);
  
  // Znajdź ostatnie sukcesy
  const successes = lines.filter(l => 
    l.includes("Successfully imported")
  ).slice(-10);
  
  // Znajdź ostatnie "already exist"
  const alreadyExist = lines.filter(l => 
    l.includes("already exist")
  ).slice(-5);
  
  console.log("📊 Ostatnie sukcesy importu:");
  successes.forEach(line => {
    const match = line.match(/Successfully imported (\d+) cards for (.+)/);
    if (match) {
      console.log(`  ✓ ${match[2]}: ${match[1]} kart`);
    }
  });
  
  if (alreadyExist.length > 0) {
    console.log("\n⚠ Ostatnie przypadki 'already exist':");
    alreadyExist.forEach(line => {
      console.log(`  ${line.substring(0, 100)}...`);
    });
  }
  
  if (errors.length > 0) {
    console.log("\n❌ Ostatnie błędy:");
    errors.forEach(line => {
      if (line.includes("504") || line.includes("timeout")) {
        console.log(`  ⚠ ${line.substring(0, 150)}...`);
      } else {
        console.log(`  ✗ ${line.substring(0, 150)}...`);
      }
    });
  }
  
  // Sprawdź czy import się zatrzymał
  const lastLine = lines[lines.length - 1];
  const lastImportTime = lines.findLastIndex(l => l.includes("Importing set:"));
  if (lastImportTime !== -1) {
    const lastImportLine = lines[lastImportTime];
    console.log(`\n📝 Ostatni import: ${lastImportLine.substring(0, 100)}`);
  }
  
  // Sprawdź czy jest "Done"
  const doneIndex = lines.findLastIndex(l => l.includes("Done"));
  if (doneIndex !== -1) {
    console.log(`\n✓ Import zakończony (linia ${doneIndex + 1})`);
  } else {
    console.log(`\n⏳ Import prawdopodobnie nadal działa...`);
  }
}

