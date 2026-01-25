#!/usr/bin/env pwsh

# Merge LCOV coverage files from jsdom and node test environments

$jsdomLcov = "coverage-jsdom/lcov.info"
$nodeLcov = "coverage-node/lcov.info"
$outputFile = "coverage/lcov.info"

# Create coverage directory if it doesn't exist
if (-not (Test-Path "coverage")) {
    New-Item -ItemType Directory -Path "coverage" -Force | Out-Null
}

Write-Host "Merging coverage files..."

# Read both LCOV files
$jsdomContent = @()
$nodeContent = @()

if (Test-Path $jsdomLcov) {
    $jsdomContent = Get-Content $jsdomLcov -Raw
    Write-Host "✓ Read jsdom coverage: $jsdomLcov"
} else {
    Write-Host "⚠ jsdom coverage file not found: $jsdomLcov"
}

if (Test-Path $nodeLcov) {
    $nodeContent = Get-Content $nodeLcov -Raw
    Write-Host "✓ Read node coverage: $nodeLcov"
} else {
    Write-Host "⚠ node coverage file not found: $nodeLcov"
}

# Combine the contents (LCOV format allows multiple TN: blocks)
$mergedContent = $jsdomContent + "`n" + $nodeContent

# Write merged file
$mergedContent | Set-Content $outputFile -Encoding UTF8
Write-Host "✓ Merged coverage written to: $outputFile"

# Also copy json summary
if (Test-Path "coverage-jsdom/coverage-summary.json") {
    Copy-Item "coverage-jsdom/coverage-summary.json" "coverage/coverage-summary.json" -Force
    Write-Host "✓ Copied coverage-summary.json"
}

Write-Host "Coverage merge complete!"
