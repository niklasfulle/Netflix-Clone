import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { updateWatchTime } from '@/actions/watch/update-watch-time';
import { addMovieView } from '@/actions/watch/add-movie-view';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import VideoPlayer from '../VideoPlayer';
import { formatMediaTime } from '../types';

const mockMovieDetails = jest.fn();
jest.mock('@/hooks/movies/useMovie', () => ({ __esModule: true, default: (...args: unknown[]) => mockMovieDetails(...args) }));
jest.mock('@/actions/watch/update-watch-time', () => ({ updateWatchTime: jest.fn() }));
jest.mock('@/actions/watch/add-movie-view', () => ({ addMovieView: jest.fn() }));
jest.mock('@/actions/watch/add-to-watchlist', () => ({ addToWatchlist: jest.fn() }));
const mockMutate = jest.fn();
jest.mock('swr', () => ({ useSWRConfig: () => ({ mutate: mockMutate }) }));
jest.mock('next/image', () => ({ __esModule: true, default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));

const items = [
  { id: 'one', title: 'First movie', thumbnailUrl: '/one.jpg' },
  { id: 'two', title: 'Second movie', thumbnailUrl: '/two.jpg' },
  { id: 'three', title: 'Third movie', thumbnailUrl: '/three.jpg' },
];

function mount(props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}) {
  return render(<LanguageProvider initialLocale="en"><VideoPlayer items={items} playlistTitle="Film night" onBack={jest.fn()} {...props} /></LanguageProvider>);
}

function ready(container: HTMLElement, duration = 120) {
  const video = container.querySelector('video')!;
  Object.defineProperty(video, 'duration', { configurable: true, value: duration });
  Object.defineProperty(video, 'readyState', { configurable: true, value: 4 });
  fireEvent.loadedMetadata(video);
  return video;
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockMovieDetails.mockReturnValue({ data: { watchTime: 25 } });
  jest.mocked(updateWatchTime).mockResolvedValue({ success: 'Saved' });
  mockMutate.mockResolvedValue(undefined);
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, 'paused', { configurable: true, value: false });
    this.dispatchEvent(new Event('play'));
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  });
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    Object.defineProperty(this, 'paused', { configurable: true, value: true });
    this.dispatchEvent(new Event('pause'));
  });
  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});
const capabilityRestorers: Array<() => void> = [];
function capability(target: object, key: PropertyKey, value: unknown) {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, value });
  capabilityRestorers.push(() => {
    if (original) Object.defineProperty(target, key, original);
    else Reflect.deleteProperty(target, key);
  });
}
afterEach(() => {
  capabilityRestorers.splice(0).reverse().forEach(restore => restore());
  jest.restoreAllMocks(); jest.useRealTimers();
});

it('does not render an unusable player for an empty queue', () => {
  const { container } = mount({ items: [] });
  expect(container).toBeEmptyDOMElement();
});

it('does not offer an ineffective volume slider when the browser ignores media volume changes', () => {
  const original = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'volume');
  Object.defineProperty(HTMLMediaElement.prototype, 'volume', { configurable: true, get: () => 1, set: () => undefined });
  try {
    mount();
    expect(screen.queryByRole('slider', { name: 'Volume' })).not.toBeInTheDocument();
    expect(screen.getByText('Use device volume buttons')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();
  } finally {
    if (original) Object.defineProperty(HTMLMediaElement.prototype, 'volume', original);
  }
});

