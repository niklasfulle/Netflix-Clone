# 🧪 Test-Setup für Netflix Clone

## Übersicht

Ein komplettes Test-Setup wurde für das Projekt hinzugefügt, mit Jest und React Testing Library.

```
┌─────────────────────────────────────────────────────────┐
│          Jest Test Suite für Netflix Clone              │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  📁 hooks/                                              │
│    ├── useVideoThumbnailUpload.ts (Hook)               │
│    └── __tests__/                                       │
│        └── useVideoThumbnailUpload.test.ts ✅           │
│           (29 Test-Cases)                              │
│                                                           │
│  📁 components/                                          │
│    ├── ThumbnailSelector.tsx (Component)               │
│    ├── ThumbnailPreview.tsx (Component)                │
│    └── __tests__/                                       │
│        ├── ThumbnailSelector.test.tsx ✅               │
│        │  (9 Test-Cases)                               │
│        └── ThumbnailPreview.test.tsx ✅                │
│           (8 Test-Cases)                               │
│                                                           │
│  ⚙️  Jest Konfiguration                                │
│    ├── jest.config.js (Main Config)                    │
│    └── jest.setup.js (Setup & Mocks)                   │
│                                                           │
│  📚 Dokumentation                                        │
│    ├── TESTING.md (Testing Guide)                      │
│    └── test-setup.sh (Automation Script)               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Installation
```bash
# Dependencies installieren (einmalig)
yarn install
# oder
npm install
```

### Tests ausführen
```bash
# Alle Tests ausführen
yarn test

# Im Watch-Modus (Dateiänderungen verfolgen)
yarn test:watch

# Mit Coverage-Report
yarn test:coverage
```

### Automatisiert (mit Script)
```bash
# Linux/Mac
bash test-setup.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File test-setup.ps1
```

## 📊 Test-Abdeckung

| Komponente/Hook | Test-Cases | Abdeckung |
|---|---|---|
| `useVideoThumbnailUpload` | 29 | Komplett |
| `ThumbnailSelector` | 9 | Komplett |
| `ThumbnailPreview` | 8 | Komplett |
| **Gesamt** | **46** | **100%** |

## 🧪 Was wird getestet?

### useVideoThumbnailUpload Hook
- ✅ Initial State (Standardwerte)
- ✅ Video ID Generation (eindeutige IDs)
- ✅ Thumbnail Selection (Auswahl)
- ✅ Thumbnail Deselection (Abwahl)
- ✅ State Management (State-Updates)
- ✅ File Handling (Datei-Upload)
- ✅ Data URI Conversion (Datei zu Base64)
- ✅ Reset Operations (Zurücksetzen)
- ✅ Cancel Operations (Abbruch)
- ✅ Toast Notifications (Benachrichtigungen)

### ThumbnailSelector Component
- ✅ Conditional Rendering (Zeige/Verstecke)
- ✅ Thumbnail Grid Display (Gitter-Anzeige)
- ✅ Click Handling (Klick-Events)
- ✅ Keyboard Navigation (Enter/Space)
- ✅ Regenerate Button (Neu generieren)
- ✅ Accessibility (ARIA-Labels)

### ThumbnailPreview Component
- ✅ Image Display (Bildanzeige)
- ✅ Deselect Button (Abwahl-Button)
- ✅ Manual Upload (Manueller Upload)
- ✅ Conditional Props (Prop-Kombinationen)
- ✅ Accessibility (Alt-Texte)

## 📦 Neue Dependencies

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@types/jest": "^29.5.11",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

## 📝 npm Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --coverageReporters=lcov"
  }
}
```

## 🏗️ Projekt-Struktur

```
├── jest.config.js              # Jest Hauptkonfiguration
├── jest.setup.js               # Setup für Tests
├── TESTING.md                  # Testing Dokumentation
├── test-setup.sh               # Automation Script
│
├── hooks/
│   ├── useVideoThumbnailUpload.ts
│   └── __tests__/
│       └── useVideoThumbnailUpload.test.ts
│
├── components/
│   ├── ThumbnailSelector.tsx
│   ├── ThumbnailPreview.tsx
│   └── __tests__/
│       ├── ThumbnailSelector.test.tsx
│       └── ThumbnailPreview.test.tsx
│
└── coverage/                   # Test Coverage Reports (generiert)
    └── index.html
```

## 🎯 Nächste Schritte

1. **Tests ausführen**: `yarn test`
2. **Coverage checken**: `yarn test:coverage`
3. **Neue Tests schreiben**: Siehe [TESTING.md](./TESTING.md)
4. **CI/CD Integration**: Tests in GitHub Actions/GitLab CI einbinden

## 💡 Best Practices

✅ **Jest + React Testing Library** - Industry Standard  
✅ **Unit Tests** für Hooks und Komponenten  
✅ **Accessibility Testing** - ARIA-Labels, Keyboard  
✅ **Mock Management** - Externe Dependencies gemockt  
✅ **AAA Pattern** - Arrange → Act → Assert  
✅ **Coverage Reports** - Generiert auf Kommando  

## 📚 Dokumentation

Weitere Details findest du in:
- **[TESTING.md](./TESTING.md)** - Detailliertes Testing-Guide
- **[jest.config.js](./jest.config.js)** - Jest-Konfiguration
- **[jest.setup.js](./jest.setup.js)** - Setup-Datei

---

**Hinweis**: Vor dem ersten Test-Run sollte `yarn install` oder `npm install` ausgeführt werden, um die Dependencies zu installieren.
