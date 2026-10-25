# Changelog

Die aktuelle Version wird mit `[current]` markiert und automatisch aus `package.json` eingesetzt.

Ältere Einträge wurden anhand der vollständigen Git-Historie rekonstruiert.
Reine Merge-Commits und wiederholte Dependency-/Lockfile-Aktualisierungen sind
jeweils im zugehörigen fachlichen Eintrag zusammengefasst.

## [current]

- Ein vorbereitetes Startskript lädt ein geprüftes 8B-Bildmodell für Apple-Silicon-Macs; die lokale Anwendung unterstützt einen konfigurierbaren Modelldienst und getrennte Modellkennungen für spätere Vergleiche

- Die lokale Fehleransicht speichert tatsächlich analysierte Einzelbilder und getrennte Modellantworten, erklärt mögliche Ursachen von Abweichungen und erlaubt versionierte Sichtbarkeitsbewertungen sowie eine unverbindliche Vorschau der Konfidenzschwelle; Originalbewertungen und historische Ergebnisse bleiben erhalten

- Ein lokaler Vergleichslauf prüft markierte Videostellen gegen gespeicherte Kategoriebewertungen, zeigt Fortschritt und Ergebnisse pro Kategorie und hält Bewertungen, Modellprofil und Konfidenzschwelle je Lauf fest; unsichere Angaben bleiben unbewertet und veränderte Quellen werden übersprungen

- Der Import-/Export-Bereich für globale Kategorien bietet getrennte Karten, eine gestaltete Dateiauswahl mit Drag-and-drop und eine übersichtliche Vorschau mit Kennzahlen und zweisprachiger Tabelle für Desktop und Mobilgeräte
- Die Kategorienverwaltung exportiert deutsche und englische Namen als JSON und importiert sie mit Vorschau, Bestätigung und begrenzter Dateigröße; vorhandene IDs und Zuordnungen bleiben erhalten, doppelte Namen werden abgelehnt
- Die Abschnittsbewertung erklärt leere Suchergebnisse und fehlende Bewertungen; neue Kategorien lassen sich direkt zweisprachig anlegen und bewerten, sodass der Speicherablauf vollständig in der Ansicht möglich ist
- Eine Bewertungsansicht markiert Videostellen mit Start- und Endzeit und speichert positive, negative und unsichere Kategoriebewertungen; Abschnitte lassen sich bearbeiten, löschen, wiederholt abspielen und ohne Mediendateien exportieren
- Katalog-spezifische Modellvorgaben werden aus einer ignorierten lokalen Env-Datei geladen; lokale Daten und Sicherungen bleiben außerhalb von Git und Docker-Images
- Ein auf den Videokatalog abgestimmtes Analyseprofil prüft mehr zeitlichen Kontext und größere Vorschaubilder; strengere Evidenzregeln, Mindestwerte und wiederholte Fundstellen begrenzen unbelegte neue Vorschläge, während vorhandene Treffer bei neuen Vorschlägen sichtbar bleiben
- Der lokale Modellserver nutzt einen begrenzten RAM-Cache und mehr Bild- und Kontext-Token; veraltete Teilanalysen werden bei Profilwechsel nicht mit neuen Einstellungen vermischt
- Kategorien und KI-Vorschläge erhalten deutsche und englische Namen unter einer gemeinsamen ID; Verwaltung, Auswahl und Inhaltsdetails berücksichtigen die gewählte Sprache, und neue Kategorien benötigen beide Namen
- Die Videoanalyse entdeckt Kategorien jetzt zuerst ohne Vorgaben und gleicht vorhandene Kategorien anschließend separat ab; dadurch verdrängen bestehende Kategorien keine neuen Vorschläge mehr, und erneute Analysen verwenden eine neue Analyseversion
- Eine lokale GPU-Videoanalyse sammelt Vorschläge für vorhandene und neue Kategorien; Administratoren prüfen Fundstellen mit Zeitstempeln und übernehmen oder verwerfen Vorschläge ausdrücklich, wobei neue Kategorien erst bei der Übernahme entstehen
- Die Analyse nutzt ein lokales Qwen3-VL-Modell mit optionalem Docker-Compose-Profil für NVIDIA-GPUs; Fortschritt, Abbrechen, Wiederaufnahme und zwischengespeicherte Teilergebnisse sind in die Hintergrundjobs integriert
- Eine eigene Kategorienverwaltung ermöglicht das Anlegen, Umbenennen und bestätigte Löschen frei definierter Kategorien; Filme und Serien können mehrere Kategorien erhalten, die beim Bearbeiten erhalten bleiben und in den Inhaltsdetails angezeigt werden