it('shows interval categories and seeks to them during regular playback', () => {
  const category = { id: 'forest', name: 'Wald', nameEn: 'Forest', color: '#12AB34' };
  const { container } = mount({ items: [{ ...items[0], categories: [category], categorySegments: [{ categoryId: 'forest', category, startSeconds: 10, endSeconds: 20 }] }], startTime: 0 });
  const video = ready(container);
  const segment = screen.getByRole('button', { name: 'Forest · 00:00:10.000 – 00:00:20.000' });
  const timeline = screen.getByRole('region', { name: 'Timeline categories' });
  expect(within(timeline).getByRole('slider', { name: 'Seek' })).toBeInTheDocument();
  expect(within(timeline).queryByRole('list')).not.toBeInTheDocument();
  const badges = screen.getByLabelText('Video categories');
  expect(badges.closest('header')).not.toBeNull();
  expect(badges.querySelector('[style]')).toBeNull();
  expect(segment).toHaveStyle({ backgroundColor: '#12AB34' });
  fireEvent.click(segment);
  expect(video.currentTime).toBe(10);
  expect(segment).toHaveAttribute('aria-current', 'true');
  fireEvent.change(screen.getByRole('slider', { name: 'Seek' }), { target: { value: '20' } });
  expect(segment).not.toHaveAttribute('aria-current');
});

it('does not record views or watch progress while manually categorizing', async () => {
  const position = jest.fn();
  const { container, unmount } = mount({ mode: 'categorize', onPositionChange: position });
  const video = ready(container);
  expect(video.autoplay).toBe(false);
  video.currentTime = 35;
  fireEvent.timeUpdate(video); fireEvent.pause(video);
  expect(position).toHaveBeenLastCalledWith(35, 120);
  unmount();
  await act(async () => undefined);
  expect(addMovieView).not.toHaveBeenCalled();
  expect(updateWatchTime).not.toHaveBeenCalled();
});

it('lets a viewer seek, skip and change volume using the custom controls', async () => {
  const { container } = mount({ startTime: 0 });
  const video = ready(container);
  fireEvent.click(screen.getByRole('button', { name: 'Forward 10 seconds' }));
  expect(video.currentTime).toBe(10);
  fireEvent.click(screen.getByRole('button', { name: 'Back 10 seconds' }));
  expect(video.currentTime).toBe(0);
  const seek = screen.getByRole('slider', { name: 'Seek' });
  fireEvent.change(seek, { target: { value: '42' } });
  fireEvent.pointerUp(seek);
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 42 }));
  fireEvent.change(seek, { target: { value: '51' } });
  fireEvent.keyUp(seek, { key: 'ArrowRight' });
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 51 }));
  fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0' } });
  fireEvent.volumeChange(video);
  expect(video.muted).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
  fireEvent.volumeChange(video);
  expect(video.volume).toBe(0.5);
  expect(video.muted).toBe(false);
});

it('supports play and pause on the video surface and the control bar', async () => {
  const { container } = mount(); ready(container);
  fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
  expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Pause video' }));
  expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Play' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument());
});

it('stays ready for a manual play attempt when the browser rejects autoplay', async () => {
  jest.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error('Autoplay blocked'));
  const { container } = mount(); ready(container);
  fireEvent.click(screen.getByRole('button', { name: 'Play video' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled());
  expect(screen.queryByText('Loading video...')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('can skip the countdown immediately and close the queue without switching titles', () => {
  const { container } = mount();
  fireEvent.ended(ready(container));
  fireEvent.click(screen.getByRole('button', { name: 'Play now' }));
  expect(screen.getByRole('heading', { name: 'Second movie' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Playlist' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close playlist' }));
  expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
});

it('saves progress before returning to the catalog', async () => {
  const onBack = jest.fn();
  const { container } = mount({ onBack });
  const video = ready(container); video.currentTime = 32;
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  expect(onBack).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 32 }));
});

it('enters and leaves fullscreen through the browser API', async () => {
  const enter = jest.fn().mockResolvedValue(undefined);
  const exit = jest.fn().mockResolvedValue(undefined);
  capability(HTMLElement.prototype, 'requestFullscreen', enter);
  capability(document, 'exitFullscreen', exit);
  const { container } = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
  await waitFor(() => expect(enter).toHaveBeenCalledTimes(1));
  capability(document, 'fullscreenElement', container.firstChild);
  fireEvent(document, new Event('fullscreenchange'));
  fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }));
  await waitFor(() => expect(exit).toHaveBeenCalledTimes(1));
});

