import { cn, swapElements } from '../utils';

it('swaps adjacent playlist entries in place without dropping the rest of the queue', () => {
  const queue = ['first', 'second', 'third'];
  expect(swapElements(queue, 0, 1)).toBe(queue);
  expect(queue).toEqual(['second', 'first', 'third']);
  swapElements(queue, 1, 1);
  expect(queue).toEqual(['second', 'first', 'third']);
});

it('lets explicit Tailwind overrides replace conflicting defaults', () => {
  expect(cn('px-2 text-white', false, undefined, { 'px-4': true })).toBe('text-white px-4');
});
