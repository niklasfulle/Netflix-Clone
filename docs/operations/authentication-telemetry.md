# Authentication telemetry

Version 1.12.1 adds QR-assisted device-login events to the established
privacy-safe authentication lifecycle. QR payloads and event metadata never
contain a session, account identity, pairing secret, manual code, or URL.

## QR device-pairing operations

Pairing requests expire after five minutes. The application marks expired
pending requests terminally while servicing a new request and removes terminal
requests that have been expired for more than 24 hours in bounded batches of
50. This needs no Redis, worker, or GitHub Actions job. Operators should treat
unexpected repeated terminal outcomes as a rate-limit or client-connectivity
signal, not as evidence that a specific account exists.

## Event contract

Every observed attempt has a random correlation ID, an `auth.<flow>.started`
entry, and at most one `auth.<flow>.completed` entry. Terminal records contain:

- timestamp, severity, environment, application version, and duration;
- flow, stage, outcome, stable reason code, and component;
- retryability, bounded HTTP status where relevant, and an allow-listed error
  category.

The typed API has no general metadata or error-object argument. It therefore
cannot accept request bodies, headers, URLs, Auth.js objects, Prisma records, or
arbitrary exception text. It never records email addresses, names, passwords,
MFA/recovery codes, tokens, cookies, session/profile/account IDs, IP addresses,
or raw user agents. Safe correlation IDs may be shown as support references.

Covered flows include password sign-in, registration and verification,
password reset/change, logout, MFA, profile handoff, session lifecycle,
Auth.js POST/provider boundaries, and authentication-related mail delivery.
Successful Auth.js GET/session polling is deliberately not logged. Successful
session validation is sampled at most once per opaque session every 15 minutes;
rejections and provider failures are still recorded.

## Stable outcomes

Expected user outcomes remain informational, including `invalid_credentials`,
`invalid_token`, `token_expired`, `two_factor_required`, and
`verification_sent`. `rate_limited` is a warning. Infrastructure failures use
an error outcome and distinguish `mail`, `database`, `provider`,
`configuration`, and `unexpected` categories. Public responses do not disclose
whether an account exists.

The complete allow-list lives in `lib/authentication/telemetry.ts`. Unknown
reason codes are converted to `unexpected_failure`; extra runtime properties
are ignored when the record is constructed.

## Storage, grouping, and retention

Authentication events use the normal backend JSONL store mounted at
`/var/lib/netflix-logs`. Each event is one physical line, so a logical exception
does not fragment in the administrator view. Imported Docker output is grouped
by the container-log parser before display.

The backend store defaults to five files of at most 5 MiB each. Docker itself
retains three JSON log files of at most 10 MiB each. Operators should preserve
only the bounded diagnostic window required for incidents and must not export
logs to third-party telemetry without a separate privacy review.

## Operator checks and alerts

Use **Admin > Logs** and filter for category `authentication` or actions starting
with `auth.`. Investigate repeated `delivery_failed`, `provider_failure`,
`certificate_unavailable`, database-category failures, or rapid
`session_revoked` results. A burst of `invalid_credentials` is not by itself an
application outage; the database-backed rate limiter is the control for that
traffic.

Recommended alerting is based on repeated infrastructure failures in a bounded
time window, not on one user's expected rejection. Never paste unrestricted
logs into an issue. Share only stable reason codes, environment/version, time,
and correlation ID.

For a staging failure drill:

1. point the staging SMTP configuration at an unavailable test endpoint;
2. request a reset for a seeded test account;
3. confirm the public response remains enumeration-safe;
4. confirm one terminal `delivery_failed` record with no recipient or content;
5. restore SMTP and verify a later attempt records success.

Repeat with a controlled provider failure and a revoked test session before the
production release gate.
