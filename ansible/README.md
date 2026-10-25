# Ansible Deployment für Netflix Clone

> Staging is the default deployment target. See
> [`docs/deployment/staging.md`](../docs/deployment/staging.md) for LXC cloning,
> environment isolation, deployment, and production promotion.

Diese Ansible-Konfiguration ermöglicht es, den Netflix Clone Docker Container auf einem LXC Container automatisch zu aktualisieren.

## Setup

### 1. Ziel und LAN-Host konfigurieren

Lege für jede Umgebung eine lokale Konfigurationsdatei aus `.env.example` an.
`LAN_HOST` enthält nur den im LAN auflösbaren Namen, ohne Schema oder Port:

```dotenv
LXC_HOST=192.168.1.164
LXC_USER=root
LXC_PORT=22
LAN_HOST=netflix-staging
```

Ohne Angabe verwendet das Setup `netflix-staging` für Staging und `netflix`
für Produktion. `setup-env.ps1` erzeugt daraus das passende Inventory.

### 2. SSH-Zugriff einrichten

Stelle sicher, dass du SSH-Zugriff auf den LXC Container hast:

```bash
# SSH-Key kopieren (optional)
ssh-copy-id root@192.168.1.100

# Oder teste die Verbindung
ssh root@192.168.1.100
```

### 3. Ansible installieren (falls noch nicht vorhanden)

```bash
# Auf Windows (WSL)
pip install ansible

# Auf Linux
sudo apt install ansible
```

## Verwendung

### Update durchführen

Das Playbook liest automatisch die Version aus `package.json` und aktualisiert den Container:

```bash
cd ansible
ansible-playbook -i hosts.staging update.yml -e deployment_environment=staging
```

Oder mit dem erweiterten Playbook:

```bash
cd ansible
ansible-playbook -i hosts.staging update-netflix-clone.yml -e deployment_environment=staging
```

### Nur prüfen (Dry-Run)

```bash
cd ansible
ansible-playbook update.yml --check
```

### Mit Verbose-Output

```bash
cd ansible
ansible-playbook update.yml -v
```

## Was passiert beim Update?

1. Version wird aus `package.json` gelesen
2. `docker-compose.yml` und die HTTP-Caddy-Konfiguration werden aktualisiert
3. Docker-Hub- und CloudFront-DNS werden mit Wiederholungsversuchen geprüft
4. Das neue Docker-Image wird mit Wiederholungsversuchen vollständig geladen und verifiziert
5. Ein PostgreSQL-Dump wird erstellt und in einem temporären Container ohne Netzwerk vollständig wiederhergestellt und geprüft
6. Erst nach erfolgreicher Restore-Verifikation werden Prisma-Migrationen angewendet
7. Erst danach wird der alte Container gestoppt und entfernt
8. Ein eingeschränkter systemd-Agent erfasst LXC-, Speicher- und Docker-Metriken
9. App und Reverse-Proxy werden gestartet; Port 3000 bleibt auf localhost beschränkt
10. Ansible prüft `/api/health` direkt und anschließend über das kanonische HTTP-Ziel
11. Der Monitoring-Agent muss den neuen Container und Image-Tag erkennen
12. Der LXC signiert den aktuellen Deployment-, Migrations-, Health- und Rollback-Status mit seinem privaten Ed25519-Schlüssel
13. Ein persistenter systemd-Timer erstellt täglich einen atomaren PostgreSQL-Dump, verifiziert ihn per isoliertem Restore und wendet die sichere Retention an
14. Erst nach erfolgreichem Start werden nicht mehr verwendete Layer bereinigt
15. Volumes (`/movies`, `/series`, Monitoring-, Deployment- und Backup-Metadaten) sowie das vorherige getaggte Image für ein Rollback bleiben erhalten
16. Ein digest-gepinnter, flüchtiger Redis-7.2-Dienst startet ausschließlich im internen Backend-Netz; ACL, Umgebung und Speichergrenzen werden vor der Promotion geprüft

## Dateien

