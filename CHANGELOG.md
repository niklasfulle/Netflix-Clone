# Changelog

Die aktuelle Version wird mit `[current]` markiert und automatisch aus `package.json` eingesetzt.

## [current]

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
