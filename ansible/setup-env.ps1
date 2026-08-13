# Ansible Configuration Loader
# Lädt .env Datei und erstellt die hosts Datei dynamisch

param(
    [ValidateSet("Staging", "Production")]
    [string]$Environment = "Staging",
    [string]$EnvFile,
    [string]$OutputFile
)

if (-not $EnvFile) {
    $EnvFile = if ($Environment -eq "Staging") { ".env.staging" } else { ".env" }
}

if (-not $OutputFile) {
    $OutputFile = if ($Environment -eq "Staging") { "hosts.staging" } else { "hosts" }
}

Write-Host "Loading Ansible configuration from $EnvFile..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: $EnvFile not found!" -ForegroundColor Red
    Write-Host "Please create $EnvFile based on .env.example" -ForegroundColor Yellow
    Write-Host "`nExample:" -ForegroundColor Cyan
    Write-Host "  Copy-Item .env.example $EnvFile" -ForegroundColor White
    Write-Host "  Edit $EnvFile with your $Environment LXC settings" -ForegroundColor White
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
$lxcPort = if ($envVars['LXC_PORT']) { $envVars['LXC_PORT'] } else { '22' }

if (-not $lxcHost -or -not $lxcUser) {
    Write-Host "Error: LXC_HOST and LXC_USER must be set in .env!" -ForegroundColor Red
    exit 1
}

# Create hosts file
$hostsContent = @"
[netflix]
netflix-$($Environment.ToLowerInvariant()) ansible_host=$lxcHost ansible_user=$lxcUser ansible_port=$lxcPort
"@

Set-Content -Path $OutputFile -Value $hostsContent
Write-Host "✓ $Environment inventory created successfully ($lxcHost)" -ForegroundColor Green
Write-Host "  User: $lxcUser" -ForegroundColor Green
Write-Host "  Port: $lxcPort" -ForegroundColor Green
