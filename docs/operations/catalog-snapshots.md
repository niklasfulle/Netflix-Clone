# Produktionskatalog nach Staging und lokal übertragen

Verfügbar ab Version **1.14.5**.

## Über die Administration

Unter **Administration → Katalog-Transfer** (`/admin/catalog-transfers`) sind
Export und Import ohne Kommandozeile möglich:

1. Auf Produktion **Export erstellen** wählen und nach Abschluss **JSON herunterladen**.
2. Die Seite auf Staging oder lokal öffnen, Datei auswählen und **Hochladen und Vorschau prüfen** wählen.
3. Importzahlen prüfen und den angezeigten Namen der Zieldatenbank eingeben.
4. **Katalog ersetzen und neu starten** starten. Der Host erzeugt zuerst die Ersatzmedien.
5. Anschließend stoppt er App und Worker, sichert und importiert die Daten und
   startet beide Dienste erneut. Erfolg wird erst nach dem Healthcheck angezeigt.

Die Seite hält den laufenden Auftrag auch über die Unterbrechung und einen
Browser-Reload hinweg fest und fragt den Status nach der Rückkehr automatisch
wieder ab. Datenbank, Redis und der Host selbst werden nicht neu gestartet.
Die separate SQL-Zielsicherung ist nach ihrer Erstellung über die Auftragshistorie
herunterladbar; sie enthält private Daten der Zielkonten und bleibt vertraulich.

Für die Funktion muss der aktualisierte Host-Dienst bereit sein. Auf Staging
und Produktion installiert das Ansible-Deployment `netflix-catalog-transfer.service`.
Lokal startet Compose den separaten Dienst `catalog-transfers`. Nur dieser
Host-Helfer hat Zugriff auf Docker; App und Worker erhalten keinen Docker-Socket.
Er führt ausschließlich feste Export-, Import- und App/Worker-Startbefehle aus
und prüft vor Änderungen die Umgebungsmarkierung der Anwendung. Auf Produktion
lehnt er Importanfragen unabhängig vom API-Schutz ab.

Während eines Transfers kein Deployment starten. Bei Fehlern den Transferstatus
und die Host-Ausgabe prüfen:

```bash
journalctl -u netflix-catalog-transfer.service -n 50 --no-pager
```

Lokal: `docker compose --env-file .env.docker.local -f compose.local.yml logs catalog-transfers`.
Transferdateien und Status liegen serverseitig unter `/var/lib/netflix-catalog-transfers`,
lokal im Compose-Volume `netflix-local_catalog-transfers`. Sie bleiben außerhalb
von Git und Images. Dateien werden für spätere Downloads und Rücksicherung
aufbewahrt; den Speicherbedarf dieses Verzeichnisses/Volumes berücksichtigen.

## CLI als Alternative

`node scripts/catalog-snapshot.js` exportiert den Katalog und importiert ihn in
eine isolierte Staging- oder lokale Datenbank. `--help` zeigt die CLI-Syntax.
Das Werkzeug ist im Anwendungsimage enthalten. Vor der ersten Nutzung muss die
Migration `20261030120000_catalog_snapshot_state` im Ziel angewendet sein.

## Umfang

Übertragen werden Filme und Serien, Status, Datumsangaben, Genres, Darsteller,
Kategorien mit deutschen/englischen Namen und Farben sowie globale Zuordnungen,
Kategorie-Zeitabschnitte und der manuelle Bearbeitungsstand. IDs bleiben erhalten.
Exakte Laufzeiten werden beim Export mit `ffprobe` aus den Quelldateien ermittelt.
Fehlende oder ungültige Quelldateien brechen den Export ab; Laufzeiten werden
nicht geschätzt. Unterstützt werden Videos bis 24 Stunden.

Nicht übertragen werden Konten, Passwörter, Tokens, Profile, Favoriten, Playlists,
Wiedergabeverläufe, Jobs, Servereinstellungen, externe Darsteller-Quelllinks,
Originaldateipfade und Originalbilder. Das ist ein Katalogtransfer, kein Ersatz
für das vollständige PostgreSQL-Backup.

