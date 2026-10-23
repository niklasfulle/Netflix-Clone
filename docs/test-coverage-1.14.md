# Testabdeckung 1.14

Stand: 23.10.2026. Vollständiger Jest-Lauf mit LCOV; TypeScript-Prüfung ohne Fehler.

## Ergebnis

- 284 Dateien mit vollständiger Zeilen- und Bedingungsabdeckung; vorher 162.
- 122 von 163 anfänglichen kleinen Lücken vollständig geschlossen. Als kleine Lücke wurden höchstens fünf fehlende Zeilen und acht fehlende Bedingungen ausgewählt.
- Zeilen: 90.23 %. Bedingungen: 79.76 %.
- 403 Testsuiten und 7.571 Tests erfolgreich; 7 Suites und 22 Tests weiterhin übersprungen.

## Ergänzte Verhaltenstests

Player und Wiedergabe: Playlist-Wechsel, Autoplay, Countdown, Fortschritt, Speicherfehler, Vollbild, Bild-in-Bild, Tastatur, Sichtbarkeitswechsel und fehlende Medien.

Katalog und Oberfläche: Suche, Favoriten, Playlist-Cover, Navigation, Ladezustände, fehlende Metadaten, leere Genres, Pagination und SWR-Anbindung.

Authentifizierung und Sicherheit: Formularfehler, E-Mail-Wiederholung, MFA-Ablauf und Recovery, Passkey-Konfiguration, QR-Kamera, Gerätefreigabe, Session-Widerruf und datensparsame Telemetrie.

Server und Hintergrundarbeit: Berechtigungsfehler, gelöschte Datensätze, beschädigte Redis-Daten, Datenbankausfälle, Health-Checks, Audit-Export, Job-Duplikate, atomare Veröffentlichung, Leases, Aufbewahrung, Backup-Abbruch und Polling-Grenzen.

## Verbleibende kleine Restlücken

Diese Liste bildet den LCOV-Stand ab und behauptet keine vollständige Projektabdeckung. Coverage-Ausnahmen und Schwellenwerte wurden dafür nicht gelockert.

Einige Restbedingungen sind durch vorgelagerte Validierung oder die Oberfläche abgesichert: nichtleere Darstellerlisten nach Zod-Validierung; gesperrte Playlist-Aktionen ohne ID; Browser-Prüfungen innerhalb von useEffect; nicht gesetzte Refs bei bereits entfernten Event-Handlern; unbekannte Ergebnis-Codes trotz vollständiger typisierter Zuordnung. Weitere Restwerte betreffen konfigurationsabhängige Varianten, dynamisch gemockte Importe oder defensive Fehlerpfade. Sie sind anhand der nachstehenden Liste weiterhin sichtbar.

| Datei | Fehlende Zeilen | Fehlende Bedingungen |
| --- | ---: | ---: |
| `actions/settings.ts` | 0 | 1 |
| `actions/add/add-movie.ts` | 0 | 1 |
| `actions/add/update-movie.ts` | 0 | 1 |
| `actions/watch/add-to-watchlist.ts` | 1 | 1 |
| `app/(protected)/admin/logs/page.tsx` | 2 | 2 |
| `app/(protected)/admin/movies/page.tsx` | 1 | 1 |
| `app/(protected)/admin/statistics/page.tsx` | 2 | 1 |
| `app/(protected)/playlists/_components/PlaylistAddCard.tsx` | 0 | 1 |
| `app/(protected)/playlists/_components/PlaylistCard.tsx` | 0 | 2 |
| `app/(protected)/settings/_components/qr-device-scanner.tsx` | 0 | 1 |
| `app/api/catalog/thumbnails/[movieId]/route.ts` | 1 | 1 |
| `app/api/continue-watching/route.ts` | 0 | 1 |
| `app/api/movies/random/route.ts` | 0 | 1 |
| `app/api/playlist/[playlistId]/route.ts` | 1 | 1 |
| `app/api/series/random/route.ts` | 0 | 1 |
| `app/api/video/[videoId]/route.ts` | 0 | 2 |
| `app/api/video/billboard/[videoId]/route.ts` | 0 | 2 |
| `components/AccountMenu.tsx` | 0 | 1 |
| `components/BillboardBase.tsx` | 0 | 2 |
| `components/FilterRowBase.tsx` | 2 | 4 |
| `components/InfoModal.tsx` | 0 | 2 |
| `components/MovieFormFields.tsx` | 1 | 2 |
| `components/Row.tsx` | 0 | 1 |
| `components/ThumbnailSelector.tsx` | 0 | 1 |
| `components/auth/auth-email-sent.tsx` | 0 | 1 |
| `components/auth/new-password-form.tsx` | 0 | 4 |
| `components/auth/new-verification-form.tsx` | 0 | 1 |
| `components/auth/qr-device-approval.tsx` | 0 | 1 |
| `components/auth/register-form.tsx` | 0 | 3 |
| `components/auth/reset-form.tsx` | 0 | 1 |
| `components/ui/form.tsx` | 1 | 1 |
| `components/ui/multi-select.tsx` | 0 | 1 |
| `lib/api-helpers.ts` | 1 | 1 |
| `lib/media-files.ts` | 0 | 3 |
| `lib/rate-limit.ts` | 0 | 1 |
| `lib/administration/admin-mutation-audit.ts` | 0 | 1 |
| `lib/administration/media-integrity-scanner.ts` | 0 | 1 |
| `lib/administration/summary-cache.ts` | 0 | 1 |
| `lib/authentication/session-security.ts` | 0 | 1 |
| `lib/authentication/session-telemetry.ts` | 0 | 1 |
| `lib/jobs/backup-creation-job.ts` | 1 | 0 |

