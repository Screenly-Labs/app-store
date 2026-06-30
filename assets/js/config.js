// App configuration page (Weather / Air Quality / Clock): builds the launch URL
// from the chosen options and an optional map location.
import { buildQueryUrl } from './lib/query-url.js';
import { initLocationMap } from './lib/location-map.js';

function initConfig() {
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

initConfig();
