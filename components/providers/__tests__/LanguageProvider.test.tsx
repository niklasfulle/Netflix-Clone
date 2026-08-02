import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LanguageProvider, useLanguage } from '@/components/providers/LanguageProvider';
import { LOCALE_STORAGE_KEY } from '@/lib/i18n/translations';

const TestContent = () => {
  const { t, message } = useLanguage();
  return (
    <div>
      <span>{t('Movies')}</span>
      <span>{t('Add New Content')}</span>
      <input placeholder={t('Search...')} aria-label={t('Search')} />
      <button aria-label={message('playRandom', { name: 'Test Actor' })}>Shuffle</button>
      <span>{t('Good overview.')}</span>
      <span>{t('System Logs')}</span>
      <span>{message('pageOf', { page: 2, total: 4 })}</span>
      <span>{message('uploadProgress', { percent: 42 })}</span>
      <span>{message('timeLeft', { time: '2 minutes' })}</span>
    </div>
  );
};

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'en';
  });

  test('renders typed English messages by default', () => {
    render(<LanguageProvider><TestContent /><LanguageSwitcher /></LanguageProvider>);

    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Test Actor in random order' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('switches render-time text, messages, and accessible attributes to German', () => {
    render(<LanguageProvider><TestContent /><LanguageSwitcher /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'DE' }));

    expect(screen.getByText('Filme')).toBeInTheDocument();
    expect(screen.getByText('Neuen Inhalt hinzufügen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Suchen...')).toBeInTheDocument();
    expect(screen.getByText('Seite 2 von 4')).toBeInTheDocument();
    expect(screen.getByText('Wird hochgeladen... 42 %')).toBeInTheDocument();
    expect(screen.getByText('~2 minutes verbleibend')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('de');
    expect(document.cookie).toContain(`${LOCALE_STORAGE_KEY}=de`);
  });

  test('uses the server-provided locale for SSR and hydration-stable initial markup', () => {
    const markup = renderToString(
      <LanguageProvider initialLocale="de"><TestContent /></LanguageProvider>,
    );

    expect(markup).toContain('Filme');
    expect(markup).toContain('Seite 2 von 4');
    expect(markup).not.toContain('>Movies<');
  });

  test('does not install a global DOM mutation observer', () => {
    const observe = jest.spyOn(MutationObserver.prototype, 'observe');
    render(<LanguageProvider initialLocale="de"><TestContent /></LanguageProvider>);
    expect(observe).not.toHaveBeenCalled();
    observe.mockRestore();
  });
});
