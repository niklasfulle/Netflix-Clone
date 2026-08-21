# Staging environment

Staging runs on a dedicated LXC so that Docker, networking, filesystem
permissions, monitoring, migrations, backup validation, and health checks
behave like production. A fresh LXC is recommended because it cannot inherit
production credentials, Docker state, or writable production mounts.

## 1. Prepare the dedicated LXC

1. Create a new LXC from the same operating-system template as production.
2. Give it its own hostname, static IP address, and MAC address.
3. For Docker in an unprivileged Proxmox LXC, enable the `nesting` and `keyctl`
   features.
4. Install Docker Engine and the Docker Compose plugin, then verify that both
   `docker version` and `docker compose version` succeed.
5. Do not expose the staging host through the production reverse proxy.
6. On the production LXC, create its immutable identity marker:

   ```bash
   install -d -m 0755 /etc/netflix-clone
   printf '%s\n' production > /etc/netflix-clone/environment
   chmod 0644 /etc/netflix-clone/environment
   ```

7. On the staging LXC, create its marker:

   ```bash
   install -d -m 0755 /etc/netflix-clone
   printf '%s\n' staging > /etc/netflix-clone/environment
   chmod 0644 /etc/netflix-clone/environment
   ```

The playbook refuses to deploy when the requested environment does not match
this marker. This protects production when an inventory is selected by
mistake.

Create separate Proxmox-host directories for the media mounts instead of
attaching `/mnt/ssd2/movies` and `/mnt/ssd2/series` from production:

```bash
mkdir -p /mnt/ssd2/netflix-staging/movies
mkdir -p /mnt/ssd2/netflix-staging/series
```

Attach those directories to `/movies` and `/series` in the staging LXC. When
the LXC is unprivileged, ensure the host-side ownership matches the configured
UID mapping before deployment. The application runs as UID/GID `10001` inside
the container.

## 2. Isolate staging data and credentials

Create `/root/netflix-secrets/app.env` on the staging LXC before deploying the
application. At minimum, staging needs separate values for:

- `POSTGRESQL_URL`, pointing to a dedicated staging database;
- `DEPLOYMENT_ENVIRONMENT=staging`, confirming that the cloned configuration
  has been reviewed;
- the remaining Auth.js secrets and mail settings; canonical URL, WebAuthn
  origin and trusted proxy count are injected by the deployment;
- OAuth callback URLs and provider credentials, if social login is tested;
- email delivery settings, preferably using a sandbox mailbox;
- any encryption or signing keys that should not be shared with production.

Passkeys remain disabled unless `AUTH_PASSKEYS_ENABLED=true` is set. To test the
feature-flagged pilot, staging needs the following additional values in
`app.env`:

```dotenv
AUTH_PASSKEYS_ENABLED=true
AUTH_WEBAUTHN_RP_NAME=Netflix Clone Staging
```

The deployment derives `AUTH_URL`, `AUTH_PUBLIC_URL`, `AUTH_WEBAUTHN_ORIGIN`,
and the RP ID from `HTTPS_HOST`, so they cannot drift apart. The RP ID is the
hostname without scheme or port.
Do not alternate between an IP address and a hostname: passkeys registered for
one RP ID do not work for another. WebAuthn permits plain HTTP only on
`http://localhost`; a LAN hostname or address therefore requires TLS through a
reverse proxy. Forward the original host and protocol and keep staging and
production RP IDs separate.

The two Playwright accounts are provisioned automatically after every
successful schema migration. Copy the local E2E environment file to a separate,
root-only file on the staging LXC:

```powershell
scp .env.e2e.local root@192.168.1.164:/root/netflix-secrets/staging-users.env
ssh root@192.168.1.164 "chown root:root /root/netflix-secrets/staging-users.env; chmod 0600 /root/netflix-secrets/staging-users.env"
```

The file must provide `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`,
`E2E_ADMIN_EMAIL`, and `E2E_ADMIN_PASSWORD`. It is passed only to a temporary
seed container and is never added to the application container, image, or Git.
`E2E_DATABASE_URL` is used only by the local Playwright runner and is ignored by
the seed. It must connect to the same isolated staging database as the
application when MFA or passkey journeys run against the remote staging URL.
The idempotent seed confirms both email addresses, assigns `USER` and `ADMIN`,
creates a profile when missing, clears blocking and MFA state, and refreshes the
configured passwords. Staging authentication throttles are also cleared so the
accounts are immediately usable after deployment. Production deployments never execute this seed. The seed
also verifies both `DEPLOYMENT_ENVIRONMENT=staging` and the connected database
name before changing data.

Staging deployments also create a deterministic six-title catalog and four
actors. Two compact ten-second MP4 fixtures are generated in the isolated
`/movies` and `/series` mounts through a digest-pinned FFmpeg helper image. Each
clip contains real H.264 video, AAC audio, regular seek keyframes, and a fast-start
MP4 header. Existing valid fixtures are reused; missing or invalid fixtures are
regenerated and published only after `ffprobe` validation. The helper image is
about 43 MB and is used only during staging deployment—it is not added to the
application image or pulled on production.

