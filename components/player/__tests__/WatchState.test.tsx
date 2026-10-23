import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import WatchState from '../WatchState';

it('shows the default missing-content message and allows returning to the catalog', () => {
  const onBack = jest.fn();
  render(<LanguageProvider initialLocale="en"><WatchState onBack={onBack} /></LanguageProvider>);
  expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(onBack).toHaveBeenCalledTimes(1);
});
