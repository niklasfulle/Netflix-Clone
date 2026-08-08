# Ansible Deployment für Netflix Clone

Diese Ansible-Konfiguration ermöglicht es, den Netflix Clone Docker Container auf einem LXC Container automatisch zu aktualisieren.

## Setup

### 1. Hosts-Datei konfigurieren

Bearbeite `ansible/hosts` und trage die IP-Adresse deines LXC Containers ein:

```ini
[netflix]
netflix-lxc ansible_host=192.168.1.100 ansible_user=root
```

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
ansible-playbook update.yml
```

Oder mit dem erweiterten Playbook:

```bash
cd ansible
ansible-playbook update-netflix-clone.yml
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
2. `docker-compose.yml` wird auf dem LXC Container aktualisiert
3. Docker-Hub- und CloudFront-DNS werden mit Wiederholungsversuchen geprüft
4. Das neue Docker-Image wird mit Wiederholungsversuchen vollständig geladen und verifiziert
5. Erst danach wird der alte Container gestoppt und entfernt
6. Ein eingeschränkter systemd-Agent erfasst LXC-, Speicher- und Docker-Metriken
7. Der Container wird mit der neuen Version gestartet und über `/api/health` geprüft
8. Ansible bestätigt, dass der Monitoring-Agent den neuen Container und Image-Tag erkennt
9. Erst nach erfolgreichem Start werden nicht mehr verwendete Layer bereinigt
10. Volumes (`/movies`, `/series`, Monitoring- und Backup-Metadaten) sowie das vorherige getaggte Image für ein Rollback bleiben erhalten

## Dateien

- `ansible.cfg` - Ansible-Konfiguration
- `hosts` - Inventory mit LXC Container-Adressen
- `update.yml` - Einfaches Playbook (verwendet Shell-Befehle)
- `update-netflix-clone.yml` - Erweitertes Playbook mit Migration, Health-Prüfung und Rollback
- `docker-compose.yml.j2` - Template für docker-compose.yml
- `files/netflix_monitor.py` - Read-only LXC- und Docker-Metriksammler
- `tasks/system-monitor.yml` - Installation und Validierung des Monitoring-Agenten
- `templates/netflix-monitor.*.j2` - systemd-Service und Timer

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

### Chunk-Upload meldet `EACCES` für `/movies/temp`

Repariere ausschließlich die Laufzeitverzeichnisse, ohne Image, Migration oder Container anzufassen:

```bash
ansible-playbook -i hosts update-netflix-clone.yml --tags runtime_permissions
```

Der Task setzt `/movies`, `/series` und die beiden `temp`-Verzeichnisse auf UID/GID `10001`. Vorhandene temporäre Chunk-Dateien werden rekursiv korrigiert; die großen Medienverzeichnisse selbst werden nicht rekursiv verändert.
