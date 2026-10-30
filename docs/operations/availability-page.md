# Availability page

Caddy serves the static page in `ops/fallback` if Next.js cannot be reached or
returns HTTP 500, 502, 503 or 504 for an HTML request. Responses keep HTTP 503,
`Cache-Control: no-store` and `Retry-After: 5`. API requests receive a JSON error;
ordinary 404s and authorization responses pass through unchanged.

The page checks `/__availability` every five seconds, with request timeouts. A
successful application health response reloads the original URL, preserving its
path, query and fragment. No account details are included in the static page.
Already loaded application tabs show the fallback on their next failed document
navigation; this feature does not replace in-app error handling.

## Two deployment levels

After validating the target and deployment authorization, `deploy.ps1` invokes
`maintenance.yml` with `maintenance_action=announce` before Docker build, tag,
push or image download. It uses the existing inventory and SSH authentication.
`announcement.json` publishes level one: healthy requests continue normally.
The root-layout banner polls `/__maintenance` every five seconds and on tab
visibility changes. It uses the browser top layer to remain visible above dialogs
and browser fullscreen. English and German messages ask users to save their work.

Immediately before migration, `updating.json` activates level two. Caddy returns
the independent page for new HTML navigations and HTTP 503 JSON for other app
requests, including writes. `/api/health` remains available for deployment health
checks; `/__availability` stays unavailable until the update marker is removed.
Already open tabs retain their DOM and display the installation banner instead
of being forcibly redirected. The existing post-deployment version notice then
asks before reloading. This protects inputs from automatic navigation; it does
not add automatic draft persistence or transactional protection for requests
already in flight.

The outer PowerShell `finally` clears both markers after build/deployment failures
or success, before deleting its temporary authentication file. The Ansible update
playbook also removes both markers in its `always` section after rollback.
If the controller is forcibly killed, announcements expire in the browser after
two hours. A leftover level-two marker still requires removal on the host to
release the server-side gate. Concurrent deployments to one target are not
supported; finish or clear an interrupted deployment before starting another.

The first installation of this feature requires browsers to load the new frontend
once. Subsequent announcements appear in already-open pages without reloading.

`deploy.ps1` passes `deployment_update_mode=true` to Ansible. The playbook installs
the fallback assets and refreshes Caddy before touching the application. Immediately
before migration/update, it writes `maintenance/updating.json` on the deployment
host. This marker gates application traffic and selects the planned update message.
Docker builds and image downloads do not force users
onto the fallback while the current app remains available.

The deployment's `always` section removes the marker after success or rollback,
including failed rollbacks. In case Ansible itself is forcibly terminated or loses
the host, the page stops labeling markers older than two hours as active updates,
but a remaining level-two marker continues to block application requests.
Remove the marker manually after an interrupted deployment if necessary.

Both Ansible-managed Compose and the manual Compose fallback mount the assets and
marker directory read-only into the proxy. Manual Compose users create the local
`maintenance` directory and can write `{"mode":"update"}` to
`maintenance/updating.json` before restarting the app, then remove that file after
the health check. No restart of Caddy is needed to change the marker.

The proxy must remain running during application replacement. A host outage,
unavailable Docker daemon or stopped proxy cannot be covered by this page. The
first deployment that installs the feature briefly recreates the proxy before
application replacement; after installation it can serve independently of Next.js.

The local `compose.local.yml` accesses Next.js directly and has no proxy. The
failure and recovery behavior is tested in isolated Caddy/backend containers so
the imported development data and running services are preserved.

Run `node scripts/test-proxy-fallback.cjs` from the repository root with Docker,
Chrome, project dependencies and the `netflix-clone-local:latest` image available.
The test uses a dedicated Docker network, temporary marker directory and port
18085. It verifies healthy forwarding, upstream HTTP failures, stopped backends,
JSON API errors, planned update text and automatic return to the original URL.
