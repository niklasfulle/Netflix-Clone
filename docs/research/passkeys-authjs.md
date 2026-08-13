# Passkeys with Auth.js and Prisma

- Date: 2026-08-09
- Scope: Next.js 16, Auth.js 5 beta, Prisma, PostgreSQL
- Status: Research note; no implementation decision yet

## Conclusion

Passkeys can be added to this project without replacing its current password
login or JWT sessions. The installed `next-auth` `5.0.0-beta.32` and
`@auth/prisma-adapter` `2.11.3` exceed the documented minimum versions. Auth.js
nevertheless labels its WebAuthn provider **experimental and not recommended
for production use**. The safest plan is therefore an optional, feature-flagged
passkey pilot after the core authentication hardening work, not a mandatory
login method in the first 1.11.0 release.
([Auth.js Passkey setup](https://authjs.dev/getting-started/providers/passkey),
[current dependencies](../../package.json))

Production also needs a stable HTTPS origin and domain before a passkey pilot.
WebAuthn credentials are scoped to an RP ID, the RP ID must match the effective
domain (or a valid parent domain), and browsers require HTTPS except for the
special `http://localhost` development case. A passkey registered for one RP ID
cannot simply be used after changing to another hostname.
([W3C WebAuthn RP ID rules](https://www.w3.org/TR/webauthn-3/#relying-party-identifier),
[MDN `PublicKeyCredential`](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential))

## Recommended architecture

Use the Auth.js Passkey provider alongside the existing Credentials provider
and keep `session: { strategy: "jwt" }`. Auth.js requires a database adapter for
passkeys, but its adapter documentation explicitly supports JWT-backed sessions;
the database is used here for authenticators rather than session storage.
([Auth.js Passkey configuration](https://authjs.dev/getting-started/providers/passkey#update-authjs-configuration),
[Auth.js adapter session strategies](https://authjs.dev/reference/core/adapters))

Configuration outline:

```ts
import Passkey from "next-auth/providers/passkey"

providers: [Credentials(/* existing configuration */), Passkey({
  relayingParty: {
    id: process.env.AUTH_WEBAUTHN_RP_ID,
    name: process.env.AUTH_WEBAUTHN_RP_NAME,
    origin: process.env.AUTH_WEBAUTHN_ORIGIN,
  },
  getUserInfo: /* existing users only; never create an account implicitly */,
})],
experimental: { enableWebAuthn: true }
```

Use server-controlled values such as:

- `AUTH_WEBAUTHN_RP_ID=netflix.example.com` (domain only, no scheme or port)
- `AUTH_WEBAUTHN_ORIGIN=https://netflix.example.com` (exact browser origin)
- `AUTH_WEBAUTHN_RP_NAME=Netflix Clone`
- `AUTH_PASSKEYS_ENABLED=false` until the pilot is explicitly enabled

Auth.js can infer these values from a request, but explicit production values
avoid proxy/forwarded-host mistakes. Auth.js exposes RP ID, name, origin,
registration/authentication options, and conditional UI as provider options.
([Auth.js WebAuthn provider reference](https://authjs.dev/reference/core/providers/webauthn))

### Account creation policy

Do not allow Auth.js to create a new account during an unauthenticated passkey
request. The current project requires `User.name`, while Auth.js's default
`getUserInfo` may synthesize a new user from only an email address. Override
`getUserInfo` so it can resolve an existing account but returns `null` for an
unknown address. Registration remains possible for an already authenticated
user; Auth.js documents `signIn("passkey", { action: "register" })` for that
flow. This keeps the project's existing registration, verification, blocking,
and role rules as the only account-creation path.
([current Prisma `User`](../../prisma/schema.prisma),
[Auth.js `getUserInfo`](https://authjs.dev/reference/core/providers/webauthn#getuserinfo),
[Auth.js custom page example](https://authjs.dev/getting-started/providers/passkey#custom-pages))

## Prisma changes

Add the Auth.js `Authenticator` relation and table in a versioned migration:

```prisma
model User {
  // existing fields
  authenticators Authenticator[]
}

model Authenticator {
  credentialID         String  @unique
  userId               String
  providerAccountId    String
  credentialPublicKey  String
  counter              Int
  credentialDeviceType String
  credentialBackedUp   Boolean
  transports           String?
  user                  User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Project extensions for management UI/auditing:
  label                 String?
  createdAt             DateTime @default(now())
  lastUsedAt            DateTime?

  @@id([userId, credentialID])
}
```

The standard fields and compound key match Auth.js's official Prisma adapter
schema. Its adapter contract creates and looks up authenticators, lists them per
user, and updates the signature counter. If `lastUsedAt` is required, decorate
the Prisma adapter's counter update rather than modifying Auth.js internals.
([official Prisma Authenticator schema](https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-prisma/prisma/schema.prisma),
[Auth.js authenticator adapter methods](https://authjs.dev/reference/core/adapters#methods))

## User flows

### Enrollment

1. User signs in through the existing verified password flow.
2. The security settings page requires recent reauthentication.
3. “Add passkey” calls the WebAuthn-specific `signIn` from
   `next-auth/webauthn` with `action: "register"`.
4. After success, ask for a human-readable label such as “Windows laptop”.
5. Allow multiple passkeys and show created/last-used metadata.

The Auth.js client performs the browser ceremony through SimpleWebAuthn, while
Auth.js verifies the result and persists the public credential via the adapter.
([Auth.js custom passkey pages](https://authjs.dev/getting-started/providers/passkey#custom-pages),
[SimpleWebAuthn registration flow](https://simplewebauthn.dev/docs/packages/server#1-generate-registration-options))

### Login

- Keep email/password and “Sign in with passkey” as parallel choices.
- Call `signIn("passkey")` from `next-auth/webauthn` for explicit passkey login.
- Add conditional UI only after the explicit flow is stable; it requires an
  input whose autocomplete value includes `webauthn`, and only one provider may
  enable conditional UI.
- Retain blocked-user checks in the Auth.js `signIn` callback for the WebAuthn
  account path as well as the Credentials path.

Discoverable credentials permit account selection without entering an email,
and conditional mediation can surface passkeys through browser autofill.
([Auth.js conditional UI option](https://authjs.dev/reference/core/providers/webauthn#enableconditionalui),
[MDN conditional mediation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API#discoverable_credentials_and_conditional_mediation),
[SimpleWebAuthn passkey authentication](https://simplewebauthn.dev/docs/advanced/passkeys/#generateauthenticationoptions))

### Recovery and removal

Passkeys should initially be an additional login method, not the only recovery
factor. Keep the verified email/password-reset path, support multiple passkeys,
require recent authentication before deleting one, and prevent deletion of the
last usable method unless another recovery method is confirmed. Server-side
deletion does not necessarily remove the matching key from a password manager;
where supported, use WebAuthn's credential signalling APIs to reduce stale
entries.
([MDN handling lost and server-deleted passkeys](https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Passkeys#synchronizing_server_and_authenticators))

## Compatibility and operational risks

1. **Experimental Auth.js surface.** The provider can change before Auth.js 5
   stabilizes, so pin exact versions and run the full authentication suite before
   every dependency update. Do not make passkeys the only login method while the
   provider carries the production warning.
2. **Origin/RP ID lock-in.** Finish the canonical HTTPS hostname and reverse
   proxy configuration before enrollment. Changing the production RP ID later
   strands existing credentials.
3. **Existing schema constraint.** Unauthenticated Auth.js passkey sign-up is
   incompatible with the required `User.name` field and would bypass the
   project's established verification rules; enrollment must be existing-user
   only.
4. **Custom-page dependency.** Auth.js requires `@simplewebauthn/browser` for a
   custom sign-in page and documents compatible 9.x peer versions. Pin the exact
   versions used by the installed Auth.js beta rather than accepting an
   unreviewed major upgrade.
5. **Proxy correctness.** Verification must use an exact allowlisted origin and
   expected RP ID. Never derive either from an untrusted `Host` or forwarded
   header.
6. **Account controls.** The current Auth.js callback handles non-Credentials
   providers differently; passkey login must explicitly preserve blocked-user,
   audit, rate-limit, and session-revocation behavior.

Auth.js's experimental status and peer-version requirements are documented in
its setup guide; WebAuthn requires the server to validate challenge, origin, RP
ID, signature, and user verification policy.
([Auth.js Passkey setup](https://authjs.dev/getting-started/providers/passkey),
[W3C relying-party verification](https://www.w3.org/TR/webauthn-3/#sctn-verifying-assertion),
[SimpleWebAuthn server verification](https://simplewebauthn.dev/docs/packages/server#2-verify-authentication-response))

## Test approach

- Unit-test provider configuration, existing-user-only `getUserInfo`, blocked
  users, feature-flag behavior, adapter decoration, and passkey management
  authorization.
- Integration-test the Prisma migration, cascade deletion, unique credential
  IDs, counter updates, multiple authenticators, and recovery invariants against
  PostgreSQL.
- E2E-test enrollment, passkey login, cancellation, unknown credentials,
  invalid origin/RP ID, deleted passkeys, blocked users, and password fallback
  on desktop and mobile viewports.
- For the currently pinned Playwright `1.54.0`, use a Chromium CDP session with
  `WebAuthn.enable` and `WebAuthn.addVirtualAuthenticator`. Playwright's native
  `browserContext.credentials` API was added in `1.61`, so it becomes the
  cleaner option after a separately reviewed Playwright upgrade.
- Keep one manual acceptance matrix for Windows Hello, Android/Chrome,
  Apple/Safari, a roaming security key, and cross-device QR authentication.

The CDP WebAuthn domain is designed for virtual-authenticator testing, including
resident credentials, user verification, backup state, presence, and invalid
response simulation.
([Chrome DevTools Protocol WebAuthn domain](https://chromedevtools.github.io/devtools-protocol/tot/WebAuthn/),
[Playwright virtual credentials API](https://playwright.dev/docs/api/class-credentials))

## Recommended release phase

Create the passkey work as tickets now, but schedule implementation after the
authentication foundation, token/email hardening, login protection, and session
revocation phases. Suggested rollout:

1. **1.11.0:** shared auth hardening, reliable recovery, session revocation,
   HTTPS/canonical-origin prerequisite, and schema/config design.
2. **1.11.x pilot or 1.12.0:** feature-flagged enrollment for admin/test users,
   explicit passkey login, management UI, recovery safeguards, and virtual-
   authenticator E2E tests.
3. **Later:** enable for all users only after production telemetry, rollback
   testing, cross-platform manual tests, and a fresh review of Auth.js's
   production-support status.

This sequencing delivers passkeys without making an experimental dependency or
an unfinished HTTPS migration part of the account-recovery boundary.