it('uses the mobile video fullscreen API when the container API is unavailable', async () => {
  const enter = jest.fn();
  capability(HTMLVideoElement.prototype, 'webkitEnterFullscreen', enter);
  const { container } = mount(); ready(container);
  fireEvent.doubleClick(screen.getByRole('button', { name: 'Play video' }));
  await waitFor(() => expect(enter).toHaveBeenCalledTimes(1));
});

it.each([false, true])('explains fullscreen unavailability when the API is missing or fails: %s', rejects => {
  if (rejects) capability(HTMLElement.prototype, 'requestFullscreen', jest.fn().mockRejectedValue(new Error('Denied')));
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Fullscreen' }));
  return waitFor(() => expect(screen.getByText('Fullscreen is unavailable on this device.')).toBeInTheDocument());
});

it('offers picture in picture only on capable devices and supports returning to the player', async () => {
  const enter = jest.fn().mockResolvedValue(undefined);
  const exit = jest.fn().mockResolvedValue(undefined);
  capability(document, 'pictureInPictureEnabled', true);
  capability(HTMLVideoElement.prototype, 'requestPictureInPicture', enter);
  capability(document, 'exitPictureInPicture', exit);
  const { container } = mount(); ready(container);
  fireEvent.click(screen.getByRole('button', { name: 'Picture in picture' }));
  await waitFor(() => expect(enter).toHaveBeenCalledTimes(1));
  capability(document, 'pictureInPictureElement', container.querySelector('video'));
  fireEvent.click(screen.getByRole('button', { name: 'Picture in picture' }));
  await waitFor(() => expect(exit).toHaveBeenCalledTimes(1));
});

it('keeps playback available when picture in picture is rejected', async () => {
  capability(document, 'pictureInPictureEnabled', true);
  capability(HTMLVideoElement.prototype, 'requestPictureInPicture', jest.fn().mockRejectedValue(new Error('Denied')));
  const { container } = mount(); ready(container);
  fireEvent.click(screen.getByRole('button', { name: 'Picture in picture' }));
  await waitFor(() => expect(screen.getByText('Picture in picture is unavailable.')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
});

it('hides fullscreen controls after a pointer click, but keeps controls available during keyboard navigation', () => {
  jest.useFakeTimers();
  capability(HTMLElement.prototype, 'requestFullscreen', jest.fn().mockResolvedValue(undefined));
  const { container } = mount();
  fireEvent.playing(ready(container));
  const fullscreen = screen.getByRole('button', { name: 'Fullscreen' });
  fireEvent.pointerDown(fullscreen);
  act(() => fullscreen.focus());
  fireEvent.click(fullscreen);
  capability(document, 'fullscreenElement', container.firstChild);
  fireEvent(document, new Event('fullscreenchange'));
  act(() => jest.advanceTimersByTime(3500));
  expect(container.querySelector('header')).toHaveAttribute('inert');
  expect(fullscreen).not.toHaveFocus();
  const region = screen.getByRole('region', { name: 'Video player' });
  expect(region).toHaveFocus();
  fireEvent.keyDown(region, { key: 'm' });
  expect(container.querySelector('video')?.muted).toBe(true);

  fireEvent.pointerMove(screen.getByRole('region', { name: 'Video player' }));
  fireEvent.keyDown(document, { key: 'Tab' });
  act(() => fullscreen.focus());
  act(() => jest.advanceTimersByTime(3500));
  expect(container.querySelector('header')).not.toHaveAttribute('inert');
  act(() => fullscreen.blur());
  act(() => jest.advanceTimersByTime(3500));
  expect(container.querySelector('header')).toHaveAttribute('inert');
});

it('hides inactive controls and wakes them on pointer movement while preserving keyboard focus', () => {
  jest.useFakeTimers();
  const { container } = mount();
  fireEvent.playing(ready(container));
  const header = container.querySelector('header')!;
  act(() => { jest.advanceTimersByTime(3500); });
  expect(header).toHaveAttribute('inert');
  fireEvent.pointerMove(screen.getByRole('region', { name: 'Video player' }));
  expect(header).not.toHaveAttribute('inert');
  fireEvent.keyDown(document, { key: 'Tab' });
  act(() => { screen.getByRole('button', { name: 'Back' }).focus(); });
  act(() => { jest.advanceTimersByTime(3500); });
  expect(header).not.toHaveAttribute('inert');
});

it('reports a failed progress save and clears the notice after a subsequent successful save', async () => {
  jest.mocked(updateWatchTime).mockResolvedValueOnce({ error: 'Unavailable' });
  const { container } = mount();
  const video = ready(container); video.currentTime = 30;
  fireEvent.pause(video);
  await waitFor(() => expect(screen.getByText('Progress could not be saved. Playback can continue.')).toBeInTheDocument());
  video.currentTime = 40; fireEvent.pause(video);
  await waitFor(() => expect(screen.queryByText('Progress could not be saved. Playback can continue.')).not.toBeInTheDocument());
});

it('retries failed progress requests without creating a partial cache entry', async () => {
  jest.mocked(updateWatchTime).mockRejectedValueOnce(new Error('Offline'));
  const { container } = mount();
  const video = ready(container); video.currentTime = 30;
  fireEvent.pause(video);
  await waitFor(() => expect(screen.getByText('Progress could not be saved. Playback can continue.')).toBeInTheDocument());
  fireEvent.pause(video);
  await waitFor(() => expect(mockMutate).toHaveBeenCalled());
  expect(mockMutate.mock.calls[0][1](undefined)).toBeUndefined();
});

it('saves progress when the page is hidden or left', async () => {
  const { container } = mount();
  const video = ready(container); video.currentTime = 31;
  capability(document, 'visibilityState', 'hidden');
  fireEvent(document, new Event('visibilitychange'));
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 31 }));
  video.currentTime = 41;
  fireEvent(window, new Event('pagehide'));
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 41 }));
});