## 1.14.1

- Die Darstellerauswahl merkt sich im Browser die drei zuletzt ausgewählten Darsteller und zeigt sie ohne Suchtext zuerst; bei einer Suche bleibt die normale Reihenfolge der passenden Ergebnisse erhalten
- Ausgewählte generierte Vorschaubilder lassen sich in Fünf-Sekunden-Schritten vor- und zurückversetzen; Zeitstempel, Ladeanzeige und Begrenzung auf die Videolänge unterstützen die Feinwahl, während fehlgeschlagene Aufnahmen das bisherige Bild erhalten
- Die Thumbnail-Auswahl zeigt die Generierung mit Live-Fortschritt, Platzhaltern und einzeln erscheinenden Bildern samt Video-Zeitstempel; parallele Generierung wird verhindert, Fehler und Zeitüberschreitungen erlauben einen erneuten Versuch
- Das Produktionsimage enthält nicht mehr den großen Next.js-Turbopack-Buildcache; das Deployment entfernt vor dem Pull und nach erfolgreichem Start alle Images, die kein Container verwendet, und gibt so Speicherplatz frei

## 1.14.0

- Erweiterte Verhaltenstests schließen kleine Coverage-Lücken bei Player, Playlists, Katalog, Anmeldung, Sitzungen, Admin-Oberflächen, API-Fehlerfällen und Hintergrundjobs
- SonarQube-Korrekturen verbessern HTML-Semantik und Statusmeldungen von Suche und Player, vereinfachen die Player-Komponente und erhalten die Tastatursteuerung; echte WebVTT-Untertitelspuren können dem Player übergeben werden
- Ein eigener Videoplayer mit deutscher und englischer Oberfläche ersetzt die Browser-Steuerung für Einzelvideos, normale Playlists, automatische Favoriten-Playlists und temporäre Zufallsplaylists
- Der Player zeigt Videotitel, Playlistname und aktuelle Position; eine aufklappbare Titelliste ermöglicht direkte Auswahl sowie Wechsel zum vorherigen und nächsten Video
- Ein abbrechbarer Fünf-Sekunden-Countdown startet den nächsten Playlist-Titel automatisch; sofortiges Abspielen und eine dauerhaft abschaltbare Autoplay-Einstellung stehen ebenfalls zur Verfügung
- Eigene Wiedergabesteuerung mit Zeitleiste, Zeit- und Pufferanzeige, Zehn-Sekunden-Sprüngen, Lautstärke, Stummschaltung und Geschwindigkeiten von 0,5× bis 2×
- Vollbild bleibt bei Playlist-Wechseln erhalten; unterstützte Browser bieten Bild-in-Bild, Tastatursteuerung und nach Inaktivität ausblendbare Bedienelemente für Desktop und Mobilgeräte
- Profilbezogener Wiedergabefortschritt wird regelmäßig sowie beim Pausieren, Verlassen und Titelwechsel gespeichert; der Player setzt nach dem Laden der Metadaten fort und berücksichtigt auch beim Zurückwechseln den zuletzt gespeicherten Stand
- Lautstärke, Stummschaltung und Wiedergabegeschwindigkeit bleiben im Browser gespeichert; blockiertes Autoplay, Ladezustände, Speicherfehler und nicht abspielbare Videos werden verständlich behandelt, einschließlich Wiederholen und weiterhin bedienbarer Playlist
- Normale Playlist-Karten entsprechen jetzt der Favoriten-Karte: einheitliche 16:9-Vorschau, Kartenhöhe, Titelanzahl und bündige rote Abspielbuttons; Bearbeiten und bestätigtes Löschen bleiben auf Desktop und Mobilgeräten erreichbar
- Playlist-Vorschaubilder nutzen eine gemeinsame Darstellung mit Einzelbild oder Vierer-Collage, einschließlich genau vier Titeln, und einem Fallback für fehlende Vorschaubilder
- Eine separate lokale Docker-Compose-Umgebung baut die Anwendung aus dem Quellcode und startet PostgreSQL, Redis, Hintergrund-Worker und Mailpit ohne Abhängigkeiten von der Produktionsumgebung
- Der lokale Stack initialisiert Datenbankschema und Job-Queue vor dem App-Start; eigene Daten- und Medien-Volumes sowie installationsabhängige lokale Zugangsdaten bleiben über Neustarts erhalten
- Ein wiederholbarer, auf die lokale Umgebung begrenzter Seed ergänzt Admin- und Benutzerkonto, Profile, 16 Filme und Serien, vier Schauspieler, Favoriten, Watchlists, Playlists und Wiedergabefortschritt, ohne bestehende Konten oder bearbeitete Inhalte zu überschreiben
- Lokal erzeugte zwölf Sekunden lange Testvideos mit Ton ermöglichen echte Wiedergabe-, Such- und Playlist-Tests; Auth-E-Mails können im lokalen Mailpit-Postfach geöffnet werden
- Vier mit Imagegen erzeugte Profilbilder – Fuchs, Eule, Panda und Astronaut – stehen im lokalen Seed zur Auswahl; bestehende Demo-Profile mit dem ursprünglichen Standardbild werden aktualisiert und selbst gewählte Bilder bleiben erhalten
- README und ergänzende Anleitungen dokumentieren lokalen Docker-Betrieb, Seeding, Profilbild-Generierung und Player-Bedienung einschließlich Tastenkürzeln und Medienvoraussetzungen

