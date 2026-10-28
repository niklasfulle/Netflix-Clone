param(
    [Parameter(Position = 0)]
    [string]$SonarHostUrl,

    [Parameter(Position = 1)]
    [string]$Token,

    [Parameter(Position = 2)]
    [string]$ProjectKey = "netflix"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($SonarHostUrl)) {
    throw @"
Die SonarQube-URL muss explizit übergeben werden.

Verwendung:
.\sonar.ps1 -SonarHostUrl "https://sonarqube.example.com" -Token `$token
"@
}

$parsedSonarUri = $null
$isValidSonarUri =
    [Uri]::TryCreate($SonarHostUrl, [UriKind]::Absolute, [ref]$parsedSonarUri) -and
    $parsedSonarUri.Scheme -in @("http", "https") -and
    -not [string]::IsNullOrWhiteSpace($parsedSonarUri.Host)

if (-not $isValidSonarUri) {
    throw "SonarHostUrl muss eine vollständige HTTP- oder HTTPS-URL sein."
}

$SonarHostUrl = $SonarHostUrl.TrimEnd("/")

if ([string]::IsNullOrWhiteSpace($Token)) {
    throw @"
Der SonarQube-Token muss explizit übergeben werden.

Token verdeckt einlesen:
`$token = Read-Host "SonarQube Token" -MaskInput

Danach erneut ausführen:
.\sonar.ps1 -SonarHostUrl "$SonarHostUrl" -Token `$token
"@
}

$nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue
if ($null -eq $nodeCommand) {
    throw "Node.js wurde nicht gefunden. Installiere Node.js 22.12 oder neuer und die Projektabhängigkeiten."
}

$scannerCandidates = @(
    (Join-Path $PSScriptRoot "node_modules\.bin\sonar-scanner-npm.cmd"),
    (Join-Path $PSScriptRoot "node_modules\.bin\sonar-scanner.cmd"),
    (Join-Path $PSScriptRoot "node_modules\sonarqube-scanner\bin\sonar-scanner.js")
)
$scannerPath = $scannerCandidates |
    Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
    Select-Object -First 1

if ([string]::IsNullOrWhiteSpace($scannerPath)) {
    throw @"
SonarScanner wurde nicht gefunden. Geprüfte Pfade:
$($scannerCandidates -join [Environment]::NewLine)

Installiere zuerst die Projektabhängigkeiten.
"@
}

$jestCandidates = @(
    (Join-Path $PSScriptRoot "node_modules\.bin\jest.cmd"),
    (Join-Path $PSScriptRoot "node_modules\jest\bin\jest.js")
)
$jestPath = $jestCandidates |
    Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
    Select-Object -First 1

if ([string]::IsNullOrWhiteSpace($jestPath)) {
    throw @"
Jest wurde nicht gefunden. Geprüfte Pfade:
$($jestCandidates -join [Environment]::NewLine)

Installiere zuerst die Projektabhängigkeiten.
"@
}

$resolverPath = Join-Path $PSScriptRoot "node_modules\unrs-resolver"
& $nodeCommand.Source "-e" "try { require(process.argv[1]); } catch { process.exitCode = 1; }" $resolverPath
if ($LASTEXITCODE -ne 0) {
    throw @"
Der native Jest-Modulresolver kann unter diesem Betriebssystem nicht geladen werden.
Das kann passieren, wenn node_modules unter Linux/Docker installiert und anschließend unter Windows verwendet wurde.

Installiere die Abhängigkeiten in der Umgebung, in der du Sonar startest:
yarn install --frozen-lockfile --force

Verwende getrennte node_modules-Verzeichnisse für Windows und Linux/Docker.
"@
}

$baselineCheckScript = Join-Path $PSScriptRoot "scripts\check-baseline-browser-mapping.mjs"
if (-not (Test-Path -LiteralPath $baselineCheckScript -PathType Leaf)) {
    throw "Das Skript für den Baseline-Browserdaten-Check wurde nicht gefunden: $baselineCheckScript"
}

Write-Host "Prüfe Aktualität der Baseline-Browserdaten ..."
& $nodeCommand.Source $baselineCheckScript
$baselineCheckExitCode = $LASTEXITCODE
if ($baselineCheckExitCode -ne 0) {
    Write-Error "Der Baseline-Browserdaten-Check ist mit Code $baselineCheckExitCode fehlgeschlagen."
    exit $baselineCheckExitCode
}

Write-Host "Erzeuge einen aktuellen LCOV-Coverage-Bericht ..."
if ($jestPath.EndsWith(".js", [StringComparison]::OrdinalIgnoreCase)) {
    & $nodeCommand.Source $jestPath "--coverage" "--coverageReporters=lcov"
}
else {
    & $jestPath "--coverage" "--coverageReporters=lcov"
}

$testExitCode = $LASTEXITCODE
if ($testExitCode -ne 0) {
    Write-Error "Die Tests sind mit Code $testExitCode fehlgeschlagen. SonarQube wurde nicht gestartet."
    exit $testExitCode
}

Write-Host "Starte SonarQube-Analyse für '$ProjectKey' ..."
Write-Host "Server: $SonarHostUrl"

$previousSonarToken = $env:SONAR_TOKEN
try {
    $env:SONAR_TOKEN = $Token
    if ($scannerPath.EndsWith(".js", [StringComparison]::OrdinalIgnoreCase)) {
        & $nodeCommand.Source $scannerPath "-Dsonar.host.url=$SonarHostUrl" "-Dsonar.projectKey=$ProjectKey"
    }
    else {
        & $scannerPath "-Dsonar.host.url=$SonarHostUrl" "-Dsonar.projectKey=$ProjectKey"
    }

    $scannerExitCode = $LASTEXITCODE

    $summaryScript = Join-Path $PSScriptRoot "scripts\sonar-summary.mjs"
    if (-not (Test-Path -LiteralPath $summaryScript -PathType Leaf)) {
        Write-Warning "Das Skript für die SonarQube-Übersicht wurde nicht gefunden: $summaryScript"
    }
    else {
        & $nodeCommand.Source $summaryScript $SonarHostUrl $ProjectKey
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Die SonarQube-Übersicht konnte nicht vollständig ausgegeben werden."
        }
    }
}
finally {
    if ($null -eq $previousSonarToken) {
        Remove-Item Env:SONAR_TOKEN -ErrorAction SilentlyContinue
    }
    else {
        $env:SONAR_TOKEN = $previousSonarToken
    }
}

if ($scannerExitCode -ne 0) {
    Write-Error "Die SonarQube-Analyse ist mit Code $scannerExitCode fehlgeschlagen."
    exit $scannerExitCode
}

Write-Host "SonarQube-Analyse erfolgreich abgeschlossen."
exit 0
