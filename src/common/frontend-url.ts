const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

/**
 * Build an absolute frontend URL.
 *
 * FRONTEND_URL is stored without a scheme in some environments
 * (`localhost:3000`), so normalise it before joining the path.
 */
export function buildFrontendUrl(
  baseUrl: string | undefined,
  path: string,
  query?: Record<string, string | undefined>,
): string {
  const trimmed = (baseUrl ?? '').trim().replace(/\/+$/, '');
  const base = trimmed
    ? /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `http://${trimmed}`
    : DEFAULT_FRONTEND_URL;

  const url = new URL(path.startsWith('/') ? path : `/${path}`, base);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}