## 1.13.6

- Jedes Profil erhält eine automatische Playlist „Favoriten“, die beim Hinzufügen und Entfernen von Favoriten aktuell bleibt und direkt abgespielt werden kann

## 1.13.5

- Die Fehlerseite der Anmeldung beendet beim Zurückkehren die alte Sitzung, zeigt verständlichen Fehlertext und verhindert so ein Festhängen mit gesperrten oder widerrufenen Sitzungen
- In der Darstellerliste im Adminbereich ist der erste hinterlegte Quellenlink direkt aufrufbar
- Fehlerantworten beim Hinzufügen oder Entfernen von Darstellerquellen werden angezeigt, ohne die Übersicht abstürzen zu lassen
- Die Seite zum Anlegen neuer Inhalte berücksichtigt die gewählte Sprache auch bei Hinweisen, Speichern, Uploads, Vorschaubildern und Formularmeldungen
- Erfolgreiche Video-Uploads werden im Browser-Tab durch einen Hinweis im Seitentitel angezeigt; beim Zurückkehren zum Tab oder Starten eines neuen Uploads wird der ursprüngliche Titel wiederhergestellt

## 1.13.4

- Adminaktionen auf den Seiten Inhalte, Darsteller und Benutzer zeigen nun Tooltips mit einer kurzen Beschreibung der jeweiligen Aktion
- Darstellerprofile können externe Quellenlinks speichern und öffnen, um Film- und Serienauftritte nachzuschlagen
- Die Darstellerübersicht öffnet sich als kompakter zentrierter Dialog mit festem Kopfbereich, aufklappbarem Quellenformular und responsivem Inhaltsraster
- Dropdown-Pfeile im Adminbereich sind einheitlich nach links eingerückt
- Bearbeiten-Schaltflächen für Filme und Serien werden nur noch im Adminbereich angezeigt
- Die Startseite zeigt unter „Neu“ die acht zuletzt hinzugefügten Filme und Serien gemeinsam in zwei Reihen

## 1.13.3

- Mobile navigation now keeps the catalog control, search field, and profile menu within narrow viewports without clipping the header

## 1.13.2

- Search now shows a live, grouped preview after three characters with up to five actors and five catalog results per configured content type
- The search field and preview use a compact responsive layout with a custom clear control, subtle staging badges, and accessible loading, error, and empty states

## 1.13.1

