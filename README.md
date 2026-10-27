# Netflix Clone

Eine selbst gehostete Streaming-Anwendung für Filme und Serien mit Benutzerprofilen,
Wiedergabefortschritt und einem umfangreichen Administrationsbereich.

Aktuelle Version: **1.14.2**

## Funktionsumfang

### Streaming und Benutzer

- Anmeldung und Registrierung mit Auth.js
- Widerrufbare JWT-Sitzungen mit gerätebezogener Abmeldung
- Datenschutzfreundliche Sicherheitsaktivitäten mit 90 Tagen Aufbewahrung
- Passwort-, E-Mail-, MFA- und Kontosperränderungen widerrufen betroffene Sitzungen
- Mehrere Profile pro Benutzerkonto
- Filme, Serien, Suche, Favoriten und Watchlist
- „Continue Watching“ mit gespeichertem Wiedergabefortschritt
- Wiedergabeverlauf und zufällige Wiedergabe
- Byte-Range-Streaming für Player und Billboard-Videos
- Eigener Videoplayer mit Titelanzeige, Playlist-Warteschlange, Autoplay-Countdown,
  Tastatursteuerung, Vollbild und Bild-in-Bild; siehe [Player-Bedienung](docs/custom-video-player.md)
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
- Kategorien anlegen, umbenennen und Filmen sowie Serien mehrfach zuordnen
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
| Kategorien | `/admin/categories` |
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

## Lokal mit Docker Compose starten

Voraussetzung: Docker Desktop mit Linux-Containern und Docker Compose.
Die separate Datei `compose.local.yml` baut die App aus dem aktuellen Quellcode
und startet PostgreSQL, Redis, den Hintergrund-Worker und Mailpit für lokale
Auth-E-Mails. Es werden keine Zugangsdaten oder Dienste der Serverumgebung benötigt.

Einmalig im Projektverzeichnis lokale Zufallswerte erzeugen (PowerShell):

```powershell
docker run --rm node:22-slim node -e "const c = require('node:crypto'); console.log('LOCAL_DATABASE_PASSWORD=' + c.randomBytes(32).toString('hex')); console.log('LOCAL_AUTH_SECRET=' + c.randomBytes(32).toString('hex'))" | Out-File -Encoding ascii .env.docker.local
```

Die Datei `.env.docker.local` wird von Git ignoriert. Behalte sie bei weiteren
Starts bei, damit Datenbankpasswort und Sitzungsschlüssel stabil bleiben.
Anschließend starten:

```powershell
docker compose --env-file .env.docker.local -f compose.local.yml up -d --build
docker compose --env-file .env.docker.local -f compose.local.yml ps -a
```

Der erste Build kann mehrere Minuten dauern. Der Dienst `init` bereitet vor
dem Start von App und Worker das lokale Prisma-Schema und die Job-Queue vor.
Für diese isolierte lokale Datenbank wird `prisma db push` ohne Reset oder
`--accept-data-loss` verwendet; die Produktionsmigrationen bleiben unverändert.
`init` mit Status `Exited (0)` ist nach erfolgreicher Vorbereitung normal.

