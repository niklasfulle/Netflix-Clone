import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CategoryTransfer } from '../CategoryTransfer';

const imported = jest.fn(async () => {});
const busy = jest.fn();
const categories = [{ id: 'existing-id', name: 'Natur', nameEn: 'Nature', color: '#38BDF8', contentCount: 2 }];
const document = { schemaVersion: 1, categories: [{ name: 'Natur', nameEn: 'Natural world' }, { name: 'Stadt', nameEn: 'City' }] };
function fileFor(value: unknown) { const file = new File([JSON.stringify(value)], 'categories-export.json', { type: 'application/json' }); Object.defineProperty(file, 'text', { value: async () => JSON.stringify(value) }); return file; }
beforeEach(() => { jest.clearAllMocks(); globalThis.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ created: 1, updated: 1, unchanged: 0 }) }); });
function view() { return render(<CategoryTransfer categories={categories} disabled={false} onImported={imported} onBusyChange={busy} />); }
test('previews both languages and requires explicit confirmation before importing', async () => {
  view();
  fireEvent.change(screen.getByLabelText('Import categories'), { target: { files: [fileFor(document)] } });
  expect(await screen.findByRole('region', { name: 'Import preview' })).toHaveTextContent(/New categories\s*1/);
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('cell', { name: 'Stadt' })).toBeInTheDocument();
  expect(screen.getByRole('cell', { name: 'City' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm category import' }));
  await waitFor(() => expect(imported).toHaveBeenCalledTimes(1));
  expect(fetch).toHaveBeenCalledWith('/api/categories/import', expect.objectContaining({ method: 'POST', body: JSON.stringify(document) }));
});
test('rejects duplicate names without sending requests', async () => {
  view();
  fireEvent.change(screen.getByLabelText('Import categories'), { target: { files: [fileFor({ schemaVersion: 1, categories: [document.categories[0], document.categories[0]] })] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('The file contains duplicate category names.');
  expect(fetch).not.toHaveBeenCalled();
});
test('cancel leaves existing categories unchanged', async () => {
  view(); fireEvent.change(screen.getByLabelText('Import categories'), { target: { files: [fileFor(document)] } });
  await screen.findByText(/Import preview/);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('button', { name: 'Confirm category import' })).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
test('exports both names and the selected color without internal IDs or assignment counts', async () => {
  const createUrl = jest.fn((_blob: Blob) => 'blob:categories');
  const oldCreate = URL.createObjectURL; const oldRevoke = URL.revokeObjectURL;
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createUrl });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  let filename = '';
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function(this: HTMLAnchorElement) { filename = this.download; });
  try {
    view(); fireEvent.click(screen.getByRole('button', { name: 'Export categories' }));
    const blob = createUrl.mock.calls[0][0] as Blob;
    const text = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blob); });
    expect(JSON.parse(text)).toEqual({ schemaVersion: 1, categories: [{ name: 'Natur', nameEn: 'Nature', color: '#38BDF8' }] });
    expect(filename).toBe('categories-export.json');
  } finally { await new Promise(resolve => setTimeout(resolve, 1100)); click.mockRestore(); Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: oldCreate }); Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: oldRevoke }); }
});

test('accepts a dropped file and shows its name before confirmation', async () => {
  view();
  fireEvent.drop(screen.getByRole('button', { name: /Choose a JSON file/ }), { dataTransfer: { files: [fileFor(document)] } });
  expect(await screen.findByRole('region', { name: 'Import preview' })).toBeInTheDocument();
  expect(screen.getByText('categories-export.json')).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});

test('rejects multiple dropped files without keeping an earlier import ready', async () => {
  view();
  fireEvent.drop(screen.getByRole('button', { name: /Choose a JSON file/ }), { dataTransfer: { files: [fileFor(document)] } });
  await screen.findByRole('region', { name: 'Import preview' });
  fireEvent.drop(screen.getByRole('button', { name: /Choose another file/ }), { dataTransfer: { files: [fileFor(document), fileFor(document)] } });
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose one JSON file.');
  expect(screen.queryByRole('button', { name: 'Confirm category import' })).not.toBeInTheDocument();
});
