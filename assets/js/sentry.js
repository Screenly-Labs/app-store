// Error reporting via the modern Sentry SDK, installed with Bun and bundled
// locally (replaces the deprecated Raven 3.x CDN script).
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://e53dc4f3040b4184ac750942cde4b4b3@sentry.io/193319',
});
