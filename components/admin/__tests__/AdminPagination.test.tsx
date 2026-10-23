import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { AdminPagination } from '../AdminPagination';

it('navigates between pages and lets administrators change the page size', () => {
  const onPageChange = jest.fn(); const onPageSizeChange = jest.fn();
  render(<AdminPagination page={2} totalPages={3} total={60} pageSize={20} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(onPageChange.mock.calls).toEqual([[1], [3]]);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '50' } });
  expect(onPageSizeChange).toHaveBeenCalledWith(50);
});

it('prevents navigation outside an empty result set and omits unavailable page-size controls', () => {
  render(<AdminPagination page={1} totalPages={0} total={0} pageSize={20} onPageChange={jest.fn()} />);
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});

it('formats German entry counts using the selected locale', () => {
  render(<LanguageProvider initialLocale="de"><AdminPagination page={1} totalPages={62} total={1234} pageSize={20} onPageChange={jest.fn()} /></LanguageProvider>);
  expect(screen.getByText(/1\.234/)).toBeInTheDocument();
});