- Information modals now animate their border and content together, while long descriptions keep the primary controls visible throughout opening and closing
- My List is now presented as Favorites with a useful empty state and accessible empty or filled heart controls on catalog items
- Billboard titles and descriptions now shrink and truncate within mobile height budgets instead of pushing playback and information controls off-screen
- Mobile administration navigation now includes a path back to the regular catalog, and remaining mobile navigation and catalog labels are localized
- Mobile catalog rows hide native scrollbars while preserving horizontal touch scrolling and include a ten-title staging actor fixture for regression checks
- Open clients now detect deployment updates, reload automatically when no dialog is active, and otherwise present a localized update notice that administrators can disable globally
- Runtime and development dependencies received compatible patch and minor updates, including fixes for the audited Playwright, brace-expansion, js-yaml, and nanoid advisories

## 1.13.0

- An isolated, non-durable Redis runtime now provides environment-scoped caching with ACL credentials, bounded timeouts, LFU eviction, and a circuit breaker
- The administrator System Overview now reports Redis connectivity, command latency, errors, reconnects, fallbacks, and cache hits and misses
- Shared movie and series catalog metadata is cached in Redis for five minutes while profile watch progress remains current in PostgreSQL
- Catalog cache misses, invalid values, timeouts, disabled Redis, and write failures fall back safely to PostgreSQL without failing the user request
- Authentication throttling now atomically increments Redis account and shared-IP budgets while PostgreSQL remains the fail-closed authority across outages, eviction, restarts, and rolling deployments
- Durable PostgreSQL-backed background jobs now support idempotent submission, bounded progress, retries, cooperative cancellation, dead letters, retention, and graceful worker drain while Redis coordination remains expendable
- Administrators can inspect bounded job lifecycle data, retry or cancel permitted work, and distinguish healthy, stale, disconnected, and degraded Redis or worker states
- A consolidated Redis resilience suite now covers fallback parity, latency, circuit recovery, restart data loss, memory-pressure eviction, duplicate delivery, stale leases, worker failure, and deployment drain
- The Redis operations runbook now documents capacity signals, outage and rollback drills, safe disablement, privacy-safe evidence collection, and the complete 1.13 release gate
- Administrators can configure persistent weekly schedules for verified PostgreSQL backups and full catalog media-health scans by weekday, time, and time zone
- Scheduled runs use the durable job queue, remain visible in Job Operations, revalidate administrator ownership, and bridge backup creation through a hardened host-only systemd path unit

## 1.12.1

- QR-assisted device login now lets an authenticated phone scan and explicitly approve a separate target-device session
- Pairing requests use short-lived hashed one-time secrets, bounded polling, cancellation, expiration, and independent session revocation
- Device approval requires recent password authentication and returns the approver to Settings after a successful confirmation
- Settings now includes the QR scanner alongside account and security controls with mobile-safe sizing and overflow behavior
- Authentication events can be reviewed separately from general application and container logs in the administration log page
- Desktop and mobile browser coverage verifies pairing approval, target-session exchange, protected access, and responsive Settings behavior

## 1.12.0

- Administrator operations now have a typed, privacy-safe, append-only PostgreSQL audit foundation with bounded retention and isolated integration coverage
- Existing content, actor, user-security, and backup mutations now record correlated success, denial, and controlled-failure audit outcomes without changing their public results
- Administrators can now search, filter, paginate, inspect, and safely export the retained audit history from a responsive bilingual management page
- A read-only media integrity engine now validates published videos and thumbnails, probes streams and codecs with bounded ffprobe workers, detects duplicates and orphaned videos, and persists privacy-safe scan findings with bounded retention
- The production image now includes a pinned static ffprobe runtime with roughly 55 MB of uncompressed overhead instead of the substantially larger Debian FFmpeg dependency tree
- Administrators can now review media-health summaries, stale or unavailable scanner states, filtered findings, remediation guidance, and direct content-editing links from a responsive bilingual dashboard
- Full-catalog and single-content scans can be started from the administration area, are correlated with audit outcomes, and only report success after findings have been persisted
- A PostgreSQL-backed active-scan lock rejects duplicate concurrent catalog scans, while bounded runtime file access keeps media inspection out of the production bundle trace
- Every deployment PostgreSQL dump is now restored into a disposable network-isolated PostgreSQL instance before migrations can run, with explicit archive and version compatibility checks
- Backup verification publishes only bounded checksum, version, timing, schema, and representative-record evidence while keeping dumps, database URLs, credentials, and raw diagnostics outside the application container
- Administrators can inspect the last recovery verification and request a serialized recheck of the latest host dump from the backup page without browser access to Docker or PostgreSQL
- Every deployment attempt now publishes a bounded Ed25519-signed Deployment Record covering image identity, migrations, health checks, rollback, and its verified backup reference
- The admin System Overview distinguishes current, stale, unavailable, and tampered local or explicitly approved peer records without receiving Docker, SSH, or signing-key access
- Failed and partially completed deployments remain visible after Ansible exits, while successful rollbacks replace them with signed recovery evidence

