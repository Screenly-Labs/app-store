// App configuration page: builds the launch URL from the chosen options.
// Every app now renders its settings form from its embedded signage-app
// manifest, so there is a single, generic entry point.
import { initManifestConfig } from './config-manifest.js';

initManifestConfig();