## Vollständig geschlossene kleine Lücken

| Datei | Vorher fehlende Zeilen | Vorher fehlende Bedingungen |
| --- | ---: | ---: |
| `actions/login.ts` | 3 | 0 |
| `actions/new-password.ts` | 3 | 0 |
| `actions/new-verification.ts` | 3 | 0 |
| `actions/register.ts` | 3 | 0 |
| `actions/resend-verification.ts` | 3 | 0 |
| `actions/reset-password.ts` | 3 | 0 |
| `actions/session-security.ts` | 4 | 1 |
| `actions/add/delete-movie.ts` | 0 | 2 |
| `actions/playlist/add-playlist-entry.ts` | 2 | 1 |
| `actions/playlist/remove-playlist.ts` | 2 | 1 |
| `actions/playlist/update-playlist.ts` | 1 | 1 |
| `actions/watch/add-movie-view.ts` | 2 | 1 |
| `app/page.tsx` | 0 | 4 |
| `app/(protected)/admin/movies/[movieId]/edit/page.tsx` | 2 | 3 |
| `app/(protected)/movies/page.tsx` | 0 | 1 |
| `app/(protected)/mylist/_components/SearchList.tsx` | 0 | 1 |
| `app/(protected)/playlists/_components/FavoritesPlaylistCard.tsx` | 0 | 1 |
| `app/(protected)/playlists/_components/PlaylistCover.tsx` | 0 | 2 |
| `app/(protected)/search/[searchItem]/page.tsx` | 0 | 2 |
| `app/(protected)/search/_components/SearchList.tsx` | 4 | 4 |
| `app/(protected)/series/page.tsx` | 0 | 1 |
| `app/(protected)/settings/page.tsx` | 0 | 4 |
| `app/(protected)/settings/_components/security-activity-panel.tsx` | 2 | 6 |
| `app/(protected)/watch/[movieId]/page.tsx` | 0 | 1 |
| `app/(protected)/watch/playlist/[playlistId]/page.tsx` | 0 | 2 |
| `app/(protected)/watch/random/page.tsx` | 0 | 2 |
| `app/api/admin/audit/route.ts` | 0 | 1 |
| `app/api/admin/audit/export/route.ts` | 2 | 3 |
| `app/api/admin/backups/verification/route.ts` | 5 | 5 |
| `app/api/admin/deployment-status/route.ts` | 1 | 1 |
| `app/api/admin/jobs/route.ts` | 1 | 1 |
| `app/api/logs/clear/route.ts` | 3 | 2 |
| `app/api/movies/route.ts` | 1 | 1 |
| `app/api/movies/delete/route.ts` | 5 | 1 |
| `app/api/movies/getActors/[limit]/route.ts` | 1 | 1 |
| `app/api/movies/getActorsCount/route.ts` | 1 | 1 |
| `app/api/movies/moviesByActor/[actor]/route.ts` | 1 | 1 |
| `app/api/movies/new/route.ts` | 1 | 0 |
| `app/api/movies/newMovies/route.ts` | 1 | 0 |
| `app/api/playlist/route.ts` | 4 | 2 |
| `app/api/random/route.ts` | 2 | 2 |
| `app/api/random/movies/route.ts` | 2 | 1 |
| `app/api/random/series/route.ts` | 3 | 2 |
| `app/api/search/[searchItem]/route.ts` | 1 | 2 |
| `app/api/series/route.ts` | 1 | 1 |
| `app/api/series/all/route.ts` | 5 | 4 |
| `app/api/series/getActors/[limit]/route.ts` | 1 | 1 |
| `app/api/series/getActorsCount/route.ts` | 1 | 1 |
| `app/api/series/newSeries/route.ts` | 1 | 0 |
| `app/api/series/seriesByActor/[actor]/route.ts` | 1 | 1 |
| `app/changelog/page.tsx` | 0 | 1 |
| `components/AdminNav.tsx` | 5 | 3 |
| `components/DeploymentUpdateNotice.tsx` | 1 | 5 |
| `components/FavoriteButton.tsx` | 2 | 2 |
| `components/Navbar.tsx` | 0 | 1 |
| `components/ProfilModal.tsx` | 0 | 1 |
| `components/SearchPreview.tsx` | 2 | 5 |
| `components/Thumbnail.tsx` | 0 | 2 |
| `components/admin/AdminPagination.tsx` | 2 | 1 |
| `components/admin/useAdminCounts.ts` | 4 | 0 |
| `components/auth/auth-password-input.tsx` | 2 | 0 |
| `components/auth/back-button.tsx` | 0 | 1 |
| `components/auth/mfa-challenge.tsx` | 2 | 4 |
| `components/auth/passkey-login.tsx` | 2 | 6 |
| `components/auth/role-gate.tsx` | 5 | 2 |
| `components/auth/user-info.tsx` | 3 | 4 |
| `components/player/PlayerControls.tsx` | 4 | 2 |
| `components/player/WatchState.tsx` | 0 | 1 |
| `components/providers/LanguageProvider.tsx` | 1 | 0 |
| `data/admin-audit-reader.ts` | 0 | 6 |
| `data/auth-rate-limit.ts` | 0 | 2 |
| `data/auth-token.ts` | 0 | 1 |
| `data/favorites-playlist.ts` | 2 | 4 |
| `data/redis-auth-rate-limit.ts` | 1 | 1 |
| `hooks/use-current-user.ts` | 1 | 0 |
| `hooks/useBillboardVideoAvailability.ts` | 1 | 2 |
| `hooks/useNearViewport.ts` | 2 | 2 |
| `hooks/useUploadTitleNotification.ts` | 0 | 1 |
| `hooks/catalog/useActorPagination.ts` | 0 | 2 |
| `hooks/catalog/useCatalogQuery.ts` | 0 | 3 |
| `lib/auth-throttle.ts` | 0 | 3 |
| `lib/backup-status.ts` | 0 | 3 |
| `lib/changelog.ts` | 1 | 0 |
| `lib/deployment-update-policy.ts` | 2 | 0 |
| `lib/fetcher.ts` | 0 | 2 |
| `lib/genres.ts` | 0 | 3 |
| `lib/health.ts` | 4 | 6 |
| `lib/logger.ts` | 0 | 8 |
| `lib/ownership.ts` | 0 | 1 |
| `lib/random-playlist.ts` | 0 | 1 |
| `lib/scheduled-backup.ts` | 1 | 1 |
| `lib/search.ts` | 0 | 2 |
| `lib/session-security.ts` | 0 | 1 |
| `lib/tokens.ts` | 0 | 2 |
| `lib/user-access.ts` | 0 | 1 |
| `lib/utils.ts` | 5 | 0 |
| `lib/administration/media-health.ts` | 1 | 1 |
| `lib/administration/media-integrity-repository.ts` | 1 | 2 |
| `lib/authentication/auth-route.ts` | 0 | 3 |
| `lib/authentication/passkey-adapter.ts` | 1 | 1 |
| `lib/authentication/passkey-configuration.ts` | 2 | 4 |
| `lib/authentication/passkey-sign-in-policy.ts` | 0 | 1 |
| `lib/authentication/passkey-user.ts` | 0 | 2 |
| `lib/authentication/privacy.ts` | 0 | 1 |
| `lib/authentication/production-qr-device-pairing.ts` | 1 | 0 |
| `lib/authentication/production-telemetry.ts` | 0 | 1 |
| `lib/authentication/proxy-configuration.ts` | 0 | 1 |
| `lib/authentication/recent-authentication.ts` | 1 | 3 |
| `lib/authentication/session-user.ts` | 0 | 3 |
| `lib/authentication/telemetry.ts` | 1 | 1 |
| `lib/authentication/token-crypto.ts` | 1 | 3 |
| `lib/jobs/contracts.ts` | 0 | 1 |
| `lib/jobs/coordination.ts` | 0 | 1 |
| `lib/jobs/retention.ts` | 1 | 1 |
| `lib/jobs/retry.ts` | 3 | 5 |
| `lib/jobs/schedule-tick.ts` | 1 | 0 |
| `lib/jobs/submission.ts` | 4 | 7 |
| `lib/jobs/weekly-schedules.ts` | 1 | 2 |
| `lib/jobs/worker-heartbeat.ts` | 3 | 0 |
| `lib/jobs/worker-lifecycle.ts` | 3 | 2 |
| `lib/operations/runtime.ts` | 4 | 0 |
| `schemas/index.ts` | 1 | 1 |