it('renders video and playlist titles with custom controls, without native browser controls', () => {
  const { container } = mount();
  expect(screen.getByRole('heading', { name: 'First movie' })).toBeInTheDocument();
  expect(screen.getByText('Film night · 1 / 3')).toBeInTheDocument();
  expect(container.querySelector('video')).not.toHaveAttribute('controls');
  expect(container.querySelector('source')).toHaveAttribute('src', '/api/video/one');
  expect(screen.getByRole('slider', { name: 'Seek' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Previous video' })).not.toBeInTheDocument();
});

it('keeps long video titles available and updates them when switching playlist entries', () => {
  const firstTitle = 'Eine außergewöhnlich lange Reise durch ferne Welten – der erste Teil der Geschichte';
  const secondTitle = 'Die Fortsetzung einer außergewöhnlich langen Reise mit einem ebenso langen Videotitel';
  mount({ items: [{ id: 'one', title: firstTitle }, { id: 'two', title: secondTitle }] });
  expect(screen.getByRole('heading', { name: firstTitle })).toHaveAttribute('title', firstTitle);
  expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Playlist' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Next video' }));
  expect(screen.queryByRole('heading', { name: firstTitle })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: secondTitle })).toHaveAttribute('title', secondTitle);
  expect(document.title).toBe(`${secondTitle} · Netflix`);
});

it('renders supplied caption sources and keeps a direct empty track when captions are absent', () => {
  const { container } = mount({ items: [
    { ...items[0], captions: [{ src: '/captions/one.de.vtt', language: 'de', label: 'Deutsch', default: true }] },
    items[1],
  ] });
  const track = container.querySelector('track');
  expect(track).toHaveAttribute('kind', 'captions');
  expect(track).toHaveAttribute('src', '/captions/one.de.vtt');
  expect(track).toHaveAttribute('srclang', 'de');
  expect(track).toHaveAttribute('label', 'Deutsch');
  expect(track).toHaveAttribute('default');
  fireEvent.click(screen.getByRole('button', { name: 'Next video' }));
  const emptyTrack = container.querySelector('track');
  expect(emptyTrack).toHaveAttribute('kind', 'captions');
  expect(emptyTrack).not.toHaveAttribute('src');
});

