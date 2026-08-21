# LAN HTTPS certificate trust

Netflix Clone uses one private Caddy certificate authority per deployment
environment. Production and staging therefore have separate public root
certificates. Only authenticated, non-blocked users can inspect or download the
validated public roots under **Settings > HTTPS trust**.

The application never receives Caddy's data directory, server certificate
private key, CA private key, PKCS#12 identity, or ACME material. Ansible exports
only Caddy's public `root.crt`, validates it on the host, and publishes it as a
read-only artifact below `/var/lib/netflix-public-certificates`.

## First-device bootstrap

A fingerprint displayed through a connection the device does not yet trust is
not sufficient proof. Obtain the expected SHA-256 fingerprint from an
administrator over a separate trusted channel. For the first trusted device,
transfer the public certificate offline or retrieve it directly from the LXC:

```bash
openssl x509 \
  -in /var/lib/netflix-public-certificates/current.pem \
  -noout -fingerprint -sha256 -subject -issuer -dates
```

After one device trusts the deployment and the fingerprint matches, an
authenticated user can use the fixed PEM or DER/CER downloads in Settings.

## Device installation and removal

- **Windows:** import the CER into *Trusted Root Certification Authorities* for
  the current user or a managed device. Remove the same certificate from that
  store when retired.
- **macOS:** add the PEM to Keychain Access and explicitly trust it for SSL.
  Remove it from the login or system keychain when retired.
- **iOS/iPadOS:** transfer the certificate through a trusted channel, install
  the profile, then enable full trust under *Certificate Trust Settings*.
  Remove the installed profile to uninstall it.
- **Android:** install it as a CA certificate. Some applications ignore
  user-installed roots. Remove it later under trusted credentials.
- **Linux:** place the PEM in the distribution's trust-anchor directory and run
  its CA update command. Delete that file and update the store again to remove
  it.

Installing a private root grants it trust on that device. Users must verify the
fingerprint first and remove retired roots promptly.

## Unsupported webOS path

LG webOS does not provide this private-root installation path for ordinary
users. Do not promise that downloading this CA fixes TV access. A TV-compatible
deployment needs a certificate chaining to a root already trusted by the
device, unless a separately verified management mechanism exists. A real
domain can resolve only on internal DNS; the application does not need to be
publicly reachable.

## Safe rotation

An unchanged root is republished atomically. If Caddy presents a different
root, deployment fails by default. Start a planned overlap explicitly:

```bash
ansible-playbook -i hosts update-netflix-clone.yml \
  --extra-vars "deployment_environment=staging allow_public_ca_rotation=true"
```

The former `current.pem` becomes `previous.pem`; both remain available to users
during the transition. The default overlap is 30 days and can be configured
between 1 and 90 days with `public_ca_overlap_days`. The application stops
offering an older previous root even before the next deployment removes it.
Distribute and verify the new root before clients move to it. To end the overlap
early, and only when the previous root is no longer needed, retire it explicitly:

```bash
ansible-playbook -i hosts update-netflix-clone.yml \
  --extra-vars "deployment_environment=staging allow_public_ca_rotation=true retire_previous_public_ca=true"
```

Repeat the process separately for production. Rotation approval is never
implicit and a previous root is never deleted by ordinary deployments.

## Validation and incident checks

The publisher rejects a missing, empty, oversized, symlinked, expired, non-CA,
or private-key-containing artifact. It writes root-owned `0644` public files
atomically. The application performs its own X.509 and filesystem validation on
every request and returns a generic unavailable response without exposing host
paths.

If the settings card reports that the CA is unavailable, inspect the deployment
and proxy first:

```bash
docker exec netflix-proxy test -s /data/caddy/pki/authorities/local/root.crt
ls -l /var/lib/netflix-public-certificates
openssl x509 -in /var/lib/netflix-public-certificates/current.pem -noout -text
```

Never copy anything named `root.key`, a private key, or the whole Caddy data
volume into the application or a user-accessible location.
