import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { LOCALE_STORAGE_KEY } from '@/lib/i18n/translations';

const TestContent = () => (
  <div>
    <span>Movies</span>
    <input placeholder="Search..." aria-label="Search" />
    <button aria-label="Play Test Actor in random order">Shuffle</button>
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
      expect(screen.getByPlaceholderText('Suchen...')).toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: 'Test Actor in zufälliger Reihenfolge abspielen',
        })
      ).toBeInTheDocument();
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
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });
});
