// App configuration page: builds the launch URL from the chosen options.
// Most apps (Weather / Air Quality / Clock) share a location + clock-format
// form; the World Clock has its own, richer board picker, so we dispatch on the
// markup the page renders.
import { buildQueryUrl } from './lib/query-url.js';
import { initLocationMap } from './lib/location-map.js';
import { initWorldClockConfig } from './config-world-clock.js';
import { initManifestConfig } from './config-manifest.js';

// Location + clock-format form shared by Weather, Air Quality and Clock.
function initLocationConfig() {
  const input = document.getElementById('app-form-url');
  if (!input) return;

  const url = input.dataset.url;
  const params = { lat: '', lng: '', '24h': '' };
  const updateUrl = () => {
    input.value = buildQueryUrl(url, params);
  };

  const mapMount = document.querySelector('[data-location-map]');
  if (mapMount) {
    initLocationMap(mapMount, {
      onChange: ({ lat, lng }) => {
        params.lat = lat;
        params.lng = lng;
        updateUrl();
      },
    });
  }

  const clockFormat = document.getElementById('clockformat-select');
  clockFormat?.addEventListener('change', () => {
    params['24h'] = clockFormat.value;
    updateUrl();
  });
}

if (document.querySelector('[data-manifest-config]')) {
  initManifestConfig();
} else if (document.querySelector('[data-world-clock-config]')) {
  initWorldClockConfig();
} else {
  initLocationConfig();
}
