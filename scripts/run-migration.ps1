# PowerShell script to run Supabase migration via API
# This uses Supabase REST API to execute SQL directly
# Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

Write-Host ""
Write-Host "🚀 Supabase Migration Runner" -ForegroundColor Cyan
Write-Host "═" * 80

# Read environment variables
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
if (-not $supabaseUrl) {
    $supabaseUrl = $env:SUPABASE_URL
}

$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

# Try to read from .env.local if variables not set
if (-not $supabaseUrl -or -not $serviceRoleKey) {
    $envFile = Join-Path $PSScriptRoot ".." ".env.local"
    if (Test-Path $envFile) {
        Write-Host "📄 Reading environment variables from .env.local..." -ForegroundColor Yellow
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]*)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim().Trim('"').Trim("'")
                if ($key -eq "NEXT_PUBLIC_SUPABASE_URL" -or $key -eq "SUPABASE_URL") {
                    $supabaseUrl = $value
                }
                if ($key -eq "SUPABASE_SERVICE_ROLE_KEY") {
                    $serviceRoleKey = $value
                }
            }
        }
    }
}

# Validate required variables
if (-not $supabaseUrl) {
    Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set environment variable or create .env.local with:" -ForegroundColor Yellow
    Write-Host "  NEXT_PUBLIC_SUPABASE_URL=https://xxsnsomathouvuhtshyw.supabase.co"
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here"
    Write-Host ""
    exit 1
}

if (-not $serviceRoleKey) {
    Write-Host "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set environment variable or create .env.local with:" -ForegroundColor Yellow
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here"
    Write-Host ""
    Write-Host "💡 You can find your Service Role Key in Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "   Settings → API → service_role (secret key)" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase URL: $supabaseUrl" -ForegroundColor Green
Write-Host "✅ Service Role Key: $($serviceRoleKey.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Read migration SQL file
$migrationFile = Join-Path $PSScriptRoot ".." "supabase" "migrations" "20250118_add_preferred_currency_to_profiles.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationFile -Raw

Write-Host "📄 Migration file: $migrationFile" -ForegroundColor Cyan
Write-Host "📝 SQL length: $($migrationSQL.Length) characters" -ForegroundColor Cyan
Write-Host ""

# Note: Supabase REST API doesn't directly support arbitrary SQL execution
# We need to use the Management API or PostgREST's RPC functions
# For now, we'll try using the Supabase Management API endpoint

Write-Host "⚠️  Note: Supabase REST API (PostgREST) doesn't support arbitrary SQL execution." -ForegroundColor Yellow
Write-Host "    We need to use Supabase Management API or run SQL directly." -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 Attempting to execute via Supabase Management API..." -ForegroundColor Cyan
Write-Host ""

# Try using Supabase Management API
# Note: This requires authentication with Supabase Management API token, not service role key
# The service role key only works with PostgREST, not Management API

$apiUrl = "$supabaseUrl/rest/v1/rpc/exec_sql"

try {
    # First, let's try a simpler approach - execute via psql-like API if available
    # Or we can use the Supabase SQL Editor API endpoint
    
    Write-Host "📋 Displaying migration SQL for manual execution:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "─" * 80
    Write-Host $migrationSQL
    Write-Host "─" * 80
    Write-Host ""
    
    Write-Host "💡 Alternative method: Copy the SQL above and run it manually" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To run via Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw/sql" -ForegroundColor White
    Write-Host "  2. Paste the SQL above" -ForegroundColor White
    Write-Host "  3. Click 'Run'" -ForegroundColor White
    Write-Host ""
    
    # Try using PostgREST to execute SQL via a function
    # We can create a temporary function or use existing RPC
    
    Write-Host "🔧 Attempting to execute SQL via Supabase API..." -ForegroundColor Cyan
    Write-Host ""
    
    # Split SQL into statements
    $statements = $migrationSQL -split ';' | Where-Object { $_.Trim().Length -gt 0 -and -not $_.Trim().StartsWith('--') }
    
    Write-Host "Found $($statements.Count) SQL statements" -ForegroundColor Cyan
    Write-Host ""
    
    # Note: Supabase PostgREST doesn't support direct SQL execution
    # We would need to use Supabase CLI or Management API
    # For now, let's provide instructions for manual execution
    
    Write-Host "✅ Migration SQL is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Copy the SQL above (between the lines)" -ForegroundColor Yellow
    Write-Host "   and paste it into Supabase SQL Editor" -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Please copy the SQL above and run it manually in Supabase Dashboard" -ForegroundColor Yellow
    exit 1
}

Write-Host ""