## 1.11.0

- Login, registration, password reset, password renewal, verification, and authentication errors now share a responsive visual system
- The authentication experience now includes a large-screen product overview while remaining compact and overflow-safe on mobile devices
- Authentication forms now provide consistent field icons, password-manager metadata, localized validation, pending states, and live status announcements
- Authentication navigation, language switching, headings, focus states, and social-provider controls received accessibility improvements
- Registration and email-verification metadata now describe the correct page instead of reusing unrelated titles
- Auth regression tests now focus on semantics, accessibility, navigation, responsive contracts, and native input behavior instead of brittle implementation details
- Authentication commands now run through one typed service boundary with normalized identities and stable result codes
- Registration, login, recovery, verification, and two-factor flows now enforce the shared 12-character password policy, safe duplicate handling, and non-disclosing public responses
- Authentication mail uses validated SMTP settings, localized templates, awaited delivery, and a canonical public URL instead of fixed provider configuration
- Verification, password-reset, and two-factor tokens are purpose-bound, stored only as hashes, account-bound where possible, and consumed atomically
- Authentication rate limits are persisted in PostgreSQL, retain shared IP budgets after successful logins, and trust forwarding headers only through an explicit proxy-hop policy
- Authentication security logs now replace email identities with stable keyed hashes and omit credentials, tokens, and one-time codes
- Password fields now include visibility controls, Caps Lock feedback, confirmation progress, and accessible password requirements
- Registration and password recovery now switch to dedicated check-your-email states with expiry guidance and server-aware resend countdowns
- Public authentication forms remain disabled until hydration and use POST as their native fallback, preventing credentials from appearing in URLs during early interaction
- PostgreSQL authentication rate-limit windows now remain correct when the database server uses a non-UTC timezone
- Desktop and mobile browser coverage now exercises registration and reset success states, keyboard resend, shared rate limits, and redirect races
- Deployments now target an isolated staging LXC by default and require a successful same-version staging promotion before production
- Environment markers, health metadata, and database identity checks prevent staging deployments from reaching production infrastructure
- A guarded staging-only bootstrap initializes and baselines a verified empty PostgreSQL database without resetting existing data
- Staging deployments now provision the configured E2E user and administrator idempotently from a protected host-only environment file
- Every staging page now carries a fixed, accessible environment badge while production remains unmarked
- Staging now receives a deterministic catalog plus ffprobe-validated H.264/AAC movie and series fixtures for real player, seek, range, and billboard tests
- Local catalog thumbnails are now returned as non-empty image responses instead of redirects that break Next.js image optimization
- JWT sessions are now individually registered and can be revoked across devices without signing out the current device
- Password resets, password and email changes, MFA changes, account blocks, and explicit sign-out now invalidate affected sessions
- Account settings now show privacy-safe recent security activity with bounded 90-day retention
- Auth handlers and the request proxy now share one session-identity mapper, preventing valid sessions from being rejected after login
- An opt-in passkey pilot now supports discoverable WebAuthn login for existing verified accounts while retaining password, MFA, and recovery flows
- Passkey enrollment and management require five-minute session-bound reauthentication, expose device metadata and labels, and prevent removal of the final usable sign-in method
- Passkey RP ID, canonical origin, HTTPS, signature-counter, ownership, and existing-user rules are enforced and covered by unit and PostgreSQL 18 integration tests
- The changelog now presents release statistics, a highlighted current version, and a responsive accessible release timeline
- Production and staging now use stable LAN hostnames with Caddy-managed internal HTTPS, certificate-validating deployment health checks, and localhost-only direct application ports
- The Changelog is now reachable without signing in and no longer inherits the protected application layout
- A sticky, keyboard-accessible version index now links directly to every release in the Changelog
- A floating, keyboard-accessible Back to top shortcut now returns readers to the Changelog heading without client-side JavaScript

