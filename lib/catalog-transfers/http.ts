import { TransferError } from './store';

export function transferErrorResponse(error: unknown) {
  if (error instanceof TransferError) return Response.json({ error: error.message }, { status: error.status });
  return Response.json({ error: 'Der Katalog-Transfer ist fehlgeschlagen. Bitte Transfer-Dienst, Speicherplatz und Dateiberechtigungen prüfen.' }, { status: 500 });
}

export function sameOrigin(request: Request) {
  try { return new URL(request.headers.get('origin') || '').origin === new URL(process.env.AUTH_PUBLIC_URL || request.url).origin; }
  catch { return false; }
}
