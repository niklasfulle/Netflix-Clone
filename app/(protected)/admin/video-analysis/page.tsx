import { ManualCategorization } from '@/components/admin/ManualCategorization';

export default async function VideoAnalysisPage({ searchParams }: Readonly<{ searchParams: Promise<{ movieId?: string }> }>) {
  const { movieId } = await searchParams;
  return <ManualCategorization initialMovieId={movieId} />;
}