## 1.10.1

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

## 1.9.3

- An initial administrator-only system overview reports host, Docker, database, filesystem, backup, and application-health information
- A read-only LXC monitoring agent and systemd timer collect CPU, memory, uptime, storage, and container telemetry without mounting the Docker socket into the application
- Backup operations now publish non-sensitive status metadata for the administration overview
- The public health page and `/api/health` checks were expanded for deployment verification
- Production genre selection is restricted to the configured `NEXT_PUBLIC_GENRE` allowlist while existing stored genres remain editable
- PowerShell and shell SonarQube launchers now accept explicit server and token parameters and wait for the Quality Gate
- SonarQube configuration, coverage paths, README guidance, and deployment documentation were consolidated
- System-monitoring, backup-status, health-route, genre-policy, layout, and administration tests were added

## 1.9.2

- Movie upload, chunk upload, media deletion, and legacy actor deletion now require administrator access
- Media paths, upload identifiers, file extensions, chunk counts, and upload sizes are validated server-side
- Direct video uploads stream to disk instead of buffering files of up to two gigabytes in application memory
- Blocked accounts are rejected for credentials and OAuth authentication, and expired temporary blocks are cleared automatically
- Existing sessions propagate the current blocked state and can no longer use protected server helpers while blocked
- Full player and billboard video routes now share the same traversal-safe file resolution, MIME detection, and standards-compliant byte-range streaming
- Draft and archived content can no longer be streamed by regular users through a known content ID
- Deployment and database-update handling was hardened for existing movie records
- User settings and administration management pages received visual and usability refinements
- Bug fixes and minor improvements based on SonarQube analysis
- Admin dashboard, catalog, actor, user, analytics, and log workflows now have expanded regression coverage for loading, error, empty, filtering, dialog, export, and mutation states
- Billboard videos now use complete byte-range streaming, restart reliably when content changes, and fall back to the poster if playback fails
- A production health endpoint and browser health page now expose deployment readiness without revealing sensitive configuration
- The Docker image now uses a smaller multi-stage runtime, includes required compatibility packages, and preserves the Changelog in the final image
- Deployment scripts retry registry DNS and image pulls, retain rollback images, and avoid destructive database resets
- Dependency resolutions and the vendored `brace-expansion` compatibility package make frozen Yarn installs reproducible inside Docker
- Log access and SonarQube exclusions were tightened while maintaining administrator diagnostics

## 1.9.1

- German and English can now be switched directly from desktop and mobile administration navigation
- Administration pages, filters, dialogs, forms, counters, statuses, and upload states use one shared language provider
- Content creation and editing now use the administration layout and navigation consistently
- The movie edit page was moved into the current administration design while preserving legacy-route compatibility
- Actors can be created and selected inline while adding new content
- Successfully created content clears form, actor, video, thumbnail, and file-input state without requiring a reload
- Content and dashboard caches are refreshed after creation so new entries appear immediately
- Failed submissions preserve entered values for correction and retrying
- Movie type and genre selectors no longer retain stale values after a reset
- Billboard streaming gained reusable byte-range handling and more reliable playback fallback behavior
- Thumbnail previews retain their aspect ratio without zooming or overlapping surrounding content
- Form-state, inline-actor, language-provider, billboard-streaming, navigation, and edit-page regressions received dedicated tests
- Runtime and development dependencies were refreshed without changing the deployment contract

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
- Debug sessions can be enabled without rebuilding the application and keep their captured context within the affected browser
- Diagnostic output was added to the existing administration and troubleshooting workflow without exposing it to ordinary sessions

## 1.8.3

- Optional on-device playlist diagnostics can trace Safari touch, storage, and navigation failures
- Actor-playlist navigation now records the sequence needed to diagnose mobile Safari failures without changing normal playback behavior

## 1.8.2