it('restores progress after metadata and keeps volume, mute and playback speed preferences', () => {
  localStorage.setItem('videoVolume', '0.4'); localStorage.setItem('videoMuted', 'true'); localStorage.setItem('videoPlaybackRate', '1.5');
  const { container } = mount();
  const video = ready(container);
  expect(video.currentTime).toBe(25);
  expect(video.volume).toBe(0.4);
  expect(video.muted).toBe(true);
  expect(video.playbackRate).toBe(1.5);
  expect(screen.getByRole('slider', { name: 'Seek' })).toBeEnabled();
  fireEvent.change(screen.getByRole('combobox', { name: 'Playback speed' }), { target: { value: '2' } });
  fireEvent.rateChange(video);
  expect(localStorage.getItem('videoPlaybackRate')).toBe('2');
});

it('keeps volume, mute and speed separate when switching between watching and categorizing', () => {
  localStorage.setItem('videoVolume', '0.4');
  localStorage.setItem('videoMuted', 'true');
  localStorage.setItem('videoPlaybackRate', '1.5');
  const view = (mode: 'watch' | 'categorize') => <LanguageProvider initialLocale="en"><VideoPlayer items={[items[0]]} mode={mode} startTime={0} onBack={jest.fn()} /></LanguageProvider>;
  const { container, rerender } = render(view('watch'));
  let video = ready(container);
  expect(video.volume).toBe(0.4);
  expect(video.muted).toBe(true);
  expect(video.playbackRate).toBe(1.5);

  rerender(view('categorize'));
  video = ready(container);
  expect(video.volume).toBe(1);
  expect(video.muted).toBe(false);
  expect(video.playbackRate).toBe(1);
  fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.2' } });
  fireEvent.volumeChange(video);
  fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
  fireEvent.volumeChange(video);
  fireEvent.change(screen.getByRole('combobox', { name: 'Playback speed' }), { target: { value: '2' } });
  fireEvent.rateChange(video);
  expect(localStorage.getItem('videoVolume')).toBe('0.4');
  expect(localStorage.getItem('videoPlaybackRate')).toBe('1.5');

  rerender(view('watch'));
  video = ready(container);
  expect(video.volume).toBe(0.4);
  expect(video.muted).toBe(true);
  expect(video.playbackRate).toBe(1.5);
  fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '0.7' } });
  fireEvent.volumeChange(video);

  rerender(view('categorize'));
  video = ready(container);
  expect(video.volume).toBe(0.2);
  expect(video.muted).toBe(true);
  expect(video.playbackRate).toBe(2);
});

it('honors an explicit restart instead of restoring saved progress', () => {
  const { container } = mount({ startTime: 0 });
  expect(ready(container).currentTime).toBe(0);
});

it('flushes the old title progress before switching and records the new title once', async () => {
  const { container } = mount();
  const first = ready(container); first.currentTime = 37;
  fireEvent.click(screen.getByRole('button', { name: 'Next video' }));
  expect(screen.getByRole('heading', { name: 'Second movie' })).toBeInTheDocument();
  expect(container.querySelector('source')).toHaveAttribute('src', '/api/video/two');
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 37 }));
  expect(addMovieView).toHaveBeenCalledWith({ movieId: 'two' });
  fireEvent.click(screen.getByRole('button', { name: 'Previous video' }));
  expect(screen.getByRole('heading', { name: 'First movie' })).toBeInTheDocument();
});

