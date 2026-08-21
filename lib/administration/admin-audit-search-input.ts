const FILTER_KEYS = [
  'actor',
  'action',
  'targetType',
  'outcome',
  'from',
  'to',
] as const;

export function adminAuditSearchInput(
  searchParams: URLSearchParams,
  pagination?: { page: string; pageSize: string },
) {
  const page = pagination?.page ?? searchParams.get('page');
  const pageSize = pagination?.pageSize ?? searchParams.get('pageSize');
  const entries: Array<[string, string]> = [];
  if (page !== null) entries.push(['page', page]);
  if (pageSize !== null) entries.push(['pageSize', pageSize]);
  for (const key of FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value !== null) entries.push([key, value]);
  }
  return Object.fromEntries(entries);
}