- Admin pages and administration APIs now enforce the administrator role without redirecting valid admins to profile selection
- User blocking now uses a valid API route and displays the persisted blocked state
- Player progress autosave no longer sends duplicate updates at ten-second boundaries
- Random playback now records views and adds watched videos to Continue Watching
- Actor names with URL control characters are handled correctly in movie and series lists
- Prisma connections remain available across concurrent API requests instead of being disconnected per request
- Linting is compatible with Next.js 16 and checks production source files again
- Shared billboard and actor-filter components replace duplicated movie and series implementations
- The watchlist gained dedicated persistence actions, API routes, hooks, pages, and navigation
- API response and error handling was consolidated in shared helpers across catalog routes
- Movie cards, modals, navigation, administrative tables, authentication pages, and mobile layouts received UI and accessibility corrections
- Temporary-upload cleanup, validation, logging, and proxy handling were hardened
- SonarQube findings across actions, routes, hooks, components, and administration pages were resolved

## 1.8.0

- Randomized actor playlists are now available
- German and English can be selected across the entire application
- Continue Watching shows the four most recently viewed videos below 60 percent progress
- Actor rows hide navigation arrows at their boundaries and support native horizontal swiping on mobile devices
- Actor playlist buttons now have a reliable mobile touch target above the swipe area
- Movie and series billboards share consistent playback and information controls
- Random, actor, search, playlist, and watch pages preserve navigation state more reliably

## 1.7.4

- Volume and mute settings are now saved in localStorage and restored on page load
- Watch-page playback state survives component updates without resetting the selected volume
- Random playback and direct movie playback use the same persisted audio behavior
- Dependencies and lockfiles were refreshed for performance, compatibility, and security
- Watch-page and changelog regressions were corrected after the dependency update

## 1.7.3

- Playback buttons and restart controls now use consistent navigation behavior
- Back navigation from the player no longer returns users to an invalid state
- Search results correctly handle route changes and updated query values
- Dependency and lockfile maintenance removed obsolete transitive packages
- README and version metadata were synchronized with the delivered release

## 1.7.2

- Ansible inventories are generated from ignored environment-specific configuration instead of being committed
- Deployment gained PowerShell orchestration, Docker Compose templates, SSH configuration, and clearer operational documentation
- Search API routing was restored after the deployment reorganization
- Footer version and navigation behavior were corrected across protected pages
- Production host details were removed from version control

## 1.7.1

- Movies and series now use dedicated random endpoints and hooks instead of sharing an ambiguous response path
- Random home-page rows load movie and series results independently
- Billboard selection and random-page rendering handle empty or unavailable results safely
- Footer and version metadata now show the correct maintenance release
- Random-route, hook, footer, and home-page behavior received regression tests

## 1.7.0

- The in-application Changelog was introduced with protected routing and release rendering
- A dedicated watchlist page, persistence actions, API route, and hooks were added
- Movie and series billboards and filter rows were consolidated into reusable base components
- Catalog API responses and errors now use shared helpers instead of duplicated route logic
- Movie cards, administration tables, uploads, authentication, playlists, profiles, and responsive navigation received a broad SonarQube cleanup
- Video and thumbnail upload controls were split into focused reusable components
- Jest, Testing Library, shared setup, coverage reporting, and cross-platform test launchers were introduced
- Action, API, hook, component, page, authentication, administration, playlist, player, and UI primitives gained extensive regression coverage
- Initial coverage reached 30.8 percent and was subsequently expanded across nearly every application page
- Docker build tooling, version metadata, testing guides, and SonarQube configuration were added or updated

## 1.6.4

- Maintenance work consolidated the 1.6 administration and logging fixes before the 1.7 refactor
- The repository contains no dedicated 1.6.4 release commit; its changes are represented by the surrounding 1.6 maintenance history

## 1.6.3

- Maintenance work consolidated upload, statistics, and administration corrections after 1.6.2
- The repository contains no dedicated 1.6.3 release commit; its changes are represented by the surrounding 1.6 maintenance history

## 1.6.2

- Administrative movie and actor loading moved to dedicated endpoints and hooks
- Chunked uploads gained more reliable state handling and cleanup of abandoned temporary files
- Scheduled cleanup scripts remove stale upload fragments safely
- Movie updates, actor management, statistics, and add/edit forms received correctness fixes
- Dependencies were refreshed on the maintained 1.6 branch

