/**
 * Script to run Supabase migration directly via API
 * This bypasses the need to log in through the dashboard
 * 
 * Usage: node scripts/run-migration.js
 * 
 * You'll need to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as environment variables
 * or create a .env.local file with these values
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please set:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('You can create a .env.local file with:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxsnsomathouvuhtshyw.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  process.exit(1);
}

// Read the migration SQL file
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20250118_add_preferred_currency_to_profiles.sql');

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Error: Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

async function runMigration() {
  console.log('🚀 Starting migration...');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📄 Migration file: ${migrationFile}`);
  console.log('');

  try {
    // Split SQL into individual statements (semicolon-separated)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    console.log('');

    // Execute each statement via Supabase REST API
    // We'll use the PostgREST API endpoint for running SQL
    // Note: This requires using the service role key which has admin privileges
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    });

    // Alternative: Use Supabase Management API if available
    // Or we can execute directly via PostgREST using raw SQL
    
    // For now, let's try a simpler approach - execute via Supabase REST API
    // We'll need to use the SQL Editor API endpoint
    
    console.log('⚠️  Note: Supabase REST API doesn\'t directly support arbitrary SQL execution.');
    console.log('    Please use one of these methods:');
    console.log('');
    console.log('Method 1: Use Supabase CLI (if installed):');
    console.log('  supabase db push');
    console.log('');
    console.log('Method 2: Copy and paste SQL directly in Supabase Dashboard:');
    console.log('  1. Go to: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw/sql');
    console.log('  2. If you can\'t log in, try: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw');
    console.log('  3. Click "SQL Editor" in the left sidebar');
    console.log('  4. Paste the migration SQL');
    console.log('  5. Click "Run"');
    console.log('');
    console.log('Method 3: Use this script to display the SQL:');
    console.log('');

    // Display the SQL for manual execution
    console.log('📋 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('');
    console.log('✅ Copy the SQL above and paste it into Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.error('');
    console.log('💡 Alternative: Copy and paste the SQL manually into Supabase Dashboard');
    process.exit(1);
  }
}

runMigration();


