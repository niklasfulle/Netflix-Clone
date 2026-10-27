import { fireEvent, render, screen, within } from '@testing-library/react';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { CategoryTimeline, categoryTimelineColor } from '../CategoryTimeline';
import type { CategorySegment } from '@/lib/manual-categorization/types';

const forest = { id: 'forest', name: 'Wald', nameEn: 'Forest' };
const city = { id: 'city', name: 'Stadt', nameEn: 'City' };
const segments: CategorySegment[] = [
  { categoryId: forest.id, category: forest, startSeconds: 10, endSeconds: 40 },
  { categoryId: city.id, category: city, startSeconds: 20, endSeconds: 50 },
];
const view = (ranges = segments) => <LanguageProvider initialLocale="en"><CategoryTimeline segments={ranges} duration={100} time={25} onSeek={jest.fn()} /></LanguageProvider>;

it('overlays all intervals in the same full-width track with proportional time positions', () => {
  render(view());
  const track = screen.getByRole('group', { name: 'Timeline categories' });
  const ranges = within(track).getAllByRole('button');
  expect(ranges).toHaveLength(2);
  expect(ranges[0].parentElement).toBe(ranges[1].parentElement);
  expect(track).toContainElement(ranges[0].parentElement);
  expect(ranges[0]).toHaveStyle({ left: '10%', width: '30%' });
  expect(ranges[1]).toHaveStyle({ left: '20%', width: '30%' });
  expect(ranges[0].style.backgroundColor).not.toBe(ranges[1].style.backgroundColor);
});

it('keeps category colors across ordering, renamed labels and a different video catalog', () => {
  const { rerender } = render(view());
  const initial = screen.getByRole('button', { name: /Forest ·/ }).style.backgroundColor;
  rerender(view([{ ...segments[0], category: { ...forest, nameEn: 'Renamed forest' } }]));
  expect(screen.getByRole('button', { name: /Renamed forest ·/ }).style.backgroundColor).toBe(initial);
  rerender(view([...segments].reverse()));
  expect(screen.getByRole('button', { name: /Forest ·/ }).style.backgroundColor).toBe(initial);
  expect(categoryTimelineColor('forest')).not.toBe(categoryTimelineColor('city'));
});

it('shows overlapping category names without timestamps on hover and hides them when leaving', () => {
  render(view());
  const track = screen.getByRole('group', { name: 'Timeline categories' });
  jest.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 100 } as DOMRect);
  fireEvent.mouseMove(track, { clientX: 25 });
  const tooltip = screen.getByRole('tooltip');
  expect(within(tooltip).getByText('Forest')).toBeInTheDocument();
  expect(within(tooltip).getByText('City')).toBeInTheDocument();
  expect(tooltip).not.toHaveTextContent('00:00:10.000');
  fireEvent.mouseMove(track, { clientX: 50 });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.mouseMove(track, { clientX: 25 });
  fireEvent.mouseLeave(track);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});

it('provides category details through keyboard focus as well', () => {
  render(view());
  const range = screen.getByRole('button', { name: /City ·/ });
  fireEvent.focus(range);
  expect(screen.getByRole('tooltip')).toHaveTextContent('City');
  expect(range).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  fireEvent.blur(range);
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
