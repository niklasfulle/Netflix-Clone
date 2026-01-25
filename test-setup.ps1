# Test-Setup und Ausführungs-Skript für Windows PowerShell
# Dieses Skript hilft beim Setup und Ausführung der Tests

$ErrorActionPreference = "Stop"

# Farben für Output
$GREEN = "`e[32m"
$BLUE = "`e[34m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$RESET = "`e[0m"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Netflix Clone - Test Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Funktion: Installation
function Install-Dependencies {
    Write-Host "${BLUE}📦 Installiere Test-Dependencies...${RESET}" -ForegroundColor Blue
    
    if (Test-Path "yarn.lock") {
        yarn install
    } else {
        npm install
    }
    
    Write-Host "${GREEN}✅ Dependencies installiert${RESET}" -ForegroundColor Green
    Write-Host ""
}

# Funktion: Tests ausführen
function Run-Tests {
    Write-Host "${BLUE}🧪 Führe Tests aus...${RESET}" -ForegroundColor Blue
    
    if (Test-Path "yarn.lock") {
        yarn test
    } else {
        npm test
    }
    
    Write-Host ""
}

# Funktion: Tests im Watch-Mode
function Run-Tests-Watch {
    Write-Host "${BLUE}👁️  Starte Tests im Watch-Mode...${RESET}" -ForegroundColor Blue
    
    if (Test-Path "yarn.lock") {
        yarn test:watch
    } else {
        npm run test:watch
    }
}

# Funktion: Coverage generieren
function Run-Coverage {
    Write-Host "${BLUE}📊 Generiere Test-Coverage...${RESET}" -ForegroundColor Blue
    
    if (Test-Path "yarn.lock") {
        yarn test:coverage
    } else {
        npm run test:coverage
    }
    
    Write-Host "${GREEN}✅ Coverage generiert - siehe coverage/index.html${RESET}" -ForegroundColor Green
    Write-Host ""
}

# Funktion: Alle Tests ausführen
function Run-All {
    Install-Dependencies
    Run-Tests
    Run-Coverage
}

# Funktion: Menu anzeigen
function Show-Menu {
    Write-Host "${YELLOW}Wählen Sie eine Option:${RESET}" -ForegroundColor Yellow
    Write-Host "1) Dependencies installieren"
    Write-Host "2) Tests ausführen"
    Write-Host "3) Tests im Watch-Mode"
    Write-Host "4) Test-Coverage generieren"
    Write-Host "5) Alles ausführen"
    Write-Host "6) Beenden"
    Write-Host ""
}

# Hauptlogik
if ($args.Count -gt 0) {
    switch ($args[0]) {
        "install" {
            Install-Dependencies
        }
        "test" {
            Run-Tests
        }
        "watch" {
            Run-Tests-Watch
        }
        "coverage" {
            Run-Coverage
        }
        "all" {
            Run-All
        }
        default {
            Write-Host "${RED}Unbekannte Option: $($args[0])${RESET}" -ForegroundColor Red
            Write-Host "Verfügbar: install, test, watch, coverage, all"
            exit 1
        }
    }
} else {
    # Interaktives Menu
    $continue = $true
    while ($continue) {
        Show-Menu
        $choice = Read-Host "Option eingeben (1-6)"
        
        switch ($choice) {
            "1" {
                Install-Dependencies
            }
            "2" {
                Run-Tests
            }
            "3" {
                Run-Tests-Watch
            }
            "4" {
                Run-Coverage
            }
            "5" {
                Run-All
            }
            "6" {
                Write-Host "${GREEN}Auf Wiedersehen!${RESET}" -ForegroundColor Green
                $continue = $false
            }
            default {
                Write-Host "${YELLOW}⚠️  Ungültige Option${RESET}" -ForegroundColor Yellow
            }
        }
    }
}
