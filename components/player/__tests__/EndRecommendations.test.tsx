import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { EndRecommendations } from '../EndRecommendations';

jest.mock('next/image', () => ({ __esModule: true, default: ({ fill: _fill, unoptimized: _unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => <img {...props} alt={props.alt ?? ''} /> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ prefetch: _prefetch, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => <a {...props} /> }));
const items = Array.from({ length: 6 }, (_, i) => ({ id: `next-${i}`, title: `Neutral title ${i}`, thumbnailUrl: `/api/catalog/thumbnails/next-${i}`, reason: i < 2 ? 'same-actor' as const : 'similar-categories' as const }));
it('loads six images before completion and reuses the mounted cards when revealing the selection', () => {
  const select = jest.fn();
  const view = (visible: boolean) => <LanguageProvider initialLocale="en"><EndRecommendations items={items} visible={visible} countdown={null} onNext={jest.fn()} onCancel={jest.fn()} onSelect={select} /></LanguageProvider>;
  const { container, rerender } = render(view(false));
  expect(screen.queryByRole('region', { name: 'Recommended videos' })).not.toBeInTheDocument();
  const images = [...container.querySelectorAll('img')];
  expect(images).toHaveLength(6); expect(images.every(image => image.getAttribute('loading') === 'eager')).toBe(true);
  rerender(view(true));
  expect(screen.getByRole('region', { name: 'Recommended videos' })).toBeVisible();
  expect(screen.getAllByRole('link')).toHaveLength(6);
  expect([...container.querySelectorAll('img')]).toEqual(images);
  fireEvent.click(screen.getByRole('link', { name: /Neutral title 0/ }));
  expect(select).toHaveBeenCalled();
});
it('keeps playlist autoplay available alongside the suggestions', () => {
  const next = jest.fn(); const cancel = jest.fn();
  render(<LanguageProvider initialLocale="en"><EndRecommendations items={items} visible countdown={5} next={{ id: 'playlist-next', title: 'Next in playlist' }} onNext={next} onCancel={cancel} onSelect={jest.fn()} /></LanguageProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Play now' })); expect(next).toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(cancel).toHaveBeenCalled();
});
