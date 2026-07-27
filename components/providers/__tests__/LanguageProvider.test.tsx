import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { LOCALE_STORAGE_KEY } from '@/lib/i18n/translations';

const TestContent = () => (
  <div>
    <span>Movies</span>
    <span>Add New Content</span>
    <input placeholder="Search..." aria-label="Search" />
    <button aria-label="Play Test Actor in random order">Shuffle</button>
    <span>Guten Überblick.</span>
    <span>System-Logs</span>
    <span>+2 in 30 Tagen</span>
    <span>1 neue Inhalte</span>
    <span>3 Views</span>
    <span>Movie</span>
    <span>Serie</span>
    <span>PUBLISHED</span>
    <span>20 / Seite</span>
    <span>Current: video.mp4</span>
    <span>Uploading... 42%</span>
    <span>~2 minutes left</span>
  </div>
);

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  test('uses English by default', () => {
    render(
      <LanguageProvider>
        <TestContent />
        <LanguageSwitcher />
      </LanguageProvider>
    );

    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('normalizes German admin source text when English is active', async () => {
    render(
      <LanguageProvider>
        <TestContent />
      </LanguageProvider>
    );

    expect(await screen.findByText('Good overview.')).toBeInTheDocument();
    expect(screen.getByText('System Logs')).toBeInTheDocument();
    expect(screen.getByText('+2 in 30 days')).toBeInTheDocument();
    expect(screen.getByText('1 new item')).toBeInTheDocument();
    expect(screen.getByText('Movie')).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  test('switches text and accessible attributes to German', async () => {
    render(
      <LanguageProvider>
        <TestContent />
        <LanguageSwitcher />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'DE' }));

    await waitFor(() => {
      expect(screen.getByText('Filme')).toBeInTheDocument();
      expect(screen.getByText('Neuen Inhalt hinzufügen')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Suchen...')).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: 'Test Actor in zufälliger Reihenfolge abspielen',
        })
      ).toBeInTheDocument();
      expect(screen.getByText('+2 in 30 Tagen')).toBeInTheDocument();
      expect(screen.getByText('1 neuer Inhalt')).toBeInTheDocument();
      expect(screen.getByText('3 Aufrufe')).toBeInTheDocument();
      expect(screen.getByText('Film')).toBeInTheDocument();
      expect(screen.getByText('Serien')).toBeInTheDocument();
      expect(screen.getByText('Veröffentlicht')).toBeInTheDocument();
      expect(screen.getByText('20 / Seite')).toBeInTheDocument();
      expect(screen.getByText('Aktuell: video.mp4')).toBeInTheDocument();
      expect(screen.getByText('Wird hochgeladen... 42 %')).toBeInTheDocument();
      expect(screen.getByText('~2 minutes verbleibend')).toBeInTheDocument();
    });
    expect(document.documentElement.lang).toBe('de');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('de');
  });

  test('restores a saved German preference', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'de');

    render(
      <LanguageProvider>
        <TestContent />
        <LanguageSwitcher />
      </LanguageProvider>
    );

    expect(await screen.findByText('Filme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DE' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('can switch back from German to English', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    render(
      <LanguageProvider>
        <TestContent />
        <LanguageSwitcher />
      </LanguageProvider>
    );

    await screen.findByText('Filme');
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(await screen.findByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Add New Content')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
