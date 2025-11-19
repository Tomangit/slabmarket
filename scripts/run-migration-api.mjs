/**
 * Script to run Supabase migration via API using Supabase JS client
 * This uses Service Role Key to execute SQL through RPC functions
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://xxsnsomathouvuhtshyw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found');
  console.error('');
  console.error('Please set environment variable:');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('Or create .env.local file with:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('💡 You can find your Service Role Key in Supabase Dashboard:');
  console.error('   Settings → API → service_role (secret key)');
  console.error('');
  process.exit(1);
}

// Read migration SQL
const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20250118_add_preferred_currency_to_profiles.sql');

if (!fs.existsSync(migrationFile)) {
  console.error(`❌ Error: Migration file not found: ${migrationFile}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

console.log('');
console.log('🚀 Supabase Migration Runner via API');
console.log('═'.repeat(80));
console.log(`✅ Supabase URL: ${SUPABASE_URL}`);
console.log(`✅ Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log(`📄 Migration file: ${migrationFile}`);
console.log('');

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Note: Supabase PostgREST doesn't support arbitrary SQL execution
// We need to create an RPC function or use Management API
// For now, let's try to execute SQL via a stored procedure

async function runMigration() {
  console.log('🔧 Attempting to execute migration via Supabase API...');
  console.log('');

  try {
    // Method 1: Try to create a temporary RPC function to execute SQL
    // This requires creating a function in the database first
    
    // Method 2: Execute SQL statements one by one via psql or Management API
    // But we don't have direct access to psql from here
    
    // Method 3: Display SQL for manual execution
    console.log('⚠️  Note: Supabase REST API (PostgREST) doesn\'t support direct SQL execution.');
    console.log('    We need to use one of these methods:');
    console.log('');
    console.log('Method 1: Copy SQL and run manually in Supabase Dashboard');
    console.log('Method 2: Use Supabase CLI (if installed): supabase db push');
    console.log('Method 3: Use psql command line tool');
    console.log('');
    
    // Parse SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements:`);
    for (let i = 0; i < statements.length; i++) {
      const preview = statements[i].substring(0, Math.min(60, statements[i].length));
      console.log(`   ${i + 1}. ${preview}...`);
    }
    console.log('');
    
    // Display SQL for manual execution
    console.log('📋 Migration SQL (copy and paste into Supabase Dashboard):');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('');
    console.log('💡 Instructions:');
    console.log('   1. Copy the SQL above (everything between the lines)');
    console.log('   2. Go to: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw/sql');
    console.log('   3. Paste the SQL into SQL Editor');
    console.log('   4. Click "Run" button');
    console.log('');
    
    // Alternative: Try to execute via RPC if we have a function for it
    // Most Supabase projects don't have exec_sql function by default
    
    console.log('🔧 Alternative: Create a temporary RPC function to execute SQL');
    console.log('   (This requires admin access to create functions)');
    console.log('');
    
    // We can try to execute SQL via Supabase Management API if we have access
    // But that requires different authentication
    
    console.log('✅ Migration SQL is ready!');
    console.log('   Please copy it above and run in Supabase Dashboard SQL Editor');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.log('💡 Please copy the SQL above and run it manually in Supabase Dashboard');
  }
}

runMigration();


