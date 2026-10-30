/* eslint-disable @typescript-eslint/no-require-imports -- standalone Node CLI */
const { createHmac } = require('node:crypto');
const bcrypt = require('bcrypt');

// Keep the original seed IDs so existing image choices are upgraded without duplicates.
const LOCAL_AVATARS = [
  { id: 'local-demo-avatar-blue', url: 'generated/fox.png' },
  { id: 'local-demo-avatar-green', url: 'generated/owl.png' },
  { id: 'local-demo-avatar-red', url: 'generated/panda.png' },
  { id: 'local-demo-avatar-yellow', url: 'generated/astronaut.png' },
];

function localAccounts(environment) {
  if (!environment.AUTH_SECRET) throw new Error('AUTH_SECRET is required for local demo accounts');
  const password = `Local-${createHmac('sha256', environment.AUTH_SECRET)
    .update('netflix-local-demo-accounts-v1').digest('hex').slice(0, 20)}!`;
  return [
    { id: 'local-demo-admin', email: 'admin@netflix.test', name: 'Local Admin', role: 'ADMIN', password },
    { id: 'local-demo-user', email: 'user@netflix.test', name: 'Local User', role: 'USER', password },
  ];
}

async function assertLocalDatabase(db, environment) {
  if (environment.DEPLOYMENT_ENVIRONMENT !== 'local') {
    throw new Error('Demo data can only be seeded in the local environment');
  }
  const rows = await db.$queryRaw`SELECT current_database() AS database_name`;
  if (rows[0]?.database_name !== 'netflix_local') {
    throw new Error('Demo data can only be seeded into netflix_local');
  }
}

function localCatalog(environment) {
  const genres = [...new Set((environment.NEXT_PUBLIC_GENRE || '').split(',').map(g => g.trim()).filter(Boolean))];
  if (!genres.length) throw new Error('NEXT_PUBLIC_GENRE is required for the local catalog');
  return Array.from({ length: 16 }, (_, index) => {
    const series = index >= 10;
    const status = new Map([[14, 'DRAFT'], [15, 'ARCHIVED']]).get(index) ?? 'PUBLISHED';
    return {
      id: `local-demo-title-${index + 1}`,
      title: `[LOKAL] ${series ? 'Serie' : 'Film'} ${String(index + 1).padStart(2, '0')}`,
      description: 'Lokaler Beispielinhalt mit synthetischem Testvideo für Wiedergabe, Suche und Verwaltung.',
      videoUrl: 'local-demo.mp4',
      thumbnailUrl: '/images/hero.jpg',
      type: series ? 'Serie' : 'Movie',
      genre: genres[index % genres.length],
      duration: '00:12',
      status,
      publishedAt: status === 'PUBLISHED' ? new Date('2026-01-01T12:00:00Z') : null,
    };
  });
}

async function seedLocal({ db, environment = process.env }) {
  await assertLocalDatabase(db, environment);
  const accounts = localAccounts(environment);
  let movies = [];
  let snapshotMode = false;
  const passwordHash = await bcrypt.hash(accounts[0].password, 10);

  await db.$transaction(async tx => {
    await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(6401404)');
    const state = await tx.catalogDataState.findUnique({ where: { id: 'global' } });
    snapshotMode = state?.mode === 'production-snapshot';
    if (!snapshotMode) movies = localCatalog(environment);
    const actorIds = [];
    for (const [index, name] of (snapshotMode ? [] : ['Alex Sommer', 'Mika Winter', 'Robin Berg', 'Sam Wald']).entries()) {
      const id = `local-demo-actor-${index + 1}`;
      await tx.actor.upsert({ where: { id }, create: { id, name: `[LOKAL] ${name}` }, update: {} });
      actorIds.push(id);
    }
    for (const [index, movie] of movies.entries()) {
      await tx.movie.upsert({
        where: { id: movie.id },
        create: { ...movie, actors: { create: [
          { actorId: actorIds[index % actorIds.length] },
          { actorId: actorIds[(index + 1) % actorIds.length] },
        ] } },
        update: {},
      });
    }
    for (const account of accounts) {
      const user = { id: account.id, email: account.email, name: account.name, role: account.role };
      const existing = await tx.user.findUnique({ where: { email: user.email } });
      if (existing && existing.id !== user.id) {
        throw new Error(`Local demo email already belongs to another account: ${user.email}`);
      }
      await tx.user.upsert({ where: { id: user.id }, create: {
        ...user, hashedPassword: passwordHash, emailVerified: new Date(),
      }, update: {} });
      const profilId = `${user.id}-profile`;
      const image = LOCAL_AVATARS[user.role === 'ADMIN' ? 0 : 1].url;
      await tx.profil.upsert({ where: { id: profilId }, create: {
        id: profilId, userId: user.id, name: user.name,
        image, favoriteIds: snapshotMode ? [] : [movies[0].id, movies[10].id],
      }, update: {} });
      await tx.profil.updateMany({
        where: { id: profilId, userId: user.id, OR: [
          { image: null }, { image: '/images/profil/default-blue.png' }, { image: 'default-blue.png' },
        ] },
        data: { image },
      });
      if (movies[1]) await tx.watchlist.upsert({ where: { profilId_movieId: { profilId, movieId: movies[1].id } },
        create: { userId: user.id, profilId, movieId: movies[1].id }, update: {} });
      await tx.playlist.upsert({ where: { id: `${user.id}-playlist` }, create: {
        id: `${user.id}-playlist`, userId: user.id, profilId, title: 'Lokaler Filmabend',
        PlaylistEntrys: { create: movies.slice(0, 3).map((movie, order) => ({ movieId: movie.id, order })) },
      }, update: {} });
      if (movies[0]) await tx.movieWatchTime.upsert({ where: { userId_profilId_movieId: {
        userId: user.id, profilId, movieId: movies[0].id,
      } }, create: { userId: user.id, profilId, movieId: movies[0].id, time: 4 }, update: {} });
    }
    for (const avatar of LOCAL_AVATARS) {
      await tx.profilImg.upsert({ where: { id: avatar.id },
        create: avatar, update: { url: avatar.url } });
    }
  });
  return { users: accounts.length, titles: movies.length, actors: snapshotMode ? 0 : 4 };
}

module.exports = { assertLocalDatabase, localAccounts, localCatalog, seedLocal, LOCAL_AVATARS };