- `ansible.cfg` - Ansible-Konfiguration
- `hosts` - Inventory mit LXC Container-Adressen
- `update.yml` - Einfaches Playbook (verwendet Shell-Befehle)
- `update-netflix-clone.yml` - Erweitertes Playbook mit Migration, Health-Prüfung und Rollback
- `docker-compose.yml.j2` - Template für docker-compose.yml
- `Caddyfile.j2` - HTTP-Reverse-Proxy für den kanonischen LAN-Namen
- `files/netflix_monitor.py` - Read-only LXC- und Docker-Metriksammler
- `files/verify-postgres-backup.sh` - isolierter Restore und bounded Statusvertrag
- `files/run-postgres-backup-verification.sh` - Host-Lock und gehärteter Docker-Aufruf
- `files/run-postgres-backup.sh` - geplanter Dump, Checksumme, Restore-Prüfung und Status
- `files/manage-postgres-backups.py` - pfadgebundene tägliche/wöchentliche/monatliche Retention
- `files/provision-redis-secrets.sh` - atomare, umgebungsgebundene Redis-ACL- und Client-Credentials
- `files/redis-runtime.conf` - flüchtige Cache-, Speicher- und Eviction-Konfiguration
- `files/publish_deployment_status.py` - atomarer, host-signierter Deployment Record
- `tasks/publish-deployment-status.yml` - wiederverwendbare Lifecycle-Publikation
- `tasks/system-monitor.yml` - Installation und Validierung des Monitoring-Agenten
- `templates/netflix-monitor.*.j2` - systemd-Service und Timer
- `templates/netflix-backup-verification.*.j2` - manueller Admin-Trigger über systemd
- `templates/netflix-postgres-backup.*.j2` - persistenter Backup-Service und Timer
- `docs/operations/redis-runtime.md` - First/Repeat Deploy, Ausfallübung, Upgrade und Rollback des Redis-Dienstes

## Troubleshooting

### SSH-Verbindungsprobleme

Test die Verbindung:
```bash
ansible netflix -m ping
```

### Docker nicht gefunden

Stelle sicher, dass Docker auf dem LXC Container installiert ist:
```bash
ssh root@<LXC_IP> "docker --version"
```

### Docker-Pull schlägt mit DNS-Timeout fehl

Prüfe die Namensauflösung direkt auf dem LXC-Host:

```bash
ssh root@<LXC_IP> "getent ahosts registry-1.docker.io"
ssh root@<LXC_IP> "getent ahosts production.cloudfront.docker.com"
```

Wenn die Abfragen über den eingetragenen DNS-Server fehlschlagen, korrigiere die DNS-Konfiguration des LXC-Hosts beziehungsweise des Routers. Das Playbook wiederholt DNS-Prüfung und Image-Pull automatisch. Der laufende Container wird dabei erst nach einem vollständig erfolgreichen Pull gestoppt.

### Docker meldet `Not supported URL scheme http+docker`

Das erweiterte Playbook verwendet bewusst die Docker-CLI statt der Python-Docker-SDK-Module. Dadurch ist es unabhängig von inkompatiblen Kombinationen aus `requests`, Docker SDK und `community.docker`.

### `http://netflix` ist nicht erreichbar

Der Hostname muss auf die jeweilige LXC-IP zeigen. Caddy nimmt nur HTTP auf
Port 80 an; Port 443 und die interne Caddy-CA werden nicht mehr verwendet.

### Chunk-Upload meldet `EACCES` für `/movies/temp`

Repariere ausschließlich die Laufzeitverzeichnisse, ohne Image, Migration oder Container anzufassen:

```bash
ansible-playbook -i hosts update-netflix-clone.yml --tags runtime_permissions
```

Der Task setzt `/movies`, `/series` und die beiden `temp`-Verzeichnisse auf UID/GID `10001`. Vorhandene temporäre Chunk-Dateien werden rekursiv korrigiert; die großen Medienverzeichnisse selbst werden nicht rekursiv verändert.

### Externe Modelldienste für die Videoanalyse

App und Worker laden optional dieselbe geschützte Hostdatei
`/root/netflix-secrets/video-analysis.env`. Sie muss root gehören und Modus
`0600` haben; das Deployment überschreibt ihren Inhalt nicht. Die neutrale
Vorlage liegt unter `templates/video-analysis.env.example`. Endpunkt,
Modellname, API-Schlüssel und Healthcheck lassen sich getrennt pro Umgebung
konfigurieren. Danach werden App und Worker neu erstellt, ohne Seeding.
Details: [Externe Modelldienste](../docs/operations/video-analysis-models.md).