it('lets the viewer choose any queue item and preserves custom autoplay preference', () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Playlist' }));
  const queue = screen.getByRole('complementary', { name: 'Playlist' });
  expect(within(queue).getByRole('button', { name: 'First movie' })).toHaveAttribute('aria-current', 'true');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Autoplay next video' }));
  expect(localStorage.getItem('playerAutoplayNext')).toBe('false');
  fireEvent.click(within(queue).getByRole('button', { name: '3 Third movie' }));
  expect(screen.getByRole('heading', { name: 'Third movie' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Next video' })).not.toBeInTheDocument();
});

it('automatically advances only after the countdown', () => {
  jest.useFakeTimers();
  const { container } = mount();
  const video = ready(container); video.currentTime = 120;
  fireEvent.ended(video);
  expect(screen.getByRole('region', { name: 'Up next' })).toBeInTheDocument();
  for (let second = 0; second < 4; second++) act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByRole('heading', { name: 'First movie' })).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByRole('heading', { name: 'Second movie' })).toBeInTheDocument();
});

it('cancels autoplay and leaves the completed title available for replay', () => {
  jest.useFakeTimers();
  const { container } = mount();
  fireEvent.ended(ready(container));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  act(() => { jest.advanceTimersByTime(10000); });
  expect(screen.getByRole('heading', { name: 'First movie' })).toBeInTheDocument();
  expect(screen.getByText('Playback finished.')).toBeInTheDocument();
});

it('does not autoplay at the end of the queue or when autoplay is off', () => {
  localStorage.setItem('playerAutoplayNext', 'false');
  const { container } = mount();
  fireEvent.ended(ready(container));
  expect(screen.queryByRole('region', { name: 'Up next' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next video' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next video' }));
  fireEvent.ended(ready(container));
  expect(screen.queryByRole('region', { name: 'Up next' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Third movie' })).toBeInTheDocument();
});

it('seeks with keyboard shortcuts, clamps to the video and leaves form controls alone', () => {
  const { container } = mount({ startTime: 0 });
  const video = ready(container, 12);
  const player = screen.getByRole('region', { name: 'Video player' });
  fireEvent.keyDown(player, { key: 'ArrowRight' }); expect(video.currentTime).toBe(10);
  fireEvent.keyDown(player, { key: 'ArrowRight' }); expect(video.currentTime).toBe(12);
  fireEvent.keyDown(player, { key: 'ArrowLeft' }); expect(video.currentTime).toBe(2);
  fireEvent.keyDown(player, { key: 'ArrowLeft' }); expect(video.currentTime).toBe(0);
  const select = screen.getByRole('combobox', { name: 'Playback speed' });
  fireEvent.keyDown(select, { key: 'm' }); expect(video.muted).toBe(false);
  fireEvent.keyDown(player, { key: 'm' }); expect(video.muted).toBe(true);
});

it('saves periodic and pause progress without duplicate writes for the same position', async () => {
  const { container } = mount({ startTime: 0 });
  const video = ready(container); video.currentTime = 10.3;
  fireEvent.timeUpdate(video); fireEvent.timeUpdate(video);
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledTimes(1));
  expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 10 });
  expect(mockMutate).toHaveBeenCalledWith('/api/movies/one', expect.any(Function), { revalidate: false });
  const updateCache = mockMutate.mock.calls[0][1];
  expect(updateCache({ title: 'First movie', watchTime: 0 })).toEqual({ title: 'First movie', watchTime: 10 });
  video.currentTime = 17; fireEvent.pause(video);
  await waitFor(() => expect(updateWatchTime).toHaveBeenCalledWith({ movieId: 'one', watchTime: 17 }));
});

it('shows media errors with retry while retaining playlist navigation', () => {
  const { container } = mount();
  fireEvent.error(container.querySelector('source')!);
  expect(screen.getByRole('alert')).toHaveTextContent('Video could not be played.');
  expect(screen.getByRole('button', { name: 'Next video' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
});

it.each([[0, '0:00'], [65, '1:05'], [3661, '1:01:01'], [Number.NaN, '0:00']])('formats %s seconds as %s', (seconds, expected) => {
  expect(formatMediaTime(seconds)).toBe(expected);
});
