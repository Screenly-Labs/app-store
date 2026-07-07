/* global google */
// Reusable location-picker map.
//
// Wraps the Google Maps JS API (an external service with no local equivalent)
// in a self-contained component: given a single mount element it builds its own
// canvas, centre pin, zoom / locate controls and a live coordinate readout,
// then reports the chosen centre back through an `onChange` callback. The map
// loads on demand and degrades gracefully when it is unavailable — the rest of
// the page keeps working without a location.

const GOOGLE_MAPS_API_KEY = 'AIzaSyD4xizgVnzfyTQgM15V3tvihZxQDAdUuAg';

// Custom "Video Wall" map theme, tuned to sit calmly behind the UI chrome.
const MAP_STYLES = [{ "featureType": "administrative", "elementType": "all", "stylers": [{ "lightness": -100 }, { "visibility": "off" }, { "saturation": "-77" }, { "color": "#000000" }] }, { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "visibility": "on" }, { "color": "#737880" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "saturation": "-70" }, { "lightness": "0" }, { "visibility": "on" }, { "color": "#e4e8ee" }] }, { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "hue": "#0066ff" }, { "saturation": "0" }, { "lightness": "0" }] }, { "featureType": "landscape", "elementType": "labels", "stylers": [{ "saturation": "-80" }, { "lightness": "-90" }, { "visibility": "off" }, { "color": "#737880" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "saturation": "-80" }, { "lightness": "-70" }, { "visibility": "off" }, { "gamma": "1" }, { "color": "#c0ccdf" }] }, { "featureType": "poi", "elementType": "labels", "stylers": [{ "color": "#737880" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "saturation": "-85" }, { "lightness": "60" }, { "visibility": "on" }, { "color": "#f5f9ff" }] }, { "featureType": "road", "elementType": "labels", "stylers": [{ "saturation": "-70" }, { "lightness": "50" }, { "visibility": "off" }, { "color": "#737880" }] }, { "featureType": "road.local", "elementType": "all", "stylers": [{ "saturation": "0" }, { "lightness": "-11" }, { "visibility": "on" }, { "color": "#f5f9ff" }] }, { "featureType": "road.local", "elementType": "labels", "stylers": [{ "color": "#61656b" }] }, { "featureType": "road.local", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "visibility": "simplified" }, { "lightness": "0" }, { "saturation": "0" }, { "color": "#f5f9ff" }] }, { "featureType": "transit", "elementType": "labels", "stylers": [{ "lightness": -100 }, { "visibility": "off" }, { "color": "#737880" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "saturation": "0" }, { "lightness": 100 }, { "visibility": "on" }, { "color": "#c6daf8" }] }, { "featureType": "water", "elementType": "labels", "stylers": [{ "saturation": -100 }, { "lightness": -100 }, { "visibility": "off" }, { "color": "#e4e8ee" }] }];

const DEFAULT_CENTER = { lat: 51.5287718, lng: -0.2417001 };
const DEFAULT_ZOOM = 13;

// Lucide icons, rendered as CSS-mask spans (the same kit and mechanism the rest
// of the site uses via the icon.html partial). Sizing is applied where each is
// mounted; the classes are compiled because assets/js is a Tailwind @source.
const ICONS = {
  pin: 'icon-[lucide--map-pin]',
  plus: 'icon-[lucide--plus]',
  minus: 'icon-[lucide--minus]',
  locate: 'icon-[lucide--locate-fixed]',
};

// Swap a mount over to the quiet, on-theme fallback. Used both when the script
// itself fails to load and when the API key is rejected for this domain.
const activeMounts = new Set();
function showUnavailable(mount) {
  mount.classList.remove('is-touched');
  mount.classList.add('loc-map--unavailable');
  mount.innerHTML = '<p class="loc-map__fallback">Map unavailable. The link still works without a location.</p>';
}

// Google calls this global when the API key is rejected — e.g. this domain
// isn't in the key's allowed referrers (as on stage/localhost). Without it,
// Google paints its own light "Oops! Something went wrong" panel inside our
// dark UI, which reads as broken; instead we show the same graceful fallback.
window.gm_authFailure = () => {
  for (const mount of activeMounts) showUnavailable(mount);
};

// Load the Maps script once per page and share the promise between callers.
let mapsPromise;
function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve();
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      document.head.append(script);
    });
  }
  return mapsPromise;
}