Never let the cloned `app.env` continue pointing to the production database.
A sanitized production snapshot can be restored into the staging database,
but staging must have its own database role and database name.
The database name must contain `staging` or `stage` (for example,
`Netflix_staging`). Before any backup or migration, Ansible connects through
`POSTGRESQL_URL` and rejects a database that does not meet this rule.

The PostgreSQL database itself must already exist. When it contains no tables,
the staging deployment initializes the current Prisma schema and records the
versioned migrations as its baseline. This bootstrap is rejected for
production and for every non-empty database; it never uses `--force-reset`.

The copied `/movies` and `/series` directories can be retained for realistic
tests if the clone has enough storage. Remove sensitive uploads or use a small
test catalog when production media must not be copied.

## 3. Configure the staging inventory

Create `ansible/.env.staging` from the example:

```powershell
Copy-Item ansible/.env.example ansible/.env.staging
```

Set the cloned LXC address:

```dotenv
LXC_HOST=192.168.1.156
LXC_USER=root
LXC_PORT=22
HTTPS_HOST=netflix-staging
```

Both `.env.staging` and the generated `hosts.staging` are ignored by Git.
The deployment script generates the inventory automatically when it is first
needed.

Resolve `netflix-staging` to the staging LXC and `netflix` to production using
your router's local DNS. A hosts-file entry works as a fallback:

```text
192.168.1.164 netflix-staging
192.168.1.155 netflix
```

The deployment exposes Caddy on ports 80 and 443 and binds the direct Next.js
port to `127.0.0.1:3000`. Caddy uses a persistent internal CA because no public
domain exists. After the first successful deployment, copy and trust its public
root certificate on each client:

```powershell
scp root@192.168.1.164:/root/netflix-clone/caddy-local-root.crt .\netflix-staging-root.crt
Import-Certificate -FilePath .\netflix-staging-root.crt -CertStoreLocation Cert:\CurrentUser\Root
```

Repeat this for production. Do not copy a CA private key; only the exported
`caddy-local-root.crt` is needed. Existing clients keep trusting future
certificates while the persistent `caddy_data` volume remains intact.

## 4. Deploy and promote

Staging is the safe default:

```powershell
.\deploy.ps1
```

The command builds and pushes the versioned image, deploys it to staging,
runs migrations, verifies backup integrity, checks `/api/health` through the
canonical HTTPS URL with certificate validation, and records a local staging
receipt only after success.

Promote that exact version to production without rebuilding it:

```powershell
.\deploy.ps1 -Environment Production -SkipDocker -ConfirmProduction
```

Production deployment is rejected when the same application version has not
completed staging successfully in the current checkout. Starting another
staging deployment invalidates the previous receipt until the new deployment
passes.

## 5. Acceptance checks before production

- Health endpoint returns HTTP 200, the expected version, and `staging`.
- `http://netflix-staging` redirects to `https://netflix-staging`, and the
  browser reports a trusted certificate without warnings.
- A clearly visible `STAGING` badge appears at the top of every application page.
- Login, registration, verification, password reset, MFA, and logout work.
- When the passkey pilot is enabled, enrollment, cancellation, passkey login,
  rename, removal, password fallback, and final-method protection work on both
  desktop and mobile Chromium.
- Two independent browser sessions can sign in; "Sign out other devices" invalidates only the second session.
- Password reset, password change, MFA change, and administrator blocking invalidate the expected existing sessions.
- Both configured E2E accounts can log in and select their seeded profiles.
- Database-mutating Playwright helpers confirm both the staging health marker
  and a database name containing `stage` or `staging` before changing data.
- `/api/video/staging-player-movie` returns the complete MP4 and HTTP 206 byte ranges.
- The seeded movie and series load metadata and play in the real browser player.
- Admin pages and container logs load without server errors.
- Video playback, range requests, thumbnails, and aborted playback are stable.
- Prisma reports all migrations applied.
- A database backup is created and validated before migration.
- Container health and LXC monitoring report the expected image.
- The admin System Overview verifies the host-signed staging Deployment Record;
  an approved production peer is shown as unavailable until its public key and
  signed record are deliberately transported.
- No staging email, OAuth callback, database write, or backup reaches a
  production service.

If an interrupted MFA run leaves the deterministic user in a challenge state,
rerun the protected staging seed from an authenticated shell on the LXC:

```bash
docker run --rm \
  --env-file /root/netflix-secrets/app.env \
  --env-file /root/netflix-secrets/staging-users.env \
  salkin263/netflix-clone:1.11.0 \
  node scripts/seed-staging-users.js
```

The seed is idempotent, refuses production, clears MFA/rate-limit state, and
restores the configured staging passwords.