Beim Import wird der Zielkatalog ersetzt. Konten und Profile im Ziel bleiben
erhalten. Persönliche Zuordnungen zu weiterhin vorhandenen Inhalts-IDs bleiben
erhalten; Verweise auf entfernte Inhalte werden bereinigt. Darsteller-Quelllinks
und alte Kategoriezuordnungen im Ziel werden ersetzt beziehungsweise entfernt.
Es gibt in dieser Version keinen Merge-Modus.

## Produktionskatalog exportieren

Auf dem Produktionshost im Verzeichnis mit der bereitgestellten Compose-Datei:

```bash
install -d -m 0700 -o 10001 -g 10001 /root/netflix-snapshots
docker compose run --rm --no-deps \
  -v /root/netflix-snapshots:/snapshots \
  app node scripts/catalog-snapshot.js export \
  --output /snapshots/catalog-snapshot-production.json
```

Der Datenbankzugriff erfolgt in einer konsistenten Read-only-Transaktion.
Die Videometadaten werden anschließend nur gelesen. Bestehende Exportdateien
werden nicht überschrieben; für jeden neuen Export einen neuen Dateinamen wählen.
Die Konsole zeigt nur Kennzahlen und technische IDs, keine Katalogtexte.

Die Datei anschließend privat übertragen, beispielsweise per SCP. Sie enthält
weiterhin echte Katalogtexte und gehört nicht in Git oder ein Containerimage.
Die Standardnamen `catalog-snapshot-*.json` und `catalog-snapshot-*.sql` sowie
`.local-private/` sind in Git und Docker-Builds ausgeschlossen.

## Lokale Vorschau

Die Datei im Checkout unter `.local-private/catalog-snapshots/` ablegen. In
PowerShell aus dem Projektverzeichnis:

```powershell
$snapshotDirectory = Join-Path (Get-Location) '.local-private/catalog-snapshots'
New-Item -ItemType Directory -Force -Path $snapshotDirectory | Out-Null
docker compose --env-file .env.docker.local -f compose.local.yml run --rm --no-deps `
  -v "${snapshotDirectory}:/snapshots" app node scripts/catalog-snapshot.js import `
  --input /snapshots/catalog-snapshot-production.json --target local
```

Ohne `--apply` werden weder Daten noch Medien geändert. Die Vorschau nennt die
Zieldatenbank, den bisherigen Inhaltsumfang, die Importzahlen, die Zahl der
Ersatzdateien und deren summierte Laufzeit. Die Laufzeitsumme ist keine Schätzung
der Generierungsdauer; Rechenzeit und Speicherbedarf hängen vom Katalog ab.

## Lokalen Import ausführen

Während des Imports App und Worker stoppen; Datenbank und Redis weiterlaufen
lassen. Für große Kataloge ausreichend Zeit und freien Platz einplanen.

```powershell
docker compose --env-file .env.docker.local -f compose.local.yml stop app jobs-worker
docker compose --env-file .env.docker.local -f compose.local.yml run --rm --no-deps `
  -v "${snapshotDirectory}:/snapshots" app node scripts/catalog-snapshot.js import `
  --input /snapshots/catalog-snapshot-production.json --target local `
  --apply --confirm netflix_local --backup /snapshots/catalog-snapshot-before-local.sql
```

Nur nach erfolgreichem Import wieder starten:

```powershell
docker compose --env-file .env.docker.local -f compose.local.yml up -d --no-deps app jobs-worker
```

Die Datenbank muss tatsächlich `netflix_local` heißen und die Anwendung muss
`DEPLOYMENT_ENVIRONMENT=local` verwenden. Ein Import nach Produktion wird schon
vor dem Öffnen der Datei und vor dem Datenbankzugriff abgelehnt.

## Staging importieren

Auf dem Staginghost die Datei nach `/root/netflix-snapshots/` übertragen und das
Verzeichnis für UID/GID 10001 zugänglich machen. Im Compose-Verzeichnis:

```bash
docker compose run --rm --no-deps -v /root/netflix-snapshots:/snapshots \
  app node scripts/catalog-snapshot.js import \
  --input /snapshots/catalog-snapshot-production.json --target staging
