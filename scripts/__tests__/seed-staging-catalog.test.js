/** @jest-environment node */

jest.mock('@prisma/client', () => ({ PrismaClient: jest.fn() }));

const {
  buildStagingCatalog,
  seedStagingCatalog,
} = require('../seed-staging-catalog');

const environment = {
  DEPLOYMENT_ENVIRONMENT: 'staging',
  NEXT_PUBLIC_GENRE: 'Action,Comedy,Drama',
};

function createDatabase() {
  const transaction = {
    actor: { upsert: jest.fn() },
    movie: { upsert: jest.fn() },
    movieActor: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  return {
    transaction,
    db: {
      $queryRaw: jest.fn().mockResolvedValue([
        { database_name: 'netflix_staging' },
      ]),
      $transaction: jest.fn(async (callback) => callback(transaction)),
    },
  };
}

describe('staging catalog seed', () => {
  it('defines playable movie and series records plus non-public states', () => {
    const catalog = buildStagingCatalog(environment);

    expect(catalog.movies).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'staging-player-movie',
        type: 'Movie',
        status: 'PUBLISHED',
        videoUrl: 'staging-player-movie.mp4',
      }),
      expect.objectContaining({
        id: 'staging-player-series',
        type: 'Serie',
        status: 'PUBLISHED',
        videoUrl: 'staging-player-series.mp4',
      }),
      expect.objectContaining({ status: 'DRAFT' }),
      expect.objectContaining({ status: 'ARCHIVED' }),
    ]));
    expect(catalog.movies.every((movie) => (
      environment.NEXT_PUBLIC_GENRE.split(',').includes(movie.genre)
    ))).toBe(true);
  });

  it('provides ten published movies for one actor to exercise long catalog rows', () => {
    const catalog = buildStagingCatalog(environment);
    const averyStone = catalog.actors.find((actor) => (
      actor.name === '[STAGING] Avery Stone'
    ));
    const publishedMovies = catalog.movies.filter((movie) => (
      movie.type === 'Movie'
      && movie.status === 'PUBLISHED'
      && movie.actorIds.includes(averyStone.id)
    ));

    expect(publishedMovies).toHaveLength(10);
  });

  it('rejects production and databases without a staging name', async () => {
    const { db } = createDatabase();

    await expect(seedStagingCatalog({
      db,
      environment: { ...environment, DEPLOYMENT_ENVIRONMENT: 'production' },
    })).rejects.toThrow('only be seeded in the staging environment');
    expect(db.$queryRaw).not.toHaveBeenCalled();

    db.$queryRaw.mockResolvedValue([{ database_name: 'netflix' }]);
    await expect(seedStagingCatalog({ db, environment })).rejects.toThrow(
      'only be seeded into a staging database',
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it('upserts the deterministic catalog and replaces only its actor links', async () => {
    const { db, transaction } = createDatabase();

    await expect(seedStagingCatalog({ db, environment })).resolves.toEqual({
      seededActors: 4,
      seededMovies: 14,
    });

    expect(transaction.actor.upsert).toHaveBeenCalledTimes(4);
    expect(transaction.movie.upsert).toHaveBeenCalledTimes(14);
    expect(transaction.movieActor.deleteMany).toHaveBeenCalledTimes(14);
    expect(transaction.movieActor.createMany).toHaveBeenCalledTimes(14);
  });

  it('requires at least one configured staging genre', () => {
    expect(() => buildStagingCatalog({
      ...environment,
      NEXT_PUBLIC_GENRE: '  ',
    })).toThrow('NEXT_PUBLIC_GENRE');
  });
});
