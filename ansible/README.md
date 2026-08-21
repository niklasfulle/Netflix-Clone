# Ansible Deployment für Netflix Clone

> Staging is the default deployment target. See
> [`docs/deployment/staging.md`](../docs/deployment/staging.md) for LXC cloning,
> environment isolation, deployment, and production promotion.

Diese Ansible-Konfiguration ermöglicht es, den Netflix Clone Docker Container auf einem LXC Container automatisch zu aktualisieren.

## Setup

### 1. Ziel und LAN-HTTPS konfigurieren

Lege für jede Umgebung eine lokale Konfigurationsdatei aus `.env.example` an.
`HTTPS_HOST` enthält nur den im LAN auflösbaren Namen, ohne Schema oder Port:

```dotenv
LXC_HOST=192.168.1.164
LXC_USER=root
LXC_PORT=22
HTTPS_HOST=netflix-staging
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
2. `docker-compose.yml` und die interne Caddy-HTTPS-Konfiguration werden aktualisiert
3. Docker-Hub- und CloudFront-DNS werden mit Wiederholungsversuchen geprüft
4. Das neue Docker-Image wird mit Wiederholungsversuchen vollständig geladen und verifiziert
5. Ein PostgreSQL-Dump wird erstellt und in einem temporären Container ohne Netzwerk vollständig wiederhergestellt und geprüft
6. Erst nach erfolgreicher Restore-Verifikation werden Prisma-Migrationen angewendet
7. Erst danach wird der alte Container gestoppt und entfernt
8. Ein eingeschränkter systemd-Agent erfasst LXC-, Speicher- und Docker-Metriken
9. App und Reverse-Proxy werden gestartet; Port 3000 bleibt auf localhost beschränkt
10. Ansible prüft `/api/health` direkt und anschließend über das echte kanonische HTTPS-Ziel
11. Ansible exportiert die interne Root-CA nach `/root/netflix-clone/caddy-local-root.crt`
12. Der Monitoring-Agent muss den neuen Container und Image-Tag erkennen
13. Der LXC signiert den aktuellen Deployment-, Migrations-, Health- und Rollback-Status mit seinem privaten Ed25519-Schlüssel
14. Ein persistenter systemd-Timer erstellt täglich einen atomaren PostgreSQL-Dump, verifiziert ihn per isoliertem Restore und wendet die sichere Retention an
15. Erst nach erfolgreichem Start werden nicht mehr verwendete Layer bereinigt
16. Volumes (`/movies`, `/series`, Caddy-PKI, Monitoring-, Deployment- und Backup-Metadaten) sowie das vorherige getaggte Image für ein Rollback bleiben erhalten

## Dateien

- `ansible.cfg` - Ansible-Konfiguration
- `hosts` - Inventory mit LXC Container-Adressen
- `update.yml` - Einfaches Playbook (verwendet Shell-Befehle)
- `update-netflix-clone.yml` - Erweitertes Playbook mit Migration, Health-Prüfung und Rollback
- `docker-compose.yml.j2` - Template für docker-compose.yml
- `Caddyfile.j2` - internes HTTPS für den kanonischen LAN-Namen
- `files/netflix_monitor.py` - Read-only LXC- und Docker-Metriksammler
- `files/verify-postgres-backup.sh` - isolierter Restore und bounded Statusvertrag
- `files/run-postgres-backup-verification.sh` - Host-Lock und gehärteter Docker-Aufruf
- `files/run-postgres-backup.sh` - geplanter Dump, Checksumme, Restore-Prüfung und Status
- `files/manage-postgres-backups.py` - pfadgebundene tägliche/wöchentliche/monatliche Retention
- `files/publish_deployment_status.py` - atomarer, host-signierter Deployment Record
- `tasks/publish-deployment-status.yml` - wiederverwendbare Lifecycle-Publikation
- `tasks/system-monitor.yml` - Installation und Validierung des Monitoring-Agenten
- `templates/netflix-monitor.*.j2` - systemd-Service und Timer
- `templates/netflix-backup-verification.*.j2` - manueller Admin-Trigger über systemd
- `templates/netflix-postgres-backup.*.j2` - persistenter Backup-Service und Timer

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

### Der Browser vertraut `https://netflix` noch nicht

Caddy stellt für reine LAN-Namen Zertifikate aus seiner internen CA aus. Nach
dem ersten erfolgreichen Deployment muss deren öffentliches Root-Zertifikat
einmalig auf jedem Client als vertrauenswürdige Stammzertifizierungsstelle
installiert werden. Die Datei liegt auf dem LXC unter
`/var/lib/netflix-public-certificates/current.pem`. Sie wird validiert und nur
lesbar in die Anwendung eingebunden. Produktion und Staging haben jeweils eine
eigene CA; beide Zertifikate müssen auf Clients installiert werden, die beide
Umgebungen verwenden. Ein unerwarteter Wechsel wird standardmäßig abgelehnt.
Der kontrollierte Übergang mit `allow_public_ca_rotation=true` sowie die spätere
explizite Entfernung stehen in
[`docs/operations/certificate-trust.md`](../docs/operations/certificate-trust.md).

### Chunk-Upload meldet `EACCES` für `/movies/temp`

Repariere ausschließlich die Laufzeitverzeichnisse, ohne Image, Migration oder Container anzufassen:

```bash
ansible-playbook -i hosts update-netflix-clone.yml --tags runtime_permissions
```

Der Task setzt `/movies`, `/series` und die beiden `temp`-Verzeichnisse auf UID/GID `10001`. Vorhandene temporäre Chunk-Dateien werden rekursiv korrigiert; die großen Medienverzeichnisse selbst werden nicht rekursiv verändert.
