type ErrorEnvelope = {
  error?: string | {
      code?: string;
      message?: string;
    };
};

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return undefined;
  return response.json().catch(() => undefined);
}

export default async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  const payload = await parseJson(response);
  if (!response.ok) {
    const envelope = payload as ErrorEnvelope | undefined;
    const error = envelope?.error;
    throw new ApiClientError(
      response.status,
      typeof error === 'object' ? error.code ?? 'HTTP_ERROR' : 'HTTP_ERROR',
      typeof error === 'string' ? error : error?.message ?? 'Request failed.',
    );
  }
  return payload as T;
}