- Anwendung: [http://localhost:3000](http://localhost:3000)
- Lokales Postfach: [http://localhost:8025](http://localhost:8025)

Beim Start werden automatisch lokale Beispieldaten ergänzt:

- Zwei bestätigte Konten: `admin@netflix.test` (Admin) und `user@netflix.test` (Benutzer).
- Je ein Profil mit Favoriten, Watchlist, Playlist und Wiedergabefortschritt.
- 16 Titel (10 Filme und 6 Serien), davon 14 veröffentlicht, ein Entwurf und ein archivierter Titel.
- Vier Schauspieler und synthetische, zwölf Sekunden lange Testvideos mit Ton.
- Vier mit Imagegen erzeugte Profilbilder: Fuchs, Eule, Panda und Astronaut.
  Die Dateien liegen unter `public/images/profil/generated/` und werden ohne
  weitere Bildgenerierung beim Start in die Bildauswahl aufgenommen. Das
  Admin-Demoprofil erhält den Fuchs, das Benutzer-Demoprofil die Eule. Bereits
  vorhandene Demo-Profile mit dem ursprünglichen blauen Standardbild werden
  aktualisiert; selbst gewählte Bilder bleiben erhalten.
  [Generierungs-Prompts](docs/generated-profile-avatars.md).

Die Passwörter werden installationsabhängig aus dem lokalen Sitzungsschlüssel
abgeleitet. Zugangsdaten anzeigen:

```powershell
docker compose --env-file .env.docker.local -f compose.local.yml run --rm --no-deps seed node scripts/seed-local.mjs --credentials
```

Der Seed läuft ausschließlich mit `DEPLOYMENT_ENVIRONMENT=local` gegen
`netflix_local`. Er ergänzt fehlende Datensätze und überschreibt keine bestehenden
Konten, Passwörter oder bearbeiteten Inhalte. Die beiden Dateien `local-demo.mp4`
werden bei jedem Start der Medieninitialisierung neu erzeugt. Die Dienste `seed`
und `seed-media` enden nach erfolgreichem Durchlauf mit `Exited (0)`.
Manuell erneut seeden:

```powershell
docker compose --env-file .env.docker.local -f compose.local.yml run --rm --no-deps seed
```

Du kannst auch ein eigenes Benutzerkonto registrieren und dessen Bestätigungslink
in Mailpit öffnen. Alle ausgehenden Auth-E-Mails landen dort und werden nicht
ins Internet versandt. Für Administratorrechte nach der Registrierung
(E-Mail-Adresse ersetzen):

```powershell
'UPDATE "User" SET role = ''ADMIN'' WHERE email = ''deine-adresse@example.com'';' | docker compose --env-file .env.docker.local -f compose.local.yml exec -T database psql -U netflix -d netflix_local
```

Danach abmelden und erneut anmelden. Weitere Inhalte
können über den Administrationsbereich angelegt werden. Filme, Serien, Logs und
Datenbank liegen in eigenen Docker-Volumes. Mediendateien lassen sich beispielsweise
mit `docker compose --env-file .env.docker.local -f compose.local.yml cp ./film.mp4 app:/movies/film.mp4`
kopieren. App und Worker sehen dieselben Medienverzeichnisse.
Die servergebundenen Monitoring-, Deployment- und Backup-Funktionen benötigen
weiterhin die entsprechende Host-Infrastruktur.

Logs anzeigen und Stack stoppen:

```powershell
docker compose --env-file .env.docker.local -f compose.local.yml logs -f app jobs-worker init
docker compose --env-file .env.docker.local -f compose.local.yml down
```

`down` behält die Daten bei. `down -v` löscht sämtliche lokalen Daten und Medien
dieses Stacks. Die bestehende `docker-compose.yml` bleibt für das Serverdeployment.

### Kategorien und lokale Daten

Kategorien werden manuell angelegt und Filmen oder Serien zugewiesen. Jede
Kategorie hat einen deutschen Namen (`name`) und einen englischen Namen
(`nameEn`) unter derselben ID. Die Oberfläche verwendet die gewählte Sprache.
Die Kategorienverwaltung bietet JSON-Export und Import mit Vorschau und
Bestätigung. Bestehende IDs und Inhaltszuordnungen bleiben beim Import erhalten;
es werden keine Kategorien gelöscht.

Die KI-gestützte Videoanalyse einschließlich Modellserver, externer
Modellanbindung, automatischer Übersetzung, Vergleichsläufen und der
Beispielmarkierung wurde entfernt. Es werden keine Bilder mehr für eine
Kategorisierung an Modelle übermittelt. Bereits gespeicherte Analyse- und
Beispieldaten bleiben ausschließlich als Altbestand in der Datenbank; die
Anwendung bietet dafür keine Oberfläche oder API mehr. Noch offene alte
Analyseaufträge werden beim Aktualisieren der Job-Warteschlangen abgebrochen.

Die frühere `.env.video-analysis.local` wird von der Anwendung und Docker nicht
mehr geladen. Die lokale Veröffentlichungsprüfung kann sie weiterhin verwenden,
um private Begriffe vor einem Push zu erkennen:
`node scripts/check-local-privacy.mjs --require-local-config`.
Private Umgebungsdateien, Sicherungen unter `.local-private/` und Exporte
(`video-examples-*.json`, `categories-export*.json`) bleiben von Git und
Docker-Images ausgeschlossen. Bestehende Modellgewichte werden nicht automatisch
gelöscht; der lokale Stack startet keinen Modelldienst mehr.

## Lokale Einrichtung ohne Docker

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
AUTH_TRUSTED_PROXY_HOPS=0
AUTH_PUBLIC_URL=http://localhost:3000
AUTH_MAIL_HOST=smtp.example.com
AUTH_MAIL_PORT=587
AUTH_MAIL_SECURE=false
AUTH_MAIL_USER=REPLACE_WITH_SMTP_USER
AUTH_MAIL_PASSWORD=REPLACE_WITH_SMTP_PASSWORD
AUTH_MAIL_FROM=Netflix Clone <auth@example.com>
AUTH_MAIL_LOCALE=en
AUTH_PASSKEYS_ENABLED=false
# Required only when the feature-flagged passkey pilot is enabled:
# AUTH_WEBAUTHN_RP_ID=localhost
# AUTH_WEBAUTHN_RP_NAME=Netflix Clone
# AUTH_WEBAUTHN_ORIGIN=http://localhost:3000
NEXT_PUBLIC_GENRE=Action,Comedy,Drama
```

Je nach aktivierter Anmeldung und Mail-Konfiguration werden weitere Provider- oder
SMTP-Variablen benötigt. Übernimm dafür die Namen aus deiner bestehenden
Betriebsumgebung, aber niemals deren Werte in das Repository.

`AUTH_URL` muss exakt der Adresse entsprechen, über die die Anwendung aufgerufen
wird. Lokal ist das `http://localhost:3000`. Das Ansible-Deployment setzt für
die LXCs automatisch `http://netflix` beziehungsweise
`http://netflix-staging`; diese Namen müssen auf dem Client per lokalem DNS
oder Hosts-Datei auflösbar sein.

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
| `AUTH_TRUSTED_PROXY_HOPS` | Anzahl der tatsächlich vorgeschalteten, vertrauenswürdigen Reverse-Proxys für die IP-basierte Anmeldedrosselung | `0` |
| `AUTH_PUBLIC_URL` | Validierte öffentliche Basisadresse für Links in Auth-E-Mails | erforderlich für Auth-E-Mails |
| `AUTH_MAIL_HOST` | SMTP-Hostname | erforderlich für Auth-E-Mails |
| `AUTH_MAIL_PORT` | SMTP-Port, beispielsweise `587` | erforderlich für Auth-E-Mails |
| `AUTH_MAIL_SECURE` | Direkte TLS-Verbindung (`true`/`false`) | erforderlich für Auth-E-Mails |
| `AUTH_MAIL_USER` | Optionaler SMTP-Benutzer; nur zusammen mit Passwort | nicht gesetzt |
| `AUTH_MAIL_PASSWORD` | Optionales SMTP-Passwort; nur zusammen mit Benutzer | nicht gesetzt |
| `AUTH_MAIL_FROM` | Absenderadresse oder Name mit Adresse | erforderlich für Auth-E-Mails |
| `AUTH_MAIL_LOCALE` | Sprache der Auth-E-Mails (`en` oder `de`) | `en` |
| `AUTH_PASSKEYS_ENABLED` | Aktiviert den experimentellen Passkey-Pilot | `false` |
| `AUTH_WEBAUTHN_RP_ID` | Stabile WebAuthn-Domain ohne Schema oder Port | erforderlich bei aktiviertem Pilot |
| `AUTH_WEBAUTHN_RP_NAME` | Im Authenticator angezeigter Dienstname | erforderlich bei aktiviertem Pilot |
| `AUTH_WEBAUTHN_ORIGIN` | Exakter kanonischer Ursprung aus Schema, Host und optionalem Port | erforderlich bei aktiviertem Pilot |
| `NEXT_PUBLIC_GENRE` | Kommagetrennte Allowlist der in Add/Edit auswählbaren Genres | in Produktion erforderlich |
| `SYSTEM_MONITOR_PATH` | Pfad zum JSON-Snapshot des Host-Agenten | `/monitor/status.json` |
| `DEPLOYMENT_STATUS_ROOT` | Read-only Wurzel für signierte Deployment Records | `/deployment-status` |
| `DEPLOYMENT_STATUS_APPROVED_PEERS` | Kommagetrennte, explizit freigegebene Peer-Umgebungen | nicht gesetzt |
| `APP_VERSION` | Image-Tag für Docker Compose | `latest` |
| `NETFLIX_DEPLOY_PASSWORD` | Optionales SSH-Passwort für `deploy.ps1` | nicht gesetzt |

In Produktion liest Docker Compose die Anwendungsvariablen aus:

```text
/root/netflix-secrets/app.env
```

`NEXT_PUBLIC_GENRE` wird zur Laufzeit aus dieser Datei gelesen. Leerzeichen
werden entfernt und doppelte Einträge zusammengeführt. Ist die Variable in
Produktion leer oder nicht gesetzt, bleibt die Genre-Auswahl deaktiviert und
Add-/Update-Anfragen werden serverseitig abgelehnt.

Empfohlene Berechtigungen auf dem Zielsystem:

```bash
chmod 600 /root/netflix-secrets/app.env
```

Secrets gehören weder in `docker-compose.yml` noch in das Docker-Image, die
README, Shell-Skripte oder Git.

Der Auth-Mailer wird erst beim Versand initialisiert, validiert alle oben
genannten Werte und wartet auf die SMTP-Bestätigung. Die früheren Variablen
`NODEMAILER_EMAIL`, `NODEMAILER_PW` und die fest codierte Gmail-Konfiguration
werden nicht mehr verwendet. Für Produktion muss `AUTH_PUBLIC_URL` eine stabile
kanonische HTTP-Adresse enthalten.

Anmelde-Limits werden in PostgreSQL gespeichert und gelten dadurch über Neustarts
und mehrere App-Instanzen hinweg. `AUTH_TRUSTED_PROXY_HOPS` bleibt bei direktem
Zugriff auf `0`. Hinter genau einem kontrollierten Reverse-Proxy wird es auf `1`
gesetzt. Ein höherer Wert als die echte Proxy-Kette kann gefälschte
`X-Forwarded-For`-Werte wieder vertrauenswürdig erscheinen lassen.

### Experimenteller Passkey-Pilot

Passkeys sind in 1.11 standardmäßig ausgeschaltet. Auth.js kennzeichnet seine
Passkey-Unterstützung weiterhin als experimentell; aktiviere den Pilot deshalb
zuerst nur in Staging und für Test- oder Administratorkonten. Die Anwendung
erlaubt ausschließlich bereits registrierten, bestätigten und nicht gesperrten
Konten einen Passkey. Passwortanmeldung, MFA und E-Mail-Wiederherstellung bleiben
parallel verfügbar.

WebAuthn/Passkeys bleiben im Code für spätere sichere Umgebungen vorhanden, sind
im HTTP-LAN-Deployment aber deaktiviert. Passwortanmeldung und MFA bleiben
verfügbar.

```dotenv
AUTH_PASSKEYS_ENABLED=false
AUTH_WEBAUTHN_RP_NAME=Netflix Clone Staging
```

Das Aktivieren erfordert die Migration `20260812183000_add_passkeys`. Die
Einstellungen verlangen vor Hinzufügen, Umbenennen oder Entfernen erneut das
aktuelle Passwort; die Freigabe ist an die aktive Serversitzung gebunden und
läuft nach fünf Minuten ab. Der letzte nutzbare Anmeldeweg kann nicht entfernt
werden.

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
| `corepack yarn test:auth-integration` | Auth-/MFA-/Session-/Passkey-Persistenz gegen die isolierte Staging-Datenbank prüfen |
| `corepack yarn test:admin-audit-integration` | Audit-Persistenz, parallele Writes und Retention gegen die isolierte Staging-Datenbank prüfen |
| `corepack yarn test:e2e` | Gesamte Playwright-Matrix ausführen |
| `corepack yarn test:e2e:desktop` | Playwright nur mit Desktop Chrome ausführen |
| `corepack yarn test:e2e:mobile` | Playwright nur mit dem Pixel-7-Projekt ausführen |
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

### Playwright-End-to-End-Tests

Die Browser-Tests verwenden Desktop Chrome und ein mobiles Pixel-7-Profil. Sie
dürfen nur gegen eine lokale, isolierte Testdatenbank laufen, niemals gegen
Produktionsdaten. Installiere Chrome für Playwright einmalig mit:

```powershell
corepack yarn playwright install chrome
```

Kopiere anschließend `.env.e2e.example` nach `.env.e2e.local` und hinterlege
zwei dedizierte lokale Accounts:

- ein normaler Benutzer und ein Administrator;
- bestätigte E-Mail-Adressen und deaktivierte Zwei-Faktor-Authentifizierung;
- mindestens ein auswählbares Profil pro Account;
- mindestens ein Katalogeintrag mit tatsächlich vorhandener Videodatei für den
  Playback-Test.

`.env.e2e.local`, gespeicherte Browser-Sitzungen, Traces, Screenshots und der
HTML-Bericht werden von Git ignoriert. Zugangsdaten erscheinen weder in Tests
noch in Testausgaben.

Playwright kann den Entwicklungsserver selbst starten:

```powershell
corepack yarn test:e2e
```

Für einen bereits laufenden Entwicklungs- oder Produktionsbuild:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3000"
$env:PLAYWRIGHT_EXTERNAL_SERVER = "true"
corepack yarn test:e2e
Remove-Item Env:PLAYWRIGHT_EXTERNAL_SERVER
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

MFA- und Passkey-Szenarien verändern ausschließlich deterministische
Testzustände. Dafür muss `.env.e2e.local` zusätzlich `E2E_DATABASE_URL` mit der
Datenbank der aufgerufenen Staging-Instanz enthalten. Vor jeder direkten
Datenbankänderung prüft Playwright `/api/health`, lehnt Produktion grundsätzlich
ab und verlangt einen Datenbanknamen mit `stage` oder `staging`. So können ein
lokaler Prisma-Client und eine entfernte Staging-Weboberfläche nicht
versehentlich unterschiedliche Datenbanken verändern.

Die Tests bereiten User- und Admin-Sitzungen einmalig und seriell vor; die
eigentlichen Desktop-/Mobil-Szenarien laufen parallel. Actor- und Content-Flows
verwenden eindeutige Namen und entfernen ihre Datensätze auch bei einem
Abbruch. Settings werden nur lokal geändert und zurückgesetzt. Die
Backup-Szenarien prüfen ausschließlich die Formularvalidierung und senden
keinen `POST`- oder `PUT`-Request an die Backup-API.

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
docker tag netflix-clone salkin263/netflix-clone:1.11.0
docker push salkin263/netflix-clone:1.11.0
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
LAN_HOST=netflix APP_VERSION=1.13.1 docker compose up -d
```

Das Image verändert die Datenbank beim Containerstart nicht selbst. Das
empfohlene Ansible-Deployment erstellt zuerst ein geprüftes Backup, führt danach
`prisma migrate deploy` aus und startet anschließend Next.js. Bei einem manuellen
Compose-Start müssen ausstehende Migrationen daher vorab angewendet werden. Der
Docker-Healthcheck ruft alle 30 Sekunden `/api/health` auf. Das manuelle Compose-
Setup verwendet ebenfalls Caddy als HTTP-Reverse-Proxy auf Port 80.

## Empfohlenes Deployment mit Ansible

Das normale Deployment baut und pusht das Image und aktualisiert danach die
Staging-Umgebung. Staging ist bewusst das Standardziel:

```powershell
.\deploy.ps1
```

Vor dem ersten Deployment:

1. Docker Desktop starten und bei Docker Hub anmelden.
2. Einen neuen, isolierten Staging-LXC vorbereiten.
3. `ansible/.env.staging` mit LXC-Adresse und `LAN_HOST=netflix-staging`
   anlegen; Produktion verwendet `LAN_HOST=netflix`.
4. Auf jedem LXC `/etc/netflix-clone/environment` auf `staging` beziehungsweise
   `production` setzen.
5. Für Staging eine eigene Datenbank und eine eigene
   `/root/netflix-secrets/app.env` verwenden; die Datenbank muss `staging` oder
   `stage` im Namen tragen und die Datei `DEPLOYMENT_ENVIRONMENT=staging`
   enthalten.
6. `.env.e2e.local` als root-eigene Datei mit Modus `0600` nach
   `/root/netflix-secrets/staging-users.env` kopieren. Daraus legt Ansible nach
   den Migrationen automatisch den bestätigten Testbenutzer, den Admin und ihre
   Profile an. Zusätzlich werden ein deterministischer Testkatalog und echte,
   kurze H.264/AAC-Videos in den isolierten Medien-Mounts erzeugt; die Secret-Datei
   wird nicht an den laufenden App-Container übergeben.
7. Sicherstellen, dass `/movies` und `/series` verfügbar und beschreibbar sind.
8. SSH-Zugriff und Ansible testen.

Das SSH-Passwort kann verdeckt für die aktuelle Sitzung gesetzt werden:

```powershell
$env:NETFLIX_DEPLOY_PASSWORD = Read-Host "LXC SSH password" -MaskInput
.\deploy.ps1
Remove-Item Env:NETFLIX_DEPLOY_PASSWORD
```

Nach einem erfolgreichen Staging-Deployment wird dieselbe Version ohne neuen
Build ausdrücklich für Produktion freigegeben:

```powershell
.\deploy.ps1 -Environment Production -SkipDocker -ConfirmProduction
```

Ohne erfolgreichen Staging-Nachweis derselben Version lehnt das Skript das
Produktions-Deployment ab. Die vollständige Einrichtung steht in
[docs/deployment/staging.md](docs/deployment/staging.md).

Der Image-Tag wird immer aus `package.json` gelesen. Das Playbook:

1. installiert beziehungsweise aktualisiert den Monitoring-Agenten,
2. prüft Docker-Hub- und CloudFront-DNS,
3. lädt und verifiziert das neue Image vollständig,
4. stoppt erst danach den alten Container,
5. startet die erwartete Version,
6. prüft `/api/health` zuerst lokal und danach über das kanonische HTTP-Ziel,
7. validiert Container und Image im Monitoring-Snapshot und
8. veröffentlicht atomar den host-signierten Deployment Record und
9. entfernt erst nach erfolgreichem Start ungenutzte Docker-Layer.

Weitere Ansible-Details stehen in [ansible/README.md](ansible/README.md).
Das privacy-sichere Auth-Logformat, Retention und die Staging-Fehlerübungen sind
in
[`docs/operations/authentication-telemetry.md`](docs/operations/authentication-telemetry.md)
dokumentiert.

## Healthcheck und Systemübersicht

### Application Health

Der öffentliche, nicht gecachte Healthcheck steht unter:

```text
GET /api/health
```

Lokales Diagnosebeispiel auf dem LXC:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

Der normale externe Aufruf erfolgt über `http://netflix/api/health` oder
`http://netflix-staging/api/health`. Port 3000 bleibt direkt auf dem LXC
beschränkt; der LAN-Zugriff läuft über den HTTP-Reverse-Proxy auf Port 80.

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
- signierte Deployment-, Migrations-, Health- und Rollback-Ergebnisse für die
  lokale und ausdrücklich freigegebene Peer-Umgebung

Der systemd-Timer erfasst alle 30 Sekunden ausschließlich lesend Host- und
Docker-Metriken und schreibt einen atomaren Snapshot nach:

```text
/var/lib/netflix-monitor/status.json
```

Dieser Pfad wird schreibgeschützt als `/monitor` in den Webcontainer eingehängt.
Der Docker-Socket wird nicht in die Anwendung gemountet.

Deployment Records werden mit einem ausschließlich auf dem LXC vorhandenen
Ed25519-Schlüssel signiert. Der Webcontainer erhält Statusdateien und öffentliche
Prüfschlüssel ausschließlich read-only. Manipulierte, veraltete und nicht
erreichbare Records werden getrennt dargestellt. Das Vertrauens-, Transport-
und Retentionsmodell steht in
[`docs/operations/deployment-status.md`](docs/operations/deployment-status.md).

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
- den letzten isolierten Restore-Test eines PostgreSQL-Deployment-Dumps prüfen,
- die Verifikation des neuesten Host-Dumps manuell anfordern und
- den Zeitpunkt des letzten erfolgreichen Backups in der Systemübersicht sehen.

Die Wiederherstellung akzeptiert Dateien bis 100 MB und verlangt eine zusätzliche
Bestätigung. Das Backup-Passwort wird nicht in den Monitoring-Metadaten
gespeichert.

Die Metadaten enthalten ausschließlich Zeitpunkt, Dateigröße und Datensatzanzahl
und liegen auf dem Host unter:

```text
/var/lib/netflix-backup-status/last-backup.json
/var/lib/netflix-backup-status/verification/latest.json
```

Vor jeder Migration stellt Ansible den PostgreSQL-Dump zusätzlich in einem
temporären PostgreSQL-Container ohne Netzwerk wieder her. Erst nach erfolgreicher
Archiv-, Versions-, Schema- und Stichprobenprüfung wird die Migration ausgeführt.
Der Webcontainer erhält weder Zugriff auf das Backup-Verzeichnis noch auf den
Docker-Socket. Details, Statuscodes und manuelle Diagnose stehen in
[`docs/operations/postgres-backup-verification.md`](docs/operations/postgres-backup-verification.md).

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

### `http://netflix` ist nicht erreichbar

Der Hostname `netflix` muss auf dem Client auf die Produktions-LXC-IP zeigen;
für Staging gilt entsprechend `netflix-staging`. Prüfe lokales DNS oder die
Hosts-Datei. Direkter LAN-Zugriff auf Port 3000 ist absichtlich gesperrt; der
Proxy muss auf Port 80 laufen.

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
- Deployment-Erfolg wird auf dem Host signiert; Browser und Webcontainer besitzen
  weder den privaten Signierschlüssel noch Schreibzugriff auf Deployment Records.
- `.env`, lokale Medien, Logs, Coverage und Build-Artefakte werden ignoriert.

## Changelog

Alle Änderungen stehen in [CHANGELOG.md](CHANGELOG.md).
