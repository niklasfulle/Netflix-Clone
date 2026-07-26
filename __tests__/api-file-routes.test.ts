/** @jest-environment node */

jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));
jest.mock('@/lib/admin-auth', () => ({ isCurrentUserAdmin: jest.fn() }));
jest.mock('@/lib/logger', () => ({ logBackendAction: jest.fn() }));
jest.mock('@/lib/api-helpers', () => ({
  getUserAndProfile: jest.fn(),
  transformMoviesResponse: jest.fn((movies: unknown[]) => movies),
  handleApiError: jest.fn((error: unknown) => Response.json({ error: String(error) }, { status: 500 })),
}));
jest.mock('@/lib/db', () => ({
  db: {
    actor: { count: jest.fn(), create: jest.fn(), delete: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    movie: { findMany: jest.fn(), findUnique: jest.fn() },
    movieView: { count: jest.fn(), groupBy: jest.fn() },
    movieWatchTime: { findFirst: jest.fn(), findMany: jest.fn() },
    profil: { findFirst: jest.fn() },
  },
}));
jest.mock('node:fs', () => ({
  __esModule: true,
  default: {
    createReadStream: jest.fn(),
    createWriteStream: jest.fn(),
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn(),
    unlinkSync: jest.fn(),
    writeFileSync: jest.fn(),
  },
}));

import fs from 'node:fs';
import { currentUser } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import * as apiHelpers from '@/lib/api-helpers';
import { DELETE as deleteActor, GET as getActors, POST as createActor } from '@/app/api/actors/route';
import { DELETE as deleteActorLegacy } from '@/app/api/actors/delete';
import { GET as getMovie } from '@/app/api/movies/[movieId]/route';
import { GET as search } from '@/app/api/search/[searchItem]/route';
import { POST as uploadMovie } from '@/app/api/movies/upload';
import { POST as uploadChunk } from '@/app/api/movies/upload-chunk/route';
import { DELETE as deleteMovieFile } from '@/app/api/movies/delete/route';
import { GET as streamVideo } from '@/app/api/video/[videoId]/route';
import { GET as streamBillboard } from '@/app/api/video/billboard/[videoId]/route';
import { GET as getLogs } from '@/app/api/logs/route';
import { POST as clearLogs } from '@/app/api/logs/clear/route';

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedDb = db as any;
const mockedCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockedIsAdmin = isCurrentUserAdmin as jest.MockedFunction<typeof isCurrentUserAdmin>;
const mockedHelpers = apiHelpers as jest.Mocked<typeof apiHelpers>;
const json = (response: Response) => response.json();

describe('file and remaining API routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedHelpers.transformMoviesResponse.mockImplementation((movies: any) => movies);
    mockedHelpers.handleApiError.mockImplementation((error: unknown) =>
      Response.json({ error: String(error) }, { status: 500 }),
    );
  });

  it('covers actor authorization, pagination, creation, and deletion', async () => {
    mockedIsAdmin.mockResolvedValueOnce(false).mockResolvedValue(true);
    expect((await getActors(new Request('http://localhost/api/actors'))).status).toBe(403);

    mockedDb.actor.findMany.mockResolvedValue([{ id: 'actor1', name: 'Actor', movies: [
      { movie: { id: 'movie1', type: 'Movie' } },
      { movie: { id: 'series1', type: 'Serie' } },
    ] }]);
    mockedDb.movieView.groupBy.mockResolvedValue([
      { movieId: 'movie1', _count: { movieId: 2 } },
      { movieId: 'series1', _count: { movieId: 3 } },
    ]);
    expect(await json(await getActors(new Request('http://localhost/api/actors?page=1&pageSize=5')))).toMatchObject({
      actors: [{ id: 'actor1', movieCount: 1, seriesCount: 1, views: 5 }], page: 1, pageSize: 5,
    });

    expect((await createActor(new Request('http://localhost/api/actors', {
      method: 'POST', body: JSON.stringify({}), headers: { 'content-type': 'application/json' },
    }))).status).toBe(400);
    mockedDb.actor.findFirst.mockResolvedValueOnce(null);
    mockedDb.actor.create.mockResolvedValue({ id: 'actor2', name: 'New Actor' });
    expect((await createActor(new Request('http://localhost/api/actors', {
      method: 'POST', body: JSON.stringify({ name: 'New Actor' }), headers: { 'content-type': 'application/json' },
    }))).status).toBe(201);

    mockedDb.actor.findUnique.mockResolvedValueOnce({ id: 'actor2', movies: [] });
    expect(await json(await deleteActor(new Request('http://localhost/api/actors?id=actor2', { method: 'DELETE' })))).toEqual({ success: true });
  });

  it('covers legacy actor deletion validation and linked actors', async () => {
    expect((await deleteActorLegacy(new Request('http://localhost/api/actors', { method: 'DELETE' }))).status).toBe(400);
    mockedDb.actor.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'actor1', movies: [{}] })
      .mockResolvedValueOnce({ id: 'actor1', movies: [] });
    expect((await deleteActorLegacy(new Request('http://localhost/api/actors?id=missing', { method: 'DELETE' }))).status).toBe(404);
    expect((await deleteActorLegacy(new Request('http://localhost/api/actors?id=actor1', { method: 'DELETE' }))).status).toBe(400);
    expect(await json(await deleteActorLegacy(new Request('http://localhost/api/actors?id=actor1', { method: 'DELETE' })))).toEqual({ success: true });
  });

  it('returns a movie with actors and watch time', async () => {
    mockedCurrentUser.mockResolvedValue({ id: 'user1' } as any);
    mockedDb.profil.findFirst.mockResolvedValue({ id: 'profile1' });
    mockedDb.movie.findUnique.mockResolvedValue({
      id: 'movie1', actors: [{ actor: { id: 'actor1', name: 'Actor' } }],
    });
    mockedDb.movieWatchTime.findFirst.mockResolvedValue({ time: 42 });

    expect(await json(await getMovie(undefined as any, { params: Promise.resolve({ movieId: 'movie1' }) }))).toMatchObject({
      id: 'movie1', actors: [{ id: 'actor1', name: 'Actor' }], actorIds: ['actor1'], watchTime: 42,
    });
  });

  it('searches movies with the current profile watch time', async () => {
    mockedHelpers.getUserAndProfile.mockResolvedValue({
      user: { id: 'user1' }, profil: { id: 'profile1' }, error: null,
    } as any);
    mockedDb.movie.findMany.mockResolvedValue([{ id: 'movie1' }]);
    mockedDb.movieWatchTime.findMany.mockResolvedValue([{ movieId: 'movie1', time: 10 }]);
    mockedHelpers.transformMoviesResponse.mockReturnValue([{ id: 'movie1', watchTime: 10 }] as any);

    expect(await json(await search(new Request('http://localhost/api/search/Test'), {
      params: Promise.resolve({ searchItem: 'Star%20Wars' }),
    }))).toEqual([{ id: 'movie1', watchTime: 10 }]);
  });

  it('validates and stores an uploaded movie file', async () => {
    const tooLarge = { headers: new Headers({ 'content-length': String(2 * 1024 * 1024 * 1024) }) } as any;
    expect((await uploadMovie(tooLarge)).status).toBe(413);

    const file = { name: 'movie.mp4', size: 3, arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer) };
    const request = {
      headers: new Headers(),
      formData: jest.fn().mockResolvedValue({ get: jest.fn(() => file) }),
    } as any;
    mockedFs.existsSync.mockReturnValue(false);
    expect(await json(await uploadMovie(request))).toMatchObject({ success: true });
    expect(mockedFs.mkdirSync).toHaveBeenCalled();
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
  });

  it('stores a partial upload chunk and handles missing parameters', async () => {
    const formData = (values: Record<string, any>) => ({ get: (key: string) => values[key] ?? null });
    expect((await uploadChunk({ formData: jest.fn().mockResolvedValue(formData({})) } as any)).status).toBe(400);

    const chunk = { arrayBuffer: jest.fn().mockResolvedValue(new Uint8Array([1]).buffer) };
    mockedFs.existsSync.mockReturnValue(false);
    const response = await uploadChunk({ formData: jest.fn().mockResolvedValue(formData({
      chunk, chunkIndex: '0', totalChunks: '2', fileName: 'movie.mp4', fileId: 'file1', videoType: 'Movie', generatedId: 'video1',
    })) } as any);
    expect(await json(response)).toMatchObject({ success: true, chunkIndex: 0, completed: false });
  });

  it('deletes existing movie files and reports missing files', async () => {
    const request = (filePath: string) => ({ json: jest.fn().mockResolvedValue({ filePath }) } as any);
    mockedFs.existsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(await json(await deleteMovieFile(request('movie.mp4')))).toMatchObject({ success: true });
    expect((await deleteMovieFile(request('missing.mp4'))).status).toBe(404);
  });

  it('streams full and ranged videos and billboard previews', async () => {
    mockedDb.movie.findUnique.mockResolvedValue({ id: 'movie1', type: 'Movie', videoUrl: 'video1' });
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.statSync.mockReturnValue({ size: 100 } as any);
    mockedFs.createReadStream.mockReturnValue(new ReadableStream() as any);

    const noRange = { headers: new Headers() } as any;
    const range = { headers: new Headers({ range: 'bytes=10-19' }) } as any;
    expect((await streamVideo(noRange, { params: Promise.resolve({ videoId: 'movie1' }) })).status).toBe(200);
    expect((await streamVideo(range, { params: Promise.resolve({ videoId: 'movie1' }) })).status).toBe(206);
    expect((await streamBillboard(noRange, { params: Promise.resolve({ videoId: 'movie1' }) })).status).toBe(200);
    expect((await streamBillboard(range, { params: Promise.resolve({ videoId: 'movie1' }) })).status).toBe(206);
  });

  it('paginates backend logs for admins', async () => {
    mockedIsAdmin.mockResolvedValueOnce(false).mockResolvedValue(true);
    const request = new Request('http://localhost/api/logs?page=1&pageSize=2') as any;
    expect((await getLogs(request)).status).toBe(403);

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue('{"message":"new"}\nplain log line\n{"message":"old"}' as any);
    expect(await json(await getLogs(request))).toMatchObject({
      logs: [{ message: 'old' }, { raw: 'plain log line' }],
      total: 3,
      page: 1,
      pageSize: 2,
      totalPages: 2,
    });
  });

  it('clears backend log files for admins', async () => {
    mockedIsAdmin.mockResolvedValueOnce(false).mockResolvedValue(true);
    expect((await clearLogs()).status).toBe(403);

    expect(await json(await clearLogs())).toEqual({ success: true });
    expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
  });
});
