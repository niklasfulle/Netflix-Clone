# 0003: Internal HTTPS for LAN hostnames

- Status: Accepted
- Date: 2026-08-13

## Context

Production and staging are reachable only inside the local network as
`netflix` and `netflix-staging`. There are no public DNS domains, but secure
cookies, canonical authentication links, and WebAuthn require stable HTTPS
origins. Exposing Next.js directly on port 3000 would leave these flows on plain
HTTP and would make proxy trust ambiguous.

Public certificate authorities cannot issue certificates for these private
single-label hostnames. A private trust anchor is therefore required on every
client that uses the application.

## Decision

Each environment runs a pinned Caddy container in front of Next.js. Caddy
terminates ports 80 and 443, redirects HTTP to HTTPS, and issues the LAN-host
certificate from its internal CA. Production uses `https://netflix`; staging
uses `https://netflix-staging`. Next.js remains bound to
`127.0.0.1:3000`, and the deployment injects one canonical origin into Auth.js,
email-link, proxy-hop, and WebAuthn configuration.

Each LXC keeps an independent CA in its persistent `caddy_data` volume. Ansible
exports only the public root certificate, validates the canonical HTTPS health
endpoint against that root, and preserves both Compose and Caddy configuration
during rollback. LAN clients resolve the hostnames through local DNS or a hosts
file and install the relevant public root certificate once.

## Consequences

- Every client must trust the production CA and, when needed, the separate
  staging CA before browsers accept the sites without warnings.
- Losing the persistent Caddy data volume creates a new trust anchor and
  requires redistributing its public root certificate.
- The CA private key remains inside the protected Caddy volume and must never be
  copied to clients or committed.
- Port 3000 remains available locally on the LXC for diagnostics and rollback
  checks but is not exposed to the LAN.
- Changes to proxy policy must update both the Ansible-managed deployment and
  the documented manual Compose fallback until the latter is removed.
