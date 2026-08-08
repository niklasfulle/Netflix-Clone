# Changelog

Die aktuelle Version wird mit `[current]` markiert und automatisch aus `package.json` eingesetzt.

## [current]

- Movie deletion now removes actor relations transactionally, cleans up orphaned actors, and reliably replaces the deleted edit route in browser history
- Production deployment now includes the generated Prisma runtime, uses Docker CLI transport, and supports safe migration baselining and recovery for existing databases
- PostgreSQL backups use a matching PostgreSQL 18 client, validate dumps before publication, and preserve credential-redacted diagnostics on failure
- Runtime media permissions and health checks now verify writable movie and series storage without exposing host paths
- Billboard playback checks media availability before requesting video and falls back silently to the poster when media files are unavailable
- Docker and Next.js multiline exceptions are grouped into complete logical entries in the administration log viewer
- Authentication throttling and the complete desktop/mobile Playwright journeys received additional regression coverage

## 1.10.0

- A new administrator-only System Overview provides live LXC, Docker, database, storage, and backup health
- A hardened read-only host collector records CPU, memory, uptime, filesystem, and container metrics without exposing the Docker socket to the web application
- Administrators can inspect, filter, auto-refresh, and export recent Docker container logs alongside structured application logs without exposing the Docker socket
- Capacity thresholds classify the deployment as healthy, warning, or critical and provide actionable alerts
- Database backup creation now records non-sensitive recovery metadata for backup age, size, and record-count monitoring
- Docker and Ansible verify application health, expected version, and visibility of the newly deployed container before reporting a successful deployment
- Catalog APIs now return compact card data without embedded video or thumbnail payloads
- Catalog thumbnails are served through a cacheable image resource that works with Next.js image optimization
- Actor rows are capped and loaded only as they approach the viewport, reducing initial database work and transferred data
- Mobile catalog performance is protected by an automated payload budget and a throttled browser scenario
- Login validation, administration navigation, and account controls received localization and accessibility improvements
- Invalid nested account-menu controls no longer cause React hydration errors
- Profile selection and editing now expose localized semantic controls with keyboard focus and browser coverage
- Complex administration and catalog workflows have expanded regression and browser coverage
- SonarQube analysis, deployment documentation, and release tooling were hardened for repeatable local and production checks

## 1.9.2

- Movie upload, chunk upload, media deletion, and legacy actor deletion now require administrator access
- Media paths, upload identifiers, file extensions, chunk counts, and upload sizes are validated server-side
- Direct video uploads stream to disk instead of buffering files of up to two gigabytes in application memory
- Blocked accounts are rejected for credentials and OAuth authentication, and expired temporary blocks are cleared automatically
- Existing sessions propagate the current blocked state and can no longer use protected server helpers while blocked
- Full player and billboard video routes now share the same traversal-safe file resolution, MIME detection, and standards-compliant byte-range streaming
- Draft and archived content can no longer be streamed by regular users through a known content ID
- German and English can now be switched directly from the desktop and mobile admin navigation
- Administration pages, filters, dialogs, forms, dynamic counters, statuses, and upload states now use a consistent selected language
- Content creation and editing now use the administration layout and navigation consistently
- Actors can be created and selected directly while adding new content
- Successfully created content now clears all form, actor, video, thumbnail, and file-input state without requiring a page reload
- Content and dashboard caches are refreshed after creation so newly added entries appear immediately
- Failed content submissions now preserve the entered form values for correction and retrying
- Movie type and genre selectors are controlled correctly and no longer retain stale values after a form reset
- Deployment and database-update handling was hardened for existing movie records
- User settings and administration management pages received visual and usability refinements
- Bug fixes and minor improvements based on SonarQube analysis
- Admin dashboard, catalog, actor, user, analytics, and log workflows now have expanded regression coverage for loading, error, empty, filtering, dialog, export, and mutation states
- Billboard videos now use complete byte-range streaming, restart reliably when content changes, and fall back to the poster if playback fails

## 1.9.0

- The administration area now uses a responsive management dashboard with a dedicated sidebar and shared admin UI components
- Dashboard metrics summarize users, content, actors, views, active profiles, blocked accounts, recent errors, top content, and system activity
- Movie and series management now supports server-side search, filters, sorting, CSV export, content statuses, selection, and bulk publishing or archiving
- The actor directory now supports search, sorting, detail views, renaming, safe deletion, and merging duplicate actors with their content assignments
- User accounts now support server-side pagination, security filters, role changes, detailed profiles, and temporary blocks with reasons
- Analytics now includes selectable periods, view trends, active users, average playback progress, top content, catalog growth, genre distribution, and CSV export
- System logs now support server-side filters, search, auto-refresh, structured details, CSV export, and confirmation-protected clearing of the backend log only
- Administrators can create password-encrypted database backups and restore them through a validation- and confirmation-protected workflow
- Content lifecycle states and extended user blocking metadata were added with a database migration

## 1.8.4

- Actor playlists omit embedded thumbnails to stay within Safari session storage limits
- Administrators can enable global on-device diagnostics with `?debug=1` to trace errors, requests, navigation, network status, and UI interactions

## 1.8.3

- Optional on-device playlist diagnostics can trace Safari touch, storage, and navigation failures

## 1.8.2

- Admin pages and administration APIs now enforce the administrator role without redirecting valid admins to profile selection
- User blocking now uses a valid API route and displays the persisted blocked state
- Player progress autosave no longer sends duplicate updates at ten-second boundaries
- Random playback now records views and adds watched videos to Continue Watching
- Actor names with URL control characters are handled correctly in movie and series lists
- Prisma connections remain available across concurrent API requests instead of being disconnected per request
- Linting is compatible with Next.js 16 and checks production source files again
- UI improvements

## 1.8.0

- Randomized actor playlists are now available.
- German and English can be selected across the entire application
- Continue Watching shows the four most recently viewed videos below 60 percent progress
- Actor rows hide navigation arrows at their boundaries and support native horizontal swiping on mobile devices
- Actor playlist buttons now have a reliable mobile touch target above the swipe area

## 1.7.4

- Volume and mute settings are now saved in localStorage and restored on page load
- Updated dependencies for improved performance and security

## 1.7.3

- Bug fixes for back navigation

## 1.7.2

- Bug fixes for footer layout
- Bug fixes for search functionality

## 1.7.1

- Bug fixes by random generated movies and series

## 1.7

- Changelog introduced
- Watch History page added
- Bug fixes and minor improvements with Sonarqube analysis

## 1.6.4

- Bug fixes and minor improvements

## 1.6.3

- Bug fixes and minor improvements

## 1.6.2

- Bug fixes and minor improvements

## 1.6.1

- Bug fixes and minor improvements

## 1.6.0

- Logging introduced for all backend activities

## 1.5.0

- Admin page introduced
- User management
- Actor management
- Movie management
- Statistics

## 1.4.0

- Backend rework
- Improved performance
- Video streaming introduced for faster loading times

## 1.3.0

- Playlists introduced
- Create, edit, and delete playlists
- Movies page updated

## 1.2.0

- Random page added

## 1.1.0

- Bug fixes and minor improvements

## 1.0.0

- First release of the Netflix app
