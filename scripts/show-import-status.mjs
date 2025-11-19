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

console.log("📊 Status importu kart Pokemon\n");

// Sprawdź postęp
const { count: totalCards } = await supabase
  .from("cards")
  .select("*", { count: "exact", head: true });

const { data: setsWithCards } = await supabase
  .from("cards")
  .select("set_name");

const uniqueSets = new Set((setsWithCards || []).map(c => c.set_name));
const setsCount = uniqueSets.size;

const { count: totalEnglishSets } = await supabase
  .from("sets")
  .select("*", { count: "exact", head: true })
  .eq("language", "english");

const progress = Math.round((setsCount / (totalEnglishSets || 1)) * 100);

console.log(`Karty w bazie: ${totalCards || 0}`);
console.log(`Zestawy z kartami: ${setsCount} / ${totalEnglishSets || 0}`);
console.log(`Postęp: ${progress}%\n`);

// Pokaż ostatnio zaimportowane zestawy
const { data: recentCards } = await supabase
  .from("cards")
  .select("set_name, created_at")
  .order("created_at", { ascending: false })
  .limit(200);

if (recentCards) {
  const recentSets = new Map();
  recentCards.forEach(card => {
    if (!recentSets.has(card.set_name)) {
      recentSets.set(card.set_name, card.created_at);
    }
  });
  
  const sortedRecent = Array.from(recentSets.entries())
    .sort((a, b) => new Date(b[1]) - new Date(a[1]))
    .slice(0, 10);
  
  if (sortedRecent.length > 0) {
    console.log("📝 Ostatnio zaimportowane zestawy:");
    sortedRecent.forEach(([setName, date], index) => {
      const timeAgo = new Date() - new Date(date);
      const minutesAgo = Math.floor(timeAgo / 60000);
      const hoursAgo = Math.floor(minutesAgo / 60);
      const timeStr = hoursAgo > 0 
        ? `${hoursAgo}h ${minutesAgo % 60}min temu` 
        : minutesAgo > 0 
        ? `${minutesAgo}min temu` 
        : "przed chwilą";
      
      console.log(`  ${(index + 1).toString().padStart(2)}. ${setName.padEnd(50)} (${timeStr})`);
    });
  }
}

// Sprawdź logi jeśli istnieją
const logFile = "import-progress.log";
if (fs.existsSync(logFile)) {
  const stats = fs.statSync(logFile);
  const fileSize = (stats.size / 1024).toFixed(2);
  const lastModified = stats.mtime;
  const timeSinceModified = Math.floor((Date.now() - lastModified.getTime()) / 1000);
  const minutesSinceModified = Math.floor(timeSinceModified / 60);
  
  console.log(`\n📄 Logi importu: ${logFile}`);
  console.log(`   Rozmiar: ${fileSize} KB`);
  console.log(`   Ostatnia aktualizacja: ${minutesSinceModified}min temu`);
  
  if (timeSinceModified < 300) { // 5 minut
    console.log(`   ✓ Import prawdopodobnie działa`);
  } else {
    console.log(`   ⚠ Import może być zatrzymany (brak aktualizacji >5min)`);
  }
  
  // Pokaż ostatnie linie z logów
  try {
    const logContent = fs.readFileSync(logFile, "utf-8");
    const lines = logContent.split("\n").filter(l => l.trim());
    const lastLines = lines.slice(-10);
    
    if (lastLines.length > 0) {
      console.log(`\n   Ostatnie linie z logów:`);
      lastLines.forEach(line => {
        if (line.includes("Successfully imported") || line.includes("Failed to import") || line.includes("Importing set:")) {
          console.log(`   ${line.substring(0, 100)}...`);
        }
      });
    }
  } catch (e) {
    // Ignoruj błędy czytania
  }
} else {
  console.log(`\n📄 Brak pliku logów - import może nie być uruchomiony`);
}

console.log(`\n💡 Aby zobaczyć pełne logi: type import-progress.log`);





