#!/bin/bash

# Test-Setup und Ausführungs-Skript
# Dieses Skript hilft beim Setup und Ausführung der Tests

set -e

echo "================================"
echo "Netflix Clone - Test Setup"
echo "================================"
echo ""

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion: Installation
install_dependencies() {
    echo -e "${BLUE}📦 Installiere Test-Dependencies...${NC}"
    if [ -f "yarn.lock" ]; then
        yarn install
    else
        npm install
    fi
    echo -e "${GREEN}✅ Dependencies installiert${NC}"
    echo ""
}

# Funktion: Tests ausführen
run_tests() {
    echo -e "${BLUE}🧪 Führe Tests aus...${NC}"
    if [ -f "yarn.lock" ]; then
        yarn test
    else
        npm test
    fi
    echo ""
}

# Funktion: Tests im Watch-Mode
run_tests_watch() {
    echo -e "${BLUE}👁️  Starte Tests im Watch-Mode...${NC}"
    if [ -f "yarn.lock" ]; then
        yarn test:watch
    else
        npm run test:watch
    fi
}

# Funktion: Coverage generieren
run_coverage() {
    echo -e "${BLUE}📊 Generiere Test-Coverage...${NC}"
    if [ -f "yarn.lock" ]; then
        yarn test:coverage
    else
        npm run test:coverage
    fi
    echo -e "${GREEN}✅ Coverage generiert - siehe coverage/index.html${NC}"
    echo ""
}

# Funktion: Alle Tests ausführen
run_all() {
    install_dependencies
    run_tests
    run_coverage
}

# Hauptmenu
show_menu() {
    echo -e "${YELLOW}Wählen Sie eine Option:${NC}"
    echo "1) Dependencies installieren"
    echo "2) Tests ausführen"
    echo "3) Tests im Watch-Mode"
    echo "4) Test-Coverage generieren"
    echo "5) Alles ausführen"
    echo "6) Beenden"
    echo ""
}

# Wenn Argument übergeben, direkt ausführen
if [ "$#" -gt 0 ]; then
    case "$1" in
        install)
            install_dependencies
            ;;
        test)
            run_tests
            ;;
        watch)
            run_tests_watch
            ;;
        coverage)
            run_coverage
            ;;
        all)
            run_all
            ;;
        *)
            echo "Unbekannte Option: $1"
            echo "Verfügbar: install, test, watch, coverage, all"
            exit 1
            ;;
    esac
else
    # Interaktives Menu
    while true; do
        show_menu
        read -p "Option eingeben (1-6): " choice
        
        case $choice in
            1)
                install_dependencies
                ;;
            2)
                run_tests
                ;;
            3)
                run_tests_watch
                ;;
            4)
                run_coverage
                ;;
            5)
                run_all
                ;;
            6)
                echo -e "${GREEN}Auf Wiedersehen!${NC}"
                exit 0
                ;;
            *)
                echo -e "${YELLOW}⚠️  Ungültige Option${NC}"
                ;;
        esac
    done
fi
