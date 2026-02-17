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

Das Playbook liest automatisch die Version aus `version.txt` und aktualisiert den Container:

```bash
cd ansible
ansible-playbook update.yml
```

Oder mit dem erweiterten Playbook (benötigt community.docker Collection):

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

1. Version wird aus `version.txt` gelesen (z.B. 1.7.2)
2. `docker-compose.yml` wird auf dem LXC Container aktualisiert
3. Alter Container wird gestoppt und entfernt
4. Neues Docker-Image wird gepullt
5. Container wird mit neuer Version gestartet
6. Volumes (`/movies` und `//series`) bleiben erhalten

## Dateien

- `ansible.cfg` - Ansible-Konfiguration
- `hosts` - Inventory mit LXC Container-Adressen
- `update.yml` - Einfaches Playbook (verwendet Shell-Befehle)
- `update-netflix-clone.yml` - Erweitertes Playbook (benötigt community.docker)
- `docker-compose.yml.j2` - Template für docker-compose.yml

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

### Community Docker Collection fehlt

Falls du `update-netflix-clone.yml` verwenden möchtest:
```bash
ansible-galaxy collection install community.docker
```

Oder nutze das einfachere `update.yml` Playbook.
