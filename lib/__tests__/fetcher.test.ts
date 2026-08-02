/** @jest-environment node */

import fetcher, { ApiClientError } from '@/lib/fetcher';

describe('fetcher', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('returns a typed JSON payload for successful responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response(JSON.stringify({ id: 'movie-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));

    await expect(fetcher<{ id: string }>('/api/movies/movie-1')).resolves.toEqual({ id: 'movie-1' });
  });

  it('throws a consistent safe error for non-2xx responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'NOT_FOUND', message: 'Movie not found.' },
    }), { status: 404, headers: { 'Content-Type': 'application/json' } }));

    await expect(fetcher('/api/movies/missing')).rejects.toEqual(
      new ApiClientError(404, 'NOT_FOUND', 'Movie not found.'),
    );
  });

  it('does not expose malformed server error bodies', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(new Response('<html>secret stack</html>', { status: 500 }));

    await expect(fetcher('/api/failure')).rejects.toMatchObject({
      status: 500,
      code: 'HTTP_ERROR',
      message: 'Request failed.',
    });
  });
});
