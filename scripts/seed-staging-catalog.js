/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { PrismaClient } = require('@prisma/client');

const ACTORS = [
  { id: 'staging-actor-avery', name: '[STAGING] Avery Stone' },
  { id: 'staging-actor-jordan', name: '[STAGING] Jordan Vale' },
  { id: 'staging-actor-morgan', name: '[STAGING] Morgan Reed' },
  { id: 'staging-actor-riley', name: '[STAGING] Riley Chen' },
];

function readRequired(environment, key) {
  const rawValue = environment[key];
  if (typeof rawValue !== 'string' || rawValue.trim() === '') {
    throw new Error(`Missing required staging catalog setting: ${key}`);
  }

  const value = rawValue.trim();
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.at(-1) === quote) {
    return value.slice(1, -1);
  }

  return value;
}

function readGenres(environment) {
  const genres = Array.from(new Set(
    readRequired(environment, 'NEXT_PUBLIC_GENRE')
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean),
  ));

  if (genres.length === 0) {
    throw new Error('NEXT_PUBLIC_GENRE must contain at least one staging genre');
  }

  return genres;
}

function buildStagingCatalog(environment) {
  const genres = readGenres(environment);
  const genreAt = (index) => genres[index % genres.length];
  const common = {
    thumbnailUrl: '/images/hero.jpg',
    duration: '00:10',
  };

  return {
    actors: ACTORS,
    movies: [
      {
        ...common,
        id: 'staging-player-movie',
        title: '[STAGING] Player Movie',
        description: 'Playable H.264/AAC fixture for player, seeking, progress, and range tests.',
        videoUrl: 'staging-player-movie.mp4',
        type: 'Movie',
        genre: genreAt(0),
        status: 'PUBLISHED',
        actorIds: [ACTORS[0].id, ACTORS[1].id],
      },
      {
        ...common,
        id: 'staging-billboard-movie',
        title: '[STAGING] Billboard Movie',
        description: 'Published fixture used to verify automatic billboard playback and fallback behavior.',
        videoUrl: 'staging-player-movie.mp4',
        type: 'Movie',
        genre: genreAt(2),
        status: 'PUBLISHED',
        actorIds: [ACTORS[2].id],
      },
      {
        ...common,
        id: 'staging-player-series',
        title: '[STAGING] Player Series',
        description: 'Playable series fixture stored in the isolated series media mount.',
        videoUrl: 'staging-player-series.mp4',
        type: 'Serie',
        genre: genreAt(1),
        status: 'PUBLISHED',
        actorIds: [ACTORS[1].id, ACTORS[3].id],
      },
      {
        ...common,
        id: 'staging-search-movie',
        title: '[STAGING] Searchable Movie',
        description: 'Published catalog fixture for search, actor, list, and filtering checks.',
        videoUrl: 'staging-player-movie.mp4',
        type: 'Movie',
        genre: genreAt(1),
        status: 'PUBLISHED',
        actorIds: [ACTORS[0].id, ACTORS[3].id],
      },
      {
        ...common,
        id: 'staging-draft-movie',
        title: '[STAGING] Draft Movie',
        description: 'Draft fixture that must remain hidden from the public catalog and streaming routes.',
        videoUrl: 'staging-player-movie.mp4',
        type: 'Movie',
        genre: genreAt(0),
        status: 'DRAFT',
        actorIds: [ACTORS[2].id],
      },
      {
        ...common,
        id: 'staging-archived-series',
        title: '[STAGING] Archived Series',
        description: 'Archived fixture for administration filters and access-control regression tests.',
        videoUrl: 'staging-player-series.mp4',
        type: 'Serie',
        genre: genreAt(2),
        status: 'ARCHIVED',
        actorIds: [ACTORS[3].id],
      },
    ],
  };
}

async function seedStagingCatalog({
  db,
  environment = process.env,
  now = () => new Date(),
}) {
  if (readRequired(environment, 'DEPLOYMENT_ENVIRONMENT') !== 'staging') {
    throw new Error('The catalog can only be seeded in the staging environment');
  }

  const databaseRows = await db.$queryRaw`
    SELECT lower(current_database()) AS database_name
  `;
  const databaseName = String(databaseRows[0]?.database_name ?? '');
  if (!databaseName.includes('stage') && !databaseName.includes('staging')) {
    throw new Error('The catalog can only be seeded into a staging database');
  }

  const catalog = buildStagingCatalog(environment);
  const publishedAt = now();

  await db.$transaction(async (transaction) => {
    for (const actor of catalog.actors) {
      await transaction.actor.upsert({
        where: { id: actor.id },
        create: actor,
        update: { name: actor.name },
      });
    }

    for (const movie of catalog.movies) {
      const { actorIds, ...data } = movie;
      const persistedData = {
        ...data,
        publishedAt: data.status === 'PUBLISHED' ? publishedAt : null,
      };
      await transaction.movie.upsert({
        where: { id: data.id },
        create: persistedData,
        update: persistedData,
      });
      await transaction.movieActor.deleteMany({ where: { movieId: data.id } });
      await transaction.movieActor.createMany({
        data: actorIds.map((actorId) => ({ movieId: data.id, actorId })),
        skipDuplicates: true,
      });
    }
  });

  return {
    seededActors: catalog.actors.length,
    seededMovies: catalog.movies.length,
  };
}

async function main() {
  const db = new PrismaClient();
  try {
    const result = await seedStagingCatalog({ db });
    console.log(`Seeded ${result.seededMovies} staging titles and ${result.seededActors} actors`);
  } finally {
    await db.$disconnect();
  }
}

async function runMain() {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Staging catalog seed failed');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runMain(); // NOSONAR -- This CommonJS entry point cannot use top-level await.
}

module.exports = {
  buildStagingCatalog,
  seedStagingCatalog,
};
