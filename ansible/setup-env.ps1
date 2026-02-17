# Ansible Configuration Loader
# Lädt .env Datei und erstellt die hosts Datei dynamisch

param(
    [string]$EnvFile = ".env"
)

Write-Host "Loading Ansible configuration from .env..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: $EnvFile not found!" -ForegroundColor Red
    Write-Host "Please create $EnvFile based on $EnvFile.example" -ForegroundColor Yellow
    Write-Host "`nExample:" -ForegroundColor Cyan
    Write-Host "  Copy-Item .env.example .env" -ForegroundColor White
    Write-Host "  Edit .env with your LXC settings" -ForegroundColor White
    exit 1
}

# Load .env file
$envVars = @{}
Get-Content $EnvFile | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    $envVars[$key.Trim()] = $value.Trim()
}

# Extract variables
$lxcHost = $envVars['LXC_HOST']
$lxcUser = $envVars['LXC_USER']

if (-not $lxcHost -or -not $lxcUser) {
    Write-Host "Error: LXC_HOST and LXC_USER must be set in .env!" -ForegroundColor Red
    exit 1
}

# Create hosts file
$hostsContent = @"
[netflix]
netflix-lxc ansible_host=$lxcHost ansible_user=$lxcUser ansible_port=$lxcPort
"@

Set-Content -Path "hosts" -Value $hostsContent
Write-Host "✓ hosts file created successfully ($lxcHost)" -ForegroundColor Green
Write-Host "  User: $lxcUser" -ForegroundColor Green
