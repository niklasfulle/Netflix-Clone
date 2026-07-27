import { redirect } from "next/navigation";

export default async function LegacyEditMoviePage({
  params,
}: Readonly<{ params: Promise<{ movieId: string }> }>) {
  const { movieId } = await params;
  redirect(`/admin/movies/${movieId}/edit`);
}
