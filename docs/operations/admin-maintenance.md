# Administrator maintenance controls (1.14.6)

Under **Admin → System → Wartung und Ankündigungen**, administrators can enable a
global plain-text banner with a custom heading (up to 120 characters) and body
(up to 500 characters), set an end time in their local
timezone and independently enable the non-administrator sign-in lock. The server
stores the end time in UTC and expires both active flags at that instant.

Use a banner-only announcement first so users can save their work. Enabling the
lock immediately invalidates all non-admin AuthSession rows and advances each
non-admin account's session invalidation timestamp in the same database transaction
that saves the maintenance settings. Administrators are excluded. Sign-in callbacks
and JWT validation also enforce the active policy. Expiration or disabling the
lock permits new logins; revoked sessions stay revoked.

Open pages poll the public maintenance state every five seconds and when a tab
becomes visible. Revoked non-admin sessions are signed out and sent to the login
page, where the announcement remains visible. Background tabs cannot be guaranteed
an immediate visual update, but server authorization is revoked immediately.
Ongoing transfers and requests already accepted by the server are not retroactively
cancelled. Unsaved inputs can be lost when users are signed out.

Only administrators can change settings. Cross-origin updates are rejected and
changes are audited as deployment administration without including the custom text.
Custom text is rendered as text, never HTML. Deploy-script announcements and Caddy
maintenance pages remain independent of these database-backed admin controls;
deployment warnings take precedence if both announcements are active.

Migrations: `20261030190000_maintenance_policy` and
`20261030193000_maintenance_heading`. A blank heading uses the localized default;
older clients that omit the heading leave the stored heading unchanged.
Normal managed environments use
`prisma migrate deploy` through the deployment process. Local databases initialized
with `db push` and no migration history need the additive migration applied directly
or their normal development schema-sync workflow; do not reset a populated database
just to add this table. Catalog imports do not transfer these environment settings.

The global component must have been loaded once before open pages can receive
announcements from this release. Version 1.14.5 retains the catalog and performance
changes; Caddy pages and deployment/administrator banners belong to 1.14.6.
