import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CategoriesPage from '../page';
import { useCategories } from '@/hooks/useCategories';

jest.mock('@/hooks/useCategories', () => ({ useCategories: jest.fn() }));
const refresh = jest.fn();
const originalFetch = globalThis.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  refresh.mockResolvedValue(undefined);
  jest.mocked(useCategories).mockReturnValue({ categories: [{ id: 'c1', name: 'Documentary', nameEn: 'Documentary', contentCount: 2 }], error: undefined, isLoading: false, refresh });
});
afterAll(() => { globalThis.fetch = originalFetch; });

it('creates a named category and refreshes the list', async () => {
  render(<CategoriesPage />);
  fireEvent.change(screen.getByLabelText('Category name (German)'), { target: { value: 'Behind Scenes' } });
  fireEvent.change(screen.getByLabelText('Category name (English)'), { target: { value: 'Behind Scenes' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }));
  await screen.findByText('Category saved.');
  expect(fetch).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ method: 'POST', body: expect.stringContaining('"color":') }));
  expect(refresh).toHaveBeenCalled();
  expect(screen.getByLabelText('Category name (German)')).toHaveValue('');
});

it('edits a category name and color using its stable ID', async () => {
  render(<CategoriesPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit category: Documentary' }));
  fireEvent.change(screen.getAllByLabelText('Category name (German)')[1], { target: { value: 'New category name' } });
  fireEvent.change(screen.getAllByLabelText('Custom color')[1], { target: { value: '#ff8800' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText('Category saved.');
  expect(fetch).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ id: 'c1', name: 'New category name', nameEn: 'Documentary', color: '#FF8800' }) }));
});

it('requires confirmation before deleting a linked category', async () => {
  render(<CategoriesPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete category: Documentary' }));
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByText('Remove this category and all its assignments? Videos will be kept.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Delete category: Documentary' }));
  fireEvent.click(screen.getByRole('button', { name: 'Delete category' }));
  await screen.findByText('Category deleted.');
  expect(fetch).toHaveBeenCalledWith('/api/categories?id=c1', { method: 'DELETE' });
});

it('shows conflicts without clearing the entered category name', async () => {
  jest.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'This category already exists.' } }) } as Response);
  render(<CategoriesPage />);
  fireEvent.change(screen.getByLabelText('Category name (German)'), { target: { value: 'Documentary' } });
  fireEvent.change(screen.getByLabelText('Category name (English)'), { target: { value: 'Documentary' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('This category already exists.'));
  expect(screen.getByLabelText('Category name (German)')).toHaveValue('Documentary');
  expect(refresh).not.toHaveBeenCalled();
});

it('filters category names and offers a retry after a loading failure', () => {
  const { rerender } = render(<CategoriesPage />);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search categories' }), { target: { value: 'absent' } });
  expect(screen.getByText('No categories found.')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Documentary' })).not.toBeInTheDocument();
  jest.mocked(useCategories).mockReturnValue({ categories: [], error: new Error('offline'), isLoading: false, refresh });
  rerender(<CategoriesPage />);
  expect(screen.getByRole('alert')).toHaveTextContent('Categories could not be loaded.');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(refresh).toHaveBeenCalled();
});

it('reports a network failure without exposing internal error details', async () => {
  jest.mocked(fetch).mockRejectedValue(new Error('private network details'));
  render(<CategoriesPage />);
  fireEvent.change(screen.getByLabelText('Category name (German)'), { target: { value: 'New category' } });
  fireEvent.change(screen.getByLabelText('Category name (English)'), { target: { value: 'New category' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create category' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Category could not be saved.'));
});
