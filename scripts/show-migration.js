/**
 * Simple script to display the migration SQL
 * This helps you copy it easily to paste into Supabase Dashboard SQL Editor
 */

const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20250118_add_preferred_currency_to_profiles.sql');

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Error: Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

console.log('');
console.log('📋 Migration SQL for: 20250118_add_preferred_currency_to_profiles.sql');
console.log('═'.repeat(80));
console.log('');
console.log(migrationSQL);
console.log('');
console.log('═'.repeat(80));
console.log('');
console.log('📝 Instructions:');
console.log('  1. Copy the SQL above (everything between the lines)');
console.log('  2. Go to: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw/sql');
console.log('  3. Paste the SQL into the SQL Editor');
console.log('  4. Click "Run" button');
console.log('');
console.log('💡 Tip: If you can\'t access the dashboard, try:');
console.log('  - Using a different browser');
console.log('  - Clearing cookies for supabase.com');
console.log('  - Using incognito/private mode');
console.log('  - Contacting Supabase support if the issue persists');
console.log('');