## 1.6.1

- Administrators can clear stored application logs through a dedicated endpoint
- Log, actor, statistics, footer, and billboard presentation issues were corrected
- Administration overview calculations and charts return consistent values
- Movie and series billboards share corrected responsive sizing

## 1.6.0

- Structured logging was introduced across authentication, profiles, favorites, playlists, watch progress, catalog mutations, uploads, and administration actions
- Administrators gained a searchable log page backed by dedicated read and clear APIs
- Administration pages use shared live counters and improved actor, movie, and statistics queries
- API routes report failures consistently while retaining actionable server diagnostics
- Admin navigation, footer links, tables, charts, and protected layouts were refined

## 1.5.1

- Movie creation and updates gained stronger validation and clearer error logging
- Administration gained log navigation, user and actor refinements, and improved overview statistics
- Movie management tables display more useful state and actions
- New bar-chart summaries complement the existing administration statistics
- Footer and mobile administration navigation were aligned with the expanded management area

## 1.5.0

- A dedicated protected administration area was introduced
- User management supports account inspection and blocking controls
- Actor management supports listing, creation, editing, and deletion
- Movie management supports adding, updating, deleting, and reviewing catalog entries
- Administration statistics summarize users, content, actors, and viewing activity
- Video add and edit workflows were redesigned around chunked uploads and streaming-compatible media paths
- The administration navigation, tables, actors, and responsive layouts were reworked
- Proxmox/LXC and Docker deployment compatibility was added
- `MovieAdminTable` rendering and management actions were corrected before release

## 1.4.0

- Authentication forms, validation, tokens, and server actions received a broad backend rework
- Movie and series loading was reorganized to reduce duplicate requests and improve page performance
- Video streaming and watch-page behavior were corrected for direct and playlist playback
- Movie creation gained improved validation, upload progress, thumbnail selection, and responsive layout
- Administrators gained the first complete movie edit flow, including actor assignments and media updates
- Actor names link directly to filtered search results
- Playlist and movie routes return their entries in a stable order
- Next.js, Axios, Yarn dependencies, and build configuration were updated throughout the maintenance cycle
- Cache-poisoning mitigations and response-header controls were added
- Deployment notifications can report script completion to Discord
- Runtime, network, and Proxmox-oriented configuration was updated without embedding credentials
- Add/edit layouts and package compatibility were corrected before the administration rework

## 1.3.0

- Playlists were introduced with creation, editing, deletion, and dedicated list pages
- Movies can be added, removed, reordered, and played from a playlist
- Duplicate playlist entries are rejected instead of being stored twice
- Playlist covers, cards, modals, and watch pages gained responsive UI and error handling
- Playlist navigation and playback routes preserve the configured item order
- Movie pages and shared cards were updated to expose playlist actions
- SonarQube cleanup standardized imports and improved code quality across playlist components

## 1.2.0

- A random-play page was added for immediate movie or series discovery
- Random selection APIs and navigation were integrated with the existing catalog
- Static response headers and caching behavior were adjusted for the new route

## 1.1.0

- Dependency and lockfile updates improved framework compatibility after the initial release
- Build, rendering, and responsive UI issues were corrected across catalog pages
- Initial PowerShell, shell, Docker, and Ansible deployment helpers were added
- Application headers and static-route behavior were configured for self-hosted deployment
- Profile, catalog, and playlist groundwork was cleaned up before the next feature releases

## 1.0.0

- The project was initialized as a self-hosted Netflix-style application
- Login, registration, authentication, protected routes, and account recovery were implemented
- Movie and series catalogs gained billboards, cards, horizontal rows, detail modals, and dedicated pages
- Responsive mobile layouts were added throughout authentication, profiles, navigation, and catalog browsing
- Users can create, select, edit, and remove profiles with configurable profile images
- Movie creation and media upload formed the first administration workflow
- Video playback records and restores watch progress and displays progress bars on catalog cards
- Movie and series pages gained incremental loading and initial performance optimizations
- Titles, favicon, runtime process configuration, Prisma integration, and production build fixes were added
- Form validation was introduced across authentication and content workflows
- Cache and response handling were hardened against known Next.js cache-poisoning behavior
- A major authentication and server-function rework completed the first stable application release
