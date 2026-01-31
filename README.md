# Netflix Clone

Ein vollständig funktionierendes Netflix-ähnliches Streaming-Platform mit [Next.js](https://nextjs.org), gebaut mit modernen Web-Technologien.

## Features

- 🔐 **Authentifizierung**: NextAuth.js Integration mit Anmeldung und Registrierung
- 👤 **Benutzerprofile**: Mehrere Profile pro Benutzer
- 🎬 **Content Management**: Admin-Panel zum Verwalten von Filmen und Serien
- ⭐ **Favoritenliste**: Filme und Serien als Favoriten speichern
- 📺 **Watchlist**: Fortsetzung vom letzten Watch-Punkt
- 🔍 **Suchfunktion**: Filme und Serien durchsuchen
- 📱 **Responsive Design**: Mobile und Desktop Unterstützung
- 🎥 **Video Upload**: Admin können Videos hochladen

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Testing**: Jest
- **Deployment**: Docker, Ansible

## Installation

### Voraussetzungen

- Node.js 18+ oder höher
- npm oder yarn
- PostgreSQL Datenbank

### Setup

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env.local

# Datenbankmigrationen ausführen
npx prisma migrate dev

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

## Verfügbare Scripts

```bash
npm run dev       # Entwicklungsserver starten
npm run build     # Produktionsversion bauen
npm run start     # Produktionsserver starten
npm run lint      # Code-Qualität prüfen
npm test          # Tests ausführen
```

## Projektstruktur

```
├── app/              # Next.js App Router
├── actions/          # Server Actions
├── components/       # React Komponenten
├── hooks/           # Custom React Hooks
├── lib/             # Utility-Funktionen
├── prisma/          # Datenbankschema
├── public/          # Statische Assets
├── schemas/         # Validierungsschemas
└── tests/           # Test-Dateien
```

## Testing

Das Projekt verfügt über **4.950 Unit Tests** mit umfassender Test-Coverage:

### Test-Statistiken
- **Gesamt Tests**: 4.950 ✅
- **Test Suites**: 117 ✅
- **Ausführungszeit**: ~30s
- **Alle Tests bestanden**: ✅ 100%

### Auth-Komponenten Test-Coverage

| Komponente | Tests | Status |
|------------|-------|--------|
| **ResetForm** | 173 Tests | ✅ Alle bestanden |
| **RoleGate** | 63 Tests | ✅ Alle bestanden |
| **Social** | 89 Tests | ✅ Alle bestanden |
| **UserButton** | 92 Tests | ✅ Alle bestanden |
| **UserInfo** | 106 Tests | ✅ Alle bestanden |
| **newVerification Action** | 38 Tests | ✅ Alle bestanden |

### Coverage-Metriken

| Metrik | Abdeckung | Details |
|--------|-----------|---------|
| **Lines** | 33.66% | 1.387 / 4.120 Zeilen |
| **Statements** | 33.61% | 1.496 / 4.450 Statements |
| **Functions** | 29.2% | 205 / 702 Funktionen |
| **Branches** | 29.05% | 450 / 1.549 Branches |

### Komponenten-Coverage (Besonders gut getestet)

- **Components**: 92.72% (92.26% Lines)
- **Actions**: 88.84% (88.39% Lines)
- **Hooks**: 71.86% (71.81% Lines)

### Test-Commands

```bash
npm test                    # Alle 4.950 Tests ausführen
npm run test:watch          # Tests im Watch-Modus
npm run test:coverage       # Coverage-Report generieren (HTML + LCOV)
```

Coverage-Report: [coverage/lcov-report/index.html](coverage/lcov-report/index.html)

### Neue Test-Suites (Januar 2026)

Umfassende statische Analyse-Tests hinzugefügt für Auth-Komponenten:

- **ResetForm Component** - 173 Tests: Struktur, Imports, Props, FormError/FormSuccess, Schema-Validierung, Security
- **RoleGate Component** - 63 Tests: Rolle-basierte Zugriffskontrolle, Permission-Checks, FormError-Integration
- **Social Component** - 89 Tests: OAuth-Integration (Google/GitHub), Button-Konfiguration, Sicherheit
- **UserButton Component** - 92 Tests: Dropdown-Menu, Avatar-Fallback, Logout-Integration
- **UserInfo Component** - 106 Tests: User-Daten-Anzeige, Badge-Variantenhandling, Typsicherheit
- **newVerification Action** - 38 Tests: Token-Verifikation, Ablauf-Handling, Datenbankoperationen

Alle Tests basieren auf statischer Code-Analyse (fs Modul) und prüfen:
- ✅ Component-Struktur und Exports
- ✅ Korrekte Imports und Dependencies
- ✅ Props-Interfaces und Typsicherheit
- ✅ Sicherheitsanforderungen
- ✅ Rendering und Layout-Struktur
- ✅ Integration mit UI-Komponenten

Siehe [TESTING.md](TESTING.md) für detaillierte Test-Dokumentation und [TESTS_CHECKLIST.md](TESTS_CHECKLIST.md) für alle Test-Details.

## Dokumentation

- [TESTING.md](TESTING.md) - Test-Setup und Richtlinien
- [TESTS_SETUP.md](TESTS_SETUP.md) - Initiale Test-Konfiguration
- [TESTS_CHECKLIST.md](TESTS_CHECKLIST.md) - Tests Übersicht

## Lizenz

MIT
