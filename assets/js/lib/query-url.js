// Build an app launch URL from a base URL plus a map of query parameters,
// skipping any empty values. Pure function — unit tested with `bun test`.
export function buildQueryUrl(url, params) {
  const query = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return query ? `${url}?${query}` : url;
}
