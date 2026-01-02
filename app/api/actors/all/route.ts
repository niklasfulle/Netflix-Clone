
import { db } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function GET() {
	// Alle Actors alphabetisch sortiert, ohne Pagination
	const actors = await db.actor.findMany({
		orderBy: { name: 'asc' },
		include: {
			movies: {
				include: {
					movie: true
				}
			}
		}
	});

	// Für jeden Actor: Views über MovieView zählen
	const result = await Promise.all(actors.map(async actor => {
		const movieCount = actor.movies.filter(ma => ma.movie.type === 'Movie').length;
		const seriesCount = actor.movies.filter(ma => ma.movie.type === 'Serie').length;
		let views = 0;
		for (const ma of actor.movies) {
			const count = await db.movieView.count({ where: { movieId: ma.movie.id } });
			views += count;
		}
		return {
			id: actor.id,
			name: actor.name,
			movieCount,
			seriesCount,
			views
		};
	}));

	return Response.json({ actors: result }, { status: 200 });
}
