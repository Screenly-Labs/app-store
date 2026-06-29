// Site-wide entry point. Bundled locally by Hugo's esbuild (js.Build) from the
// Bun-managed dependencies, no remote script loading, no jQuery.
import './sentry.js';
import { initAppGrid, initModals, initScrollClasses } from './ui.js';
import { initClipboard } from './clipboard.js';

initAppGrid();
initModals();
initScrollClasses();
initClipboard();
