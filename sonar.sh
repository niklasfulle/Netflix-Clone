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

if ! command -v node >/dev/null 2>&1; then
    echo "Node.js wurde nicht gefunden. Installiere zuerst die Projektabhängigkeiten." >&2
    exit 1
fi

BASELINE_CHECK="${SCRIPT_DIR}/scripts/check-baseline-browser-mapping.mjs"
if [[ ! -f "${BASELINE_CHECK}" ]]; then
    echo "Das Skript für den Baseline-Browserdaten-Check wurde nicht gefunden: ${BASELINE_CHECK}" >&2
    exit 1
fi

echo "Prüfe Aktualität der Baseline-Browserdaten ..."
baseline_check_exit_code=0
node "${BASELINE_CHECK}" || baseline_check_exit_code=$?
if (( baseline_check_exit_code != 0 )); then
    echo "Der Baseline-Browserdaten-Check ist mit Code ${baseline_check_exit_code} fehlgeschlagen." >&2
    exit "${baseline_check_exit_code}"
fi

echo "Erzeuge einen aktuellen LCOV-Coverage-Bericht ..."
"${JEST}" --coverage --coverageReporters=lcov

echo "Starte SonarQube-Analyse für '${SONAR_PROJECT_KEY}' ..."
echo "Server: ${SONAR_HOST_URL}"

scanner_exit_code=0
SONAR_TOKEN="${SONAR_TOKEN_VALUE}" "${SONAR_SCANNER}" \
    "-Dsonar.host.url=${SONAR_HOST_URL}" \
    "-Dsonar.projectKey=${SONAR_PROJECT_KEY}" || scanner_exit_code=$?

SONAR_SUMMARY="${SCRIPT_DIR}/scripts/sonar-summary.mjs"
if [[ ! -f "${SONAR_SUMMARY}" ]]; then
    echo "Warnung: Das Skript für die SonarQube-Übersicht wurde nicht gefunden: ${SONAR_SUMMARY}" >&2
elif ! SONAR_TOKEN="${SONAR_TOKEN_VALUE}" node "${SONAR_SUMMARY}" "${SONAR_HOST_URL}" "${SONAR_PROJECT_KEY}"; then
    echo "Warnung: Die SonarQube-Übersicht konnte nicht vollständig ausgegeben werden." >&2
fi

if (( scanner_exit_code != 0 )); then
    echo "Die SonarQube-Analyse ist mit Code ${scanner_exit_code} fehlgeschlagen." >&2
    exit "${scanner_exit_code}"
fi

echo "SonarQube-Analyse erfolgreich abgeschlossen."
