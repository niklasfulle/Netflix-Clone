import { fireEvent, render, screen } from '@testing-library/react';
import { CategorySelect } from '../CategorySelect';
import { useCategories } from '@/hooks/useCategories';
import { LanguageProvider } from '@/components/providers/LanguageProvider';

jest.mock('@/hooks/useCategories', () => ({ useCategories: jest.fn() }));
const refresh = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useCategories).mockReturnValue({ categories: [{ id: 'c1', name: 'Documentary', contentCount: 1 }, { id: 'c2', name: 'Behind Scenes', contentCount: 0 }], error: undefined, isLoading: false, refresh });
});

it('loads selected categories by ID and allows assigning multiple categories', () => {
  const change = jest.fn();
  render(<CategorySelect value={['c1']} onChange={change} disabled={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Select categories' }));
  expect(screen.getByRole('checkbox', { name: 'Documentary' })).toBeChecked();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Behind Scenes' }));
  expect(change).toHaveBeenCalledWith(['c1', 'c2']);
  expect(screen.getByRole('link', { name: 'Manage categories' })).toHaveAttribute('href', '/admin/categories');
});

it('retains the selection and offers refresh when categories cannot be loaded', () => {
  jest.mocked(useCategories).mockReturnValue({ categories: [{ id: 'c1', name: 'Documentary', contentCount: 1 }], error: new Error('offline'), isLoading: false, refresh });
  const change = jest.fn();
  render(<CategorySelect value={['c1']} onChange={change} disabled={false} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Categories could not be loaded.');
  expect(screen.getByRole('button', { name: 'Select categories' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh categories' }));
  expect(refresh).toHaveBeenCalledWith(undefined, { throwOnError: false });
  expect(change).not.toHaveBeenCalled();
});

it('explains empty category lists and disables interaction while loading', () => {
  jest.mocked(useCategories).mockReturnValue({ categories: [], error: undefined, isLoading: false, refresh });
  const { rerender } = render(<CategorySelect value={[]} onChange={jest.fn()} disabled={false} />);
  expect(screen.getByText('No categories yet. Create your first category in management.')).toBeInTheDocument();
  jest.mocked(useCategories).mockReturnValue({ categories: [], error: undefined, isLoading: true, refresh });
  rerender(<CategorySelect value={[]} onChange={jest.fn()} disabled={false} />);
  expect(screen.getByRole('button', { name: 'Loading categories...' })).toBeDisabled();
});

it.each(['en', 'de'] as const)('shows the %s label while retaining the same category ID', locale => {
  jest.mocked(useCategories).mockReturnValue({ categories: [{ id: 'c1', name: 'Außenaufnahme', nameEn: 'Outdoor scene', contentCount: 1 }], error: undefined, isLoading: false, refresh });
  const change = jest.fn();
  render(<LanguageProvider initialLocale={locale}><CategorySelect value={[]} onChange={change} disabled={false} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: locale === 'en' ? 'Select categories' : 'Kategorien auswählen' }));
  fireEvent.click(screen.getByRole('checkbox', { name: locale === 'en' ? 'Outdoor scene' : 'Außenaufnahme' }));
  expect(change).toHaveBeenCalledWith(['c1']);
});
