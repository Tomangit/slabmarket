# Simple PowerShell script to display migration SQL

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$migrationFile = "$projectRoot\supabase\migrations\20250118_add_preferred_currency_to_profiles.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationFile -Raw

Write-Host ""
Write-Host "Migration SQL for: 20250118_add_preferred_currency_to_profiles.sql" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""
Write-Host $migrationSQL
Write-Host ""
Write-Host ("=" * 80) -ForegroundColor Cyan
Write-Host ""
Write-Host "Instructions:" -ForegroundColor Yellow
Write-Host "  1. Copy the SQL above (everything between the lines)" -ForegroundColor White
Write-Host "  2. Go to: https://supabase.com/dashboard/project/xxsnsomathouvuhtshyw/sql" -ForegroundColor White
Write-Host "  3. Paste the SQL into SQL Editor" -ForegroundColor White
Write-Host "  4. Click 'Run' button" -ForegroundColor White
Write-Host ""

