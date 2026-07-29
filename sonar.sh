#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 2 || $# -gt 3 ]]; then
    cat >&2 <<'EOF'
Die SonarQube-URL und der Token müssen explizit übergeben werden.

Verwendung:
./sonar.sh https://sonarqube.example.com token [project-key]
EOF
    exit 1
fi

SONAR_HOST_URL="${1%/}"
SONAR_TOKEN_VALUE="${2}"
SONAR_PROJECT_KEY="${3:-netflix}"

if [[ ! "${SONAR_HOST_URL}" =~ ^https?://[^[:space:]]+$ ]]; then
    echo "Die SonarQube-URL muss eine vollständige HTTP- oder HTTPS-URL sein." >&2
    exit 1
fi

if [[ -z "${SONAR_TOKEN_VALUE}" ]]; then
    cat >&2 <<'EOF'
Der SonarQube-Token muss explizit übergeben werden.

Token verdeckt eingeben:
read -rsp "SonarQube Token: " sonar_token
echo

Danach erneut ausführen:
./sonar.sh https://sonarqube.example.com "$sonar_token"
EOF
    exit 1
fi

SONAR_SCANNER=""
SCANNER_CANDIDATES=(
    "${SCRIPT_DIR}/node_modules/.bin/sonar-scanner-npm"
    "${SCRIPT_DIR}/node_modules/.bin/sonar-scanner"
)

for scanner_candidate in "${SCANNER_CANDIDATES[@]}"; do
    if [[ -x "${scanner_candidate}" ]]; then
        SONAR_SCANNER="${scanner_candidate}"
        break
    fi
done

if [[ -z "${SONAR_SCANNER}" ]]; then
    printf 'SonarScanner wurde nicht gefunden. Geprüfte Pfade:\n' >&2
    printf '%s\n' "${SCANNER_CANDIDATES[@]}" >&2
    echo "Installiere zuerst die Projektabhängigkeiten." >&2
    exit 1
fi

JEST="${SCRIPT_DIR}/node_modules/.bin/jest"
if [[ ! -x "${JEST}" ]]; then
    echo "Jest wurde nicht gefunden: ${JEST}" >&2
    echo "Installiere zuerst die Projektabhängigkeiten." >&2
    exit 1
fi

echo "Erzeuge einen aktuellen LCOV-Coverage-Bericht ..."
"${JEST}" --coverage --coverageReporters=lcov

echo "Starte SonarQube-Analyse für '${SONAR_PROJECT_KEY}' ..."
echo "Server: ${SONAR_HOST_URL}"

SONAR_TOKEN="${SONAR_TOKEN_VALUE}" "${SONAR_SCANNER}" \
    "-Dsonar.host.url=${SONAR_HOST_URL}" \
    "-Dsonar.projectKey=${SONAR_PROJECT_KEY}"

echo "SonarQube-Analyse erfolgreich abgeschlossen."
