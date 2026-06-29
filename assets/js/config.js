/* global google */
// App configuration page (Weather / Clock): builds the launch URL from the
// chosen options and an optional map location. The Google Maps API is loaded
// on demand. It is an external service with no local equivalent.
import { buildQueryUrl } from './lib/query-url.js';

const GOOGLE_MAPS_API_KEY = 'AIzaSyD4xizgVnzfyTQgM15V3tvihZxQDAdUuAg';

const MAP_STYLES = [{ "featureType": "administrative", "elementType": "all", "stylers": [{ "lightness": -100 }, { "visibility": "off" }, { "saturation": "-77" }, { "color": "#000000" }] }, { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "visibility": "on" }, { "color": "#737880" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "saturation": "-70" }, { "lightness": "0" }, { "visibility": "on" }, { "color": "#e4e8ee" }] }, { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "hue": "#0066ff" }, { "saturation": "0" }, { "lightness": "0" }] }, { "featureType": "landscape", "elementType": "labels", "stylers": [{ "saturation": "-80" }, { "lightness": "-90" }, { "visibility": "off" }, { "color": "#737880" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "saturation": "-80" }, { "lightness": "-70" }, { "visibility": "off" }, { "gamma": "1" }, { "color": "#c0ccdf" }] }, { "featureType": "poi", "elementType": "labels", "stylers": [{ "color": "#737880" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "saturation": "-85" }, { "lightness": "60" }, { "visibility": "on" }, { "color": "#f5f9ff" }] }, { "featureType": "road", "elementType": "labels", "stylers": [{ "saturation": "-70" }, { "lightness": "50" }, { "visibility": "off" }, { "color": "#737880" }] }, { "featureType": "road.local", "elementType": "all", "stylers": [{ "saturation": "0" }, { "lightness": "-11" }, { "visibility": "on" }, { "color": "#f5f9ff" }] }, { "featureType": "road.local", "elementType": "labels", "stylers": [{ "color": "#61656b" }] }, { "featureType": "road.local", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "visibility": "simplified" }, { "lightness": "0" }, { "saturation": "0" }, { "color": "#f5f9ff" }] }, { "featureType": "transit", "elementType": "labels", "stylers": [{ "lightness": -100 }, { "visibility": "off" }, { "color": "#737880" }] }, { "featureType": "water", "elementType": "geometry", "stylers": [{ "saturation": "0" }, { "lightness": 100 }, { "visibility": "on" }, { "color": "#c6daf8" }] }, { "featureType": "water", "elementType": "labels", "stylers": [{ "saturation": -100 }, { "lightness": -100 }, { "visibility": "off" }, { "color": "#e4e8ee" }] }];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
    document.head.append(script);
  });
}

function initConfig() {
  const input = document.getElementById('app-form-url');
  if (!input) return;

  const url = input.dataset.url;
  const params = { lat: '', lng: '', '24h': '' };
  const updateUrl = () => {
    input.value = buildQueryUrl(url, params);
  };

  const mapEl = document.getElementById('config-map');
  if (mapEl && !('google' in window)) {
    loadScript(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`)
      .then(() => {
        const map = new google.maps.Map(mapEl, {
          zoom: 16,
          scrollwheel: false,
          center: new google.maps.LatLng(51.5287718, -0.2417001),
          styles: MAP_STYLES,
        });
        google.maps.event.addListener(map, 'dragend', () => {
          const center = map.getCenter();
          params.lat = center.lat().toFixed(2);
          params.lng = center.lng().toFixed(2);
          updateUrl();
        });
      })
      .catch(() => { /* Maps is optional; the URL still works without a location. */ });
  }

  const clockFormat = document.getElementById('clockformat-select');
  clockFormat?.addEventListener('change', () => {
    params['24h'] = clockFormat.value;
    updateUrl();
  });
}

initConfig();