docker compose stop app jobs-worker
docker compose run --rm --no-deps -v /root/netflix-snapshots:/snapshots \
  app node scripts/catalog-snapshot.js import \
  --input /snapshots/catalog-snapshot-production.json --target staging \
  --apply --confirm Netflix_staging --backup /snapshots/catalog-snapshot-before-staging.sql
```

Bei `--confirm` den **exakten Datenbanknamen aus der Vorschau** verwenden; im
Beispiel `Netflix_staging`. Er muss eine getrennte `stage`-/`staging`-Komponente
enthalten, beispielsweise `netflix_staging` oder `netflix-stage`.
`DEPLOYMENT_ENVIRONMENT` muss `staging` sein. Nach Erfolg:

```bash
docker compose up -d --no-deps app jobs-worker
```

## Ersatzmedien und spätere Deployments

Die Ersatzvideos entstehen in den konfigurierten `MOVIE_FOLDER`- und
`SERIES_FOLDER`-Volumes. Pro Typ und Laufzeit wird eine H.264/AAC-Testdatei mit
Testbild und Zeitdarstellung erzeugt und wiederverwendet. Die gemessene Laufzeit
ist mindestens so lang wie das Original und höchstens ungefähr eine halbe
Sekunde länger. Zeitabschnitte werden nicht skaliert. Vorschaubilder werden
als neutrale PNGs erzeugt und direkt im Zielkatalog gespeichert.

Vorhandene Originaldateien werden nicht gelöscht. Neue Dateien werden zuerst
temporär erzeugt, geprüft und dann ohne Überschreiben veröffentlicht. Bei
ungültigen bereits vorhandenen Ersatzdateien stoppt der Import. Diese Dateien
gezielt beiseitelegen und erneut importieren.

Nach dem Import speichert die Datenbank den Modus `production-snapshot`.
Lokale und Staging-Seeds überspringen dann den Demokatalog, auch bei späteren
Deployments. Testkonten bleiben nutzbar. Tests, die ausdrücklich feste Demo-IDs
erwarten, benötigen weiterhin eine eigene Demo-Testdatenbank.

Der Import invalidiert ausschließlich den Katalogcache des Ziel-Namensraums;
Anmelde- und Produktionscaches werden nicht gelöscht. Browseransichten nach dem
Import neu laden. App und Worker erst nach dem Abschluss starten.

## Sicherung und Wiederherstellung

Vor Mediengenerierung und Datenänderung wird eine private SQL-Datensicherung
aller Tabellen des `public`-Schemas im Ziel geschrieben. Sie enthält auch die
**bestehenden Zielkonten und deren sensible Felder**. Sie ist kein Transferpaket
und bleibt beim Zielsystem. Vorhandene Sicherungsdateien werden nicht überschrieben.
Für Schemaänderungen und andere Datenbankschemas weiterhin PostgreSQL-Backups
verwenden. Die SQL-Sicherung benötigt dasselbe Tabellenschema beim Wiederherstellen.

Die Katalogänderung ist eine Transaktion. Fehler vor dem Commit lassen den
bisherigen Katalog bestehen. Bereits fertig erzeugte Ersatzdateien können nach
einem Abbruch liegen bleiben und werden beim nächsten Versuch wiederverwendet.
Bei einem Fehler nach dem Commit, etwa beim Cache-Leeren, meldet die CLI dies
ausdrücklich; die App gestoppt lassen und den Import mit neuem Sicherungsnamen
wiederholen.

Um zum vorherigen Zielstand zurückzukehren, App und Worker stoppen und die
SQL-Datei mit einem passenden PostgreSQL-Client in **dieselbe Zieldatenbank**
einspielen:

```bash
psql --dbname="$TARGET_DATABASE_URL" --file=catalog-snapshot-before-staging.sql
```

Die Datei enthält bereits eine Transaktion und bricht bei Fehlern ab. Nach einer
Rücksicherung den Ziel-Katalogcache vor dem Start auslaufen lassen (fünf Minuten)
oder gezielt invalidieren. Der zuvor gespeicherte Datenmodus wird mit restauriert.
