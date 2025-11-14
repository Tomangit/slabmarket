/**
 * Import z lepszym logowaniem postępu do pliku
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "import-progress.log");
const logStream = fs.createWriteStream(logFile, { flags: "a" });

console.log(`Starting import with progress logging to: ${logFile}\n`);

const child = spawn("node", ["scripts/import-pokemon-cards.mjs", "--language", "english"], {
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";

child.stdout.on("data", (data) => {
  const text = data.toString();
  process.stdout.write(text);
  logStream.write(text);
  output += text;
});

child.stderr.on("data", (data) => {
  const text = data.toString();
  process.stderr.write(text);
  logStream.write(`[ERROR] ${text}`);
});

child.on("close", (code) => {
  logStream.end();
  console.log(`\n\nImport finished with code ${code}`);
  console.log(`Full log saved to: ${logFile}`);
  process.exit(code || 0);
});

// Zapisz postęp co 30 sekund
setInterval(() => {
  const timestamp = new Date().toISOString();
  logStream.write(`\n[${timestamp}] Progress checkpoint\n`);
}, 30000);

