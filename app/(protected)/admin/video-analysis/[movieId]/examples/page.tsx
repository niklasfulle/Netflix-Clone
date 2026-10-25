import { VideoExampleEditor } from '@/components/admin/VideoExampleEditor';

export default async function VideoExamplesPage({ params }: Readonly<{ params: Promise<{ movieId: string }> }>) {
  const { movieId } = await params;
  return <VideoExampleEditor key={movieId} movieId={movieId} />;
}
