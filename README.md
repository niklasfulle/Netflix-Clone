# Netflix Clone

Eine selbst gehostete Streaming-Anwendung für Filme und Serien mit Benutzerprofilen,
Wiedergabefortschritt und einem umfangreichen Administrationsbereich.

Aktuelle Version: **1.9.3**

## Funktionsumfang

### Streaming und Benutzer

- Anmeldung und Registrierung mit Auth.js
- Mehrere Profile pro Benutzerkonto
- Filme, Serien, Suche, Favoriten und Watchlist
- „Continue Watching“ mit gespeichertem Wiedergabefortschritt
- Wiedergabeverlauf und zufällige Wiedergabe
- Byte-Range-Streaming für Player und Billboard-Videos
- Responsive Oberfläche für Desktop und Mobilgeräte
- Deutsche und englische Benutzeroberfläche
- Überarbeitete Benutzereinstellungen

### Administration

Der Administrationsbereich ist ausschließlich für Benutzer mit Administratorrolle
zugänglich.

- Dashboard mit zentralen Kennzahlen und Aktivitäten
- Filme und Serien erstellen, bearbeiten, filtern und exportieren
- Content-Status `DRAFT`, `PUBLISHED` und `ARCHIVED`
- Schauspieler direkt beim Erstellen eines Inhalts anlegen und zuweisen
- Schauspieler suchen, umbenennen, zusammenführen und sicher löschen
- Benutzer, Rollen und temporäre Sperren verwalten
- Statistiken und CSV-Exporte
- Strukturierte Systemprotokolle mit Filtern und Auto-Refresh
- Verschlüsselte Datenbank-Backups erstellen und wiederherstellen
- Systemübersicht für LXC, Docker, Datenbank, Speicher und Backups

Wichtige Admin-Routen:

| Bereich | Route |
| --- | --- |
| Dashboard | `/admin` |
| Inhalte | `/admin/movies` |
| Neuer Inhalt | `/admin/movies/new` |
| Schauspieler | `/admin/actors` |
| Benutzer | `/admin/users` |
| Statistiken | `/admin/statistics` |
| Logs | `/admin/logs` |
| Backups | `/admin/backups` |
| Systemübersicht | `/admin/system` |

## Technischer Aufbau

| Bereich | Technologie |
| --- | --- |
| Framework | Next.js 16.2 |
| UI | React 19.2, TypeScript, Tailwind CSS |
| Authentifizierung | Auth.js / NextAuth 5 |
| Datenbank | PostgreSQL |
| ORM | Prisma 5.22 |
| Tests | Jest, Testing Library, Python `unittest` |
| Qualität | ESLint, SonarQube |
| Betrieb | Docker, Docker Compose, Ansible, systemd |

## Voraussetzungen

Für die lokale Entwicklung:

- Node.js 22
- Corepack mit Yarn 1.22
- PostgreSQL
- Git

Für das Deployment:

- Docker Desktop auf dem Entwicklungsrechner
- Zugang zu Docker Hub für `salkin263/netflix-clone`
- WSL oder Linux mit Ansible
- SSH-Zugriff auf den Ziel-LXC
- Docker und systemd auf dem Ziel-LXC
- Python 3 auf dem Ziel-LXC für den Monitoring-Agenten

## Lokale Einrichtung

### 1. Abhängigkeiten installieren

```powershell
corepack enable
corepack yarn install --frozen-lockfile --production=false
```

Das Verzeichnis `vendor/brace-expansion-compat` gehört zum Projekt und muss beim
Installieren sowie beim Docker-Build vorhanden sein.

### 2. Umgebungsvariablen konfigurieren

Lege im Projektstamm eine lokale `.env` an. Diese Datei wird von Git ignoriert und
darf nicht committed werden.

Minimale Konfiguration:

```dotenv
POSTGRESQL_URL=postgresql://USER:PASSWORD@DATABASE_HOST:5432/Netflix
AUTH_SECRET=REPLACE_WITH_A_RANDOM_SECRET
AUTH_URL=http://localhost:3000
```

Je nach aktivierter Anmeldung und Mail-Konfiguration werden weitere Provider- oder
SMTP-Variablen benötigt. Übernimm dafür die Namen aus deiner bestehenden
Betriebsumgebung, aber niemals deren Werte in das Repository.

`AUTH_URL` muss exakt der Adresse entsprechen, über die die Anwendung aufgerufen
wird. Für den Server kann das beispielsweise `http://netflix:3000` oder
`http://192.168.1.155:3000` sein. Der Hostname muss auf dem Client per DNS oder
Hosts-Datei auflösbar sein.

### 3. Prisma vorbereiten

```powershell
corepack yarn prisma generate
corepack yarn prisma db push
```

