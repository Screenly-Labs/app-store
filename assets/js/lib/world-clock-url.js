// Build a World Clock launch URL from the chosen settings. Pure function, unit
// tested with `bun test`.
//
// Cities are emitted as repeated `tz=` parameters (rather than a single
// comma-joined `clocks=` list) so a custom label is free to contain a comma,
// e.g. "Tokyo, Japan". Slashes and the `zone|label` pipe are kept literal — to
// match the links the World Clock app documents for itself — while spaces and
// other reserved characters are percent-encoded.
const encodeToken = (value) =>
  encodeURIComponent(value).replace(/%2F/g, '/').replace(/%7C/g, '|');

export function buildWorldClockUrl(baseUrl, settings = {}) {
  const { clocks = [], locale = '', format = '', seconds = false, title = '' } = settings;
  const parts = [];

  const trimmedTitle = title.trim();
  if (trimmedTitle) parts.push(`title=${encodeToken(trimmedTitle)}`);

  for (const clock of clocks) {
    const zone = (clock.tz ?? '').trim();
    if (!zone) continue;
    const label = (clock.label ?? '').trim();
    parts.push(`tz=${encodeToken(label ? `${zone}|${label}` : zone)}`);
  }

  if (locale) parts.push(`locale=${encodeToken(locale)}`);
  if (format === '12' || format === '24') parts.push(`format=${format}`);
  if (seconds) parts.push('seconds');

  return parts.length ? `${baseUrl}?${parts.join('&')}` : baseUrl;
}
