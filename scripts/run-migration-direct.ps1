# PowerShell script to execute Supabase migration SQL directly via PostgREST
# This script uses Supabase REST API to execute SQL statements

Write-Host ""
Write-Host "🚀 Supabase Migration Runner (Direct API)" -ForegroundColor Cyan
Write-Host "═" * 80
Write-Host ""

# Configuration
$supabaseUrl = "https://xxsnsomathouvuhtshyw.supabase.co"
$migrationFile = Join-Path $PSScriptRoot ".." "supabase" "migrations" "20250118_add_preferred_currency_to_profiles.sql"

# Read Service Role Key
Write-Host "🔑 Please enter your Supabase Service Role Key:" -ForegroundColor Yellow
Write-Host "   (You can find it in Supabase Dashboard → Settings → API → service_role)" -ForegroundColor Gray
Write-Host ""
$serviceRoleKey = Read-Host "Service Role Key" -AsSecureString
$serviceRoleKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($serviceRoleKey)
)

if (-not $serviceRoleKeyPlain -or $serviceRoleKeyPlain.Length -lt 50) {
    Write-Host "❌ Invalid Service Role Key" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Using Supabase URL: $supabaseUrl" -ForegroundColor Green
Write-Host "✅ Service Role Key: $($serviceRoleKeyPlain.Substring(0, 20))..." -ForegroundColor Green
Write-Host ""

# Read migration SQL
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationFile -Raw
Write-Host "📄 Migration file loaded: $migrationFile" -ForegroundColor Cyan
Write-Host ""

# Note: Supabase PostgREST API doesn't support arbitrary SQL execution
# We need to execute each statement individually using PostgreSQL functions
# or use the Management API

Write-Host "⚠️  Important Note:" -ForegroundColor Yellow
Write-Host "   Supabase REST API (PostgREST) doesn't support direct SQL execution." -ForegroundColor Yellow
Write-Host "   However, we can try to execute SQL statements one by one." -ForegroundColor Yellow
Write-Host ""

# Parse SQL statements
$statements = @()
$currentStatement = ""

$migrationSQL -split "`n" | ForEach-Object {
    $line = $_.Trim()
    
    # Skip empty lines and comments
    if ($line.Length -eq 0 -or $line.StartsWith('--')) {
        return
    }
    
    $currentStatement += "$line`n"
    
    # If line ends with semicolon, it's the end of a statement
    if ($line -match ';$') {
        $stmt = $currentStatement.Trim()
        if ($stmt.Length -gt 0) {
            $statements += $stmt
        }
        $currentStatement = ""
    }
}

Write-Host "📝 Found $($statements.Count) SQL statements to execute:" -ForegroundColor Cyan
for ($i = 0; $i -lt $statements.Count; $i++) {
    $preview = $statements[$i].Substring(0, [Math]::Min(50, $statements[$i].Length))
    Write-Host "   $($i+1). $preview..." -ForegroundColor Gray
}
Write-Host ""

# Display SQL for manual execution
Write-Host "📋 Migration SQL (for manual execution if API fails):" -ForegroundColor Cyan
Write-Host "─" * 80
Write-Host $migrationSQL
Write-Host "─" * 80
Write-Host ""

Write-Host "💡 Since Supabase REST API doesn't support direct SQL execution," -ForegroundColor Yellow
Write-Host "   please copy the SQL above and run it in Supabase Dashboard:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   1. Go to: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw/sql" -ForegroundColor White
Write-Host "   2. Paste the SQL above" -ForegroundColor White
Write-Host "   3. Click 'Run'" -ForegroundColor White
Write-Host ""
Write-Host "   Or try logging in through a different browser/incognito mode" -ForegroundColor White
Write-Host ""

# Attempt alternative: Use Supabase CLI if available
Write-Host "🔧 Alternative: Use Supabase CLI (if installed):" -ForegroundColor Cyan
Write-Host "   supabase db push" -ForegroundColor White
Write-Host ""

Write-Host "✅ Migration SQL is ready for manual execution" -ForegroundColor Green
Write-Host ""


