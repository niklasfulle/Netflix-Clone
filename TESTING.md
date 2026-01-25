# Testing Guide

Dies ist eine Anleitung zum Schreiben und Ausführen von Tests in diesem Projekt.

## Installation

Das Projekt nutzt Jest als Test-Framework. Um die Test-Dependencies zu installieren, führen Sie aus:

```bash
npm install
# oder
yarn install
```

## Test-Scripts

Das Projekt enthält folgende Test-Scripts in der `package.json`:

### Tests ausführen
```bash
yarn test
# oder
npm test
```

### Tests im Watch-Modus ausführen
```bash
yarn test:watch
# oder
npm run test:watch
```

Dieser Modus verfolgt Dateiänderungen und führt betroffene Tests automatisch aus.

### Test-Coverage generieren
```bash
yarn test:coverage
# oder
npm run test:coverage
```

Dies erzeugt einen Coverage-Report mit HTML- und LCOV-Formaten.

## Test-Struktur

Tests sind in `__tests__`-Verzeichnissen organisiert, die sich in denselben Verzeichnissen wie der zu testende Code befinden:

```
hooks/
├── useVideoThumbnailUpload.ts
└── __tests__/
    └── useVideoThumbnailUpload.test.ts

components/
├── ThumbnailSelector.tsx
├── ThumbnailPreview.tsx
└── __tests__/
    ├── ThumbnailSelector.test.tsx
    └── ThumbnailPreview.test.tsx
```

## Verfügbare Tests

### useVideoThumbnailUpload Hook Tests
**Datei:** `hooks/__tests__/useVideoThumbnailUpload.test.ts`

Tests für den Video- und Thumbnail-Upload-Hook:
- ✅ Initial State: Überprüft Standard-Zustand
- ✅ Video ID Generation: Testet eindeutige Video-ID-Generierung
- ✅ Thumbnail Selection: Testet Thumbnail-Auswahl
- ✅ Thumbnail Deselection: Testet Thumbnail-Abwahl
- ✅ State Setters: Testet alle State-Update-Funktionen
- ✅ File Handling: Testet Datei-Upload-Logik
- ✅ Cancel Operations: Testet Abbruch-Funktionen

### ThumbnailSelector Component Tests
**Datei:** `components/__tests__/ThumbnailSelector.test.tsx`

Tests für die Thumbnail-Selector-Komponente:
- ✅ Rendering: Überprüft korrektes Rendering
- ✅ Click Handling: Testet Thumbnail-Auswahl per Klick
- ✅ Keyboard Navigation: Testet Enter/Space-Tastenbedienung
- ✅ Regeneration: Testet Thumbnail-Regeneration
- ✅ Accessibility: Überprüft ARIA-Labels

### ThumbnailPreview Component Tests
**Datei:** `components/__tests__/ThumbnailPreview.test.tsx`

Tests für die Thumbnail-Preview-Komponente:
- ✅ Display: Überprüft Thumbnail-Anzeige
- ✅ Deselect Button: Testet Abwahl-Button-Anzeige
- ✅ Manual Upload: Testet manuellen Upload
- ✅ Conditional Rendering: Testet bedingte Darstellung
- ✅ Props Handling: Testet verschiedene Prop-Kombinationen

## Schreiben neuer Tests

### Struktur eines Tests

```typescript
describe('Komponenten/Hook Name', () => {
  beforeEach(() => {
    // Setup vor jedem Test
  });

  it('should do something', () => {
    // Arrange (Vorbereitung)
    const { result } = renderHook(() => useMyHook());

    // Act (Aktion)
    act(() => {
      result.current.someFunction();
    });

    // Assert (Überprüfung)
    expect(result.current.someState).toBe(expectedValue);
  });
});
```

### Best Practices

1. **Aussagekräftige Test-Namen**: Nutzen Sie `it('should ...')` für bessere Lesbarkeit
2. **AAA Pattern**: Arrange → Act → Assert
3. **Mocks**: Nutzen Sie `jest.mock()` für externe Dependencies
4. **Async Tests**: Nutzen Sie `async/await` und `waitFor()` für asynchrone Operationen
5. **Cleanup**: Tests sollten automatisch bereinigt werden durch Jest

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useMyHook());

act(() => {
  // State-Updates hier
});

expect(result.current.state).toBe(expectedValue);
```

### Testing Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

render(<MyComponent />);

const button = screen.getByRole('button', { name: /click me/i });
fireEvent.click(button);

expect(screen.getByText('Result')).toBeInTheDocument();
```

## Jest-Konfiguration

Die Jest-Konfiguration befindet sich in:
- `jest.config.js` - Hauptkonfiguration
- `jest.setup.js` - Setup für Tests

### Abgedeckte Verzeichnisse

Die Test-Coverage schließt folgende ein:
- `app/**/*`
- `components/**/*`
- `hooks/**/*`
- `actions/**/*`

## Troubleshooting

### Tests erkennen Dateien nicht
Stellen Sie sicher, dass die Test-Dateien das Muster erfüllen:
- `__tests__/filename.test.ts(x)`
- `filename.test.ts(x)`
- `filename.spec.ts(x)`

### Module nicht gefunden
Überprüfen Sie das `moduleNameMapper` in `jest.config.js`. Der `@/` Alias sollte auf das Root-Verzeichnis zeigen.

### Async-Tests timeout
Nutzen Sie `waitFor()` für asynchrone Operationen:

```typescript
await waitFor(() => {
  expect(result.current.state).toBe(expectedValue);
});
```

## Weitere Ressourcen

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