`prisma db push --force-reset` darf auf einer bestehenden Installation nicht
verwendet werden, da es alle Daten löscht. Vor manuellen Schemaänderungen sollte
immer ein Datenbank-Backup erstellt werden.

### 4. Entwicklungsserver starten

```powershell
corepack yarn dev
```

Danach ist die Anwendung unter
[http://localhost:3000](http://localhost:3000) erreichbar.

## Umgebungs- und Laufzeitdaten

| Einstellung | Zweck | Standard |
| --- | --- | --- |
| `POSTGRESQL_URL` | Verbindung zur PostgreSQL-Datenbank | erforderlich |
| `AUTH_SECRET` | Signiert und schützt Authentifizierungsdaten | erforderlich |
| `AUTH_URL` | Öffentliche Basisadresse der Anwendung | erforderlich |
| `SYSTEM_MONITOR_PATH` | Pfad zum JSON-Snapshot des Host-Agenten | `/monitor/status.json` |
| `APP_VERSION` | Image-Tag für Docker Compose | `latest` |
| `NETFLIX_DEPLOY_PASSWORD` | Optionales SSH-Passwort für `deploy.ps1` | nicht gesetzt |

In Produktion liest Docker Compose die Anwendungsvariablen aus:

```text
/root/netflix-secrets/app.env
```

Empfohlene Berechtigungen auf dem Zielsystem:

```bash
chmod 600 /root/netflix-secrets/app.env
```

Secrets gehören weder in `docker-compose.yml` noch in das Docker-Image, die
README, Shell-Skripte oder Git.

## Verfügbare Befehle

| Befehl | Zweck |
| --- | --- |
| `corepack yarn dev` | Entwicklungsserver starten |
| `corepack yarn build` | Produktions-Build erstellen |
| `corepack yarn start` | gebaute Anwendung starten |
| `corepack yarn lint` | ESLint ausführen |
| `corepack yarn test` | Jest-Testläufe ausführen |
| `corepack yarn test:watch` | Jest im Watch-Modus starten |
| `corepack yarn test:coverage` | LCOV-Coverage erzeugen |
| `corepack yarn prisma generate` | Prisma Client erzeugen |
| `corepack yarn prisma db push` | Schema ohne Datenbank-Reset synchronisieren |

## Tests und Qualitätsprüfung

Vor einem Release sollten mindestens diese Prüfungen erfolgreich sein:

```powershell
corepack yarn lint
corepack yarn test
corepack yarn test:coverage
corepack yarn build
python -m unittest discover -s ansible/tests -p "test_*.py"
```

Der LCOV-Bericht wird unter `coverage/lcov.info` erzeugt und von SonarQube
eingelesen. Generierte Coverage-Dateien werden nicht committed.

### SonarQube

URL und Token sind Pflichtparameter. Den Token verdeckt einlesen und anschließend
als Variable übergeben:

```powershell
$sonarToken = Read-Host "SonarQube Token" -MaskInput
.\sonar.ps1 -SonarHostUrl "https://sonarqube.example.com" -Token $sonarToken
$sonarToken = $null
```

Serveradresse und Token werden nicht im Skript oder Repository gespeichert. Der
Token wird im PowerShell-Skript nur für den Scanner-Prozess vorübergehend als
Umgebungsvariable gesetzt und danach wieder entfernt beziehungsweise auf den
vorherigen Wert zurückgesetzt. Vor der Analyse führen beide Skripte automatisch
Jest aus und erzeugen einen aktuellen `coverage/lcov.info`-Bericht. Bei einem
fehlgeschlagenen Test wird SonarQube nicht gestartet.

Unter Linux beziehungsweise WSL:

```bash
read -rsp "SonarQube Token: " sonar_token
echo
./sonar.sh https://sonarqube.example.com "$sonar_token"
unset sonar_token
```

Den Token nicht als Klartext in den Befehl schreiben, da er sonst in der
Shell-Historie landen kann.

Offene Issues und den Quality Gate prüfen:

```powershell
sonar list issues -p netflix --statuses OPEN,CONFIRMED
sonar api get "/api/qualitygates/project_status?projectKey=netflix"
```

Falls `node_modules\.bin\sonar-scanner-npm.cmd` fehlt:

```powershell
corepack yarn install --frozen-lockfile --production=false
```

## Docker

Das Multi-Stage-Dockerfile verwendet `node:22-slim`, installiert OpenSSL für
Prisma und übernimmt nur die für den Betrieb benötigten Artefakte. Tests,
Quellcode-Caches, lokale Medien und Entwicklungsabhängigkeiten gelangen nicht in
das finale Image.

### Image manuell bauen

```powershell
docker build -t netflix-clone .
docker tag netflix-clone salkin263/netflix-clone:1.9.3
docker push salkin263/netflix-clone:1.9.3
```

Alternativ übernimmt `docker-build.ps1` Version, Tag und Push automatisch aus
`package.json`:

```powershell
.\docker-build.ps1
```

### Container manuell starten

Die mitgelieferte `docker-compose.yml` ist auf den produktiven LXC zugeschnitten.
Sie erwartet die externe Env-Datei und folgende Host-Verzeichnisse:

```text
/movies
/series
/var/lib/netflix-monitor
/var/lib/netflix-backup-status
```

Start mit einem konkreten Image-Tag:

```bash
APP_VERSION=1.9.3 docker compose up -d
```

Beim Containerstart führt das Image `prisma db push` aus und startet anschließend
Next.js. Der Docker-Healthcheck ruft alle 30 Sekunden `/api/health` auf.

## Empfohlenes Deployment mit Ansible

Das normale Deployment baut und pusht das Image und aktualisiert danach den
Ziel-LXC:

```powershell
.\deploy.ps1
```

Vor dem ersten Deployment:

1. Docker Desktop starten und bei Docker Hub anmelden.
2. `ansible/hosts` auf die korrekte LXC-Adresse einstellen.
3. `/root/netflix-secrets/app.env` auf dem Zielsystem anlegen.
4. Sicherstellen, dass `/movies` und `/series` verfügbar und beschreibbar sind.
5. SSH-Zugriff und Ansible testen.

Das SSH-Passwort kann verdeckt für die aktuelle Sitzung gesetzt werden:

```powershell
$env:NETFLIX_DEPLOY_PASSWORD = Read-Host "LXC SSH password" -MaskInput
.\deploy.ps1
Remove-Item Env:NETFLIX_DEPLOY_PASSWORD
```

Wenn das Image bereits gebaut und gepusht wurde:

```powershell
.\deploy.ps1 -SkipDocker
```

Der Image-Tag wird immer aus `package.json` gelesen. Das Playbook:

1. installiert beziehungsweise aktualisiert den Monitoring-Agenten,
2. prüft Docker-Hub- und CloudFront-DNS,
3. lädt und verifiziert das neue Image vollständig,
4. stoppt erst danach den alten Container,
5. startet die erwartete Version,
6. prüft `/api/health`,
7. validiert Container und Image im Monitoring-Snapshot und
8. entfernt erst nach erfolgreichem Start ungenutzte Docker-Layer.

Weitere Details stehen in [ansible/README.md](ansible/README.md).

## Healthcheck und Systemübersicht

### Application Health

Der öffentliche, nicht gecachte Healthcheck steht unter:

```text
GET /api/health
```

Beispiel:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

Er liefert HTTP `200`, wenn Anwendung und Datenbank bereit sind, andernfalls
HTTP `503`. Ansible vergleicht zusätzlich die gemeldete Version mit dem erwarteten
Image-Tag.

### System Overview

Die Admin-Seite `/admin/system` aktualisiert sich automatisch und zeigt:

- Hostname, Plattform, Architektur und Uptime
- CPU-Auslastung und Load Average
- Arbeitsspeicher und Swap
- Belegung von `/`, `/movies` und `/series`
- Docker-Status, Healthcheck, Neustarts, Image und Container-Ressourcen
- Datenbankstatus und Abfragelatenz
- Alter, Größe und Datensatzanzahl des letzten Backups

Der systemd-Timer erfasst alle 30 Sekunden ausschließlich lesend Host- und
Docker-Metriken und schreibt einen atomaren Snapshot nach:

```text
/var/lib/netflix-monitor/status.json
```

Dieser Pfad wird schreibgeschützt als `/monitor` in den Webcontainer eingehängt.
Der Docker-Socket wird nicht in die Anwendung gemountet.

```mermaid
flowchart LR
    A["systemd monitoring agent"] --> B["/var/lib/netflix-monitor/status.json"]
    B -->|read-only mount| C["Next.js admin API"]
    C --> D["/admin/system"]
```

Die wichtigsten Warnschwellen:

| Prüfung | Warnung | Kritisch |
| --- | ---: | ---: |
| CPU oder RAM | ab 85 % | ab 95 % |
| Freier Speicher | höchstens 20 % | höchstens 10 % |
| Snapshot-Alter | über 60 Sekunden | über 120 Sekunden |
| Backup-Alter | über 3 Tage | über 7 Tage |
| Datenbanklatenz | ab 500 ms | ab 1.000 ms |

Fehlende Mounts, nicht beschreibbare Medienpfade, ein gestoppter oder unhealthy
Container und eine nicht erreichbare Datenbank werden als kritisch bewertet.

## Backups und Wiederherstellung

Unter `/admin/backups` können Administratoren:

- ein verschlüsseltes Datenbank-Backup als `.nfbak` herunterladen,
- ein Backup nach Passwort- und Dateiprüfung wiederherstellen und
- den Zeitpunkt des letzten erfolgreichen Backups in der Systemübersicht sehen.

Die Wiederherstellung akzeptiert Dateien bis 100 MB und verlangt eine zusätzliche
Bestätigung. Das Backup-Passwort wird nicht in den Monitoring-Metadaten
gespeichert.

Die Metadaten enthalten ausschließlich Zeitpunkt, Dateigröße und Datensatzanzahl
und liegen auf dem Host unter:

```text
/var/lib/netflix-backup-status/last-backup.json
```

Die Datenbank-Backups enthalten keine Film- oder Serien-Dateien. `/movies` und
`/series` müssen separat gesichert werden.

## Versionierung und Releases

Die kanonische Version steht in `package.json`. Docker- und
Ansible-Skripte lesen sie automatisch von dort.

Für ein neues Release:

1. Version in `package.json` erhöhen.
2. Änderungen unter `## [current]` in `CHANGELOG.md` dokumentieren.
3. Tests, Coverage, Lint und Build ausführen.
4. SonarQube analysieren und den Quality Gate prüfen.
5. `.\deploy.ps1` ausführen.
6. `/api/health` und `/admin/system` kontrollieren.

Der Changelog ist in der Anwendung unter `/changelog` verfügbar. Das Dockerfile
kopiert `CHANGELOG.md` ausdrücklich in das finale Image.

## Projektstruktur

```text
actions/                    Server Actions
app/                        Next.js App Router, Seiten und API-Routen
components/                 Wiederverwendbare React-Komponenten
data/                       Datenzugriffsfunktionen
hooks/                      React Hooks
lib/                        Auth-, Datenbank-, Backup- und Monitoring-Logik
prisma/                     Schema und Migrationen
public/                     Statische Dateien
schemas/                    Zod-Schemas
ansible/                    Deployment und LXC-Monitoring
vendor/                     Lokale Dependency-Kompatibilität
CHANGELOG.md                Release-Historie
dockerfile                  Multi-Stage-Produktionsimage
docker-compose.yml          LXC-Containerkonfiguration
deploy.ps1                  Build, Push und Ansible-Deployment
```

## Fehlerbehebung

### Prisma meldet eine fehlende Spalte

Prüfe zuerst, ob tatsächlich das neue Image läuft, und führe das normale
Deployment erneut aus. Das Image synchronisiert das Schema beim Start mit
`prisma db push`. Verwende keinen erzwungenen Reset.

### Prisma kann OpenSSL nicht erkennen

Das mitgelieferte Dockerfile installiert OpenSSL bereits. Tritt der Fehler auf,
läuft wahrscheinlich ein älteres oder selbst gebautes Image. Image neu bauen,
pushen und deployen.

### Docker Pull endet mit einem DNS-Timeout

Namensauflösung auf dem LXC prüfen:

```bash
getent ahosts registry-1.docker.io
getent ahosts production.cloudfront.docker.com
```

Das Ansible-Playbook wiederholt DNS- und Pull-Prüfungen automatisch und stoppt den
laufenden Container erst nach einem erfolgreichen Pull.

### `http://netflix:3000` ist nicht erreichbar

Wenn der Zugriff über die IP funktioniert, ist Docker in Ordnung. Dann muss der
Hostname `netflix` auf dem Client auf die LXC-IP zeigen. Zusätzlich muss
`AUTH_URL` dieselbe öffentliche Adresse verwenden.

### Changelog fehlt im Container

Ein Image aus dem aktuellen Dockerfile bauen. `CHANGELOG.md` wird ausdrücklich in
die Runtime-Stage kopiert; ein alter Image-Layer enthält diese Korrektur eventuell
noch nicht.

### Systemübersicht meldet einen fehlenden Agenten

Auf dem LXC prüfen:

```bash
systemctl status netflix-monitor.timer
systemctl status netflix-monitor.service
cat /var/lib/netflix-monitor/status.json
```

Das normale Ansible-Deployment installiert den Service, aktiviert den Timer und
erzeugt sofort einen ersten Snapshot.

## Sicherheit

- Admin-Seiten und Admin-APIs prüfen die Administratorrolle serverseitig.
- Upload-Pfade, Dateitypen, Größen und Chunk-Parameter werden validiert.
- Nicht veröffentlichte Inhalte können von normalen Benutzern nicht gestreamt werden.
- Produktions-Secrets liegen außerhalb des Repositorys und Docker-Images.
- Backups werden vor dem Download verschlüsselt.
- Der Monitoring-Agent arbeitet lesend und gibt dem Webcontainer keinen Zugriff
  auf den Docker-Socket.
- `.env`, lokale Medien, Logs, Coverage und Build-Artefakte werden ignoriert.

## Changelog

Alle Änderungen stehen in [CHANGELOG.md](CHANGELOG.md).