function controlButton(action, label, icon) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'loc-map__btn';
  button.dataset.act = action;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span class="${icon} size-4" aria-hidden="true"></span>`;
  return button;
}

// Build the component chrome inside `mount` and return its parts.
function buildChrome(mount) {
  mount.classList.add('loc-map');
  mount.innerHTML = `
    <div class="loc-map__canvas"></div>
    <div class="loc-map__frame"></div>
    <span class="loc-map__pin"><span class="${ICONS.pin} block size-8" aria-hidden="true"></span></span>
    <div class="loc-map__hint">Drag to set location</div>
  `;

  const controls = document.createElement('div');
  controls.className = 'loc-map__controls';
  const locate = controlButton('locate', 'Use my location', ICONS.locate);
  const zoomIn = controlButton('in', 'Zoom in', ICONS.plus);
  const zoomOut = controlButton('out', 'Zoom out', ICONS.minus);
  controls.append(locate, zoomIn, zoomOut);

  const readout = document.createElement('div');
  readout.className = 'loc-map__readout';
  readout.innerHTML = `<span class="${ICONS.pin} size-3.5 text-accent2" aria-hidden="true"></span><span data-coords>—</span>`;

  mount.append(controls, readout);

  return {
    canvas: mount.querySelector('.loc-map__canvas'),
    coords: readout.querySelector('[data-coords]'),
    locate,
    zoomIn,
    zoomOut,
  };
}

/**
 * Mount a location picker.
 * @param {HTMLElement} mount  Empty element to render the map into.
 * @param {object} [options]
 * @param {{lat:number,lng:number}} [options.center]  Initial centre.
 * @param {number} [options.zoom]       Initial zoom level.
 * @param {number} [options.precision]  Decimal places reported for lat/lng.
 * @param {(coords:{lat:string,lng:string}) => void} [options.onChange]
 */
export function initLocationMap(mount, options = {}) {
  const { center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, precision = 2, onChange } = options;

  // Host markup may override the defaults via data-attributes, which keeps the
  // component reusable for apps that want a different starting view.
  const startCenter = {
    lat: Number(mount.dataset.lat ?? center.lat),
    lng: Number(mount.dataset.lng ?? center.lng),
  };
  const startZoom = Number(mount.dataset.zoom ?? zoom);

  const { canvas, coords, locate, zoomIn, zoomOut } = buildChrome(mount);
  activeMounts.add(mount);

  loadGoogleMaps()
    .then(() => {
      const map = new google.maps.Map(canvas, {
        center: startCenter,
        zoom: startZoom,
        minZoom: 3,
        maxZoom: 18,
        disableDefaultUI: true,     // we render our own themed controls
        gestureHandling: 'greedy',  // scroll wheel / pinch zooms directly
        clickableIcons: false,
        keyboardShortcuts: false,
        styles: MAP_STYLES,
      });

      const renderCoords = () => {
        const c = map.getCenter();
        coords.textContent = `${c.lat().toFixed(precision)}, ${c.lng().toFixed(precision)}`;
      };
      const emit = () => {
        const c = map.getCenter();
        onChange?.({ lat: c.lat().toFixed(precision), lng: c.lng().toFixed(precision) });
      };
      const markTouched = () => mount.classList.add('is-touched');

      map.addListener('center_changed', renderCoords);
      map.addListener('dragstart', markTouched);
      map.addListener('dragend', emit);
      renderCoords();

      zoomIn.addEventListener('click', () => map.setZoom(map.getZoom() + 1));
      zoomOut.addEventListener('click', () => map.setZoom(map.getZoom() - 1));

      locate.addEventListener('click', () => {
        if (!navigator.geolocation) return;
        locate.classList.add('is-busy');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            markTouched();
            map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            map.setZoom(Math.max(map.getZoom(), 13));
            // panTo settles asynchronously; report once it does.
            google.maps.event.addListenerOnce(map, 'idle', () => {
              renderCoords();
              emit();
              locate.classList.remove('is-busy');
            });
          },
          () => locate.classList.remove('is-busy'),
          { enableHighAccuracy: true, timeout: 8000 },
        );
      });

      return map;
    })
    .catch(() => {
      // Maps is optional; show a quiet fallback instead of an empty frame.
      showUnavailable(mount);
    });
}
