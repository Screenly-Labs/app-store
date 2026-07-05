// Generic, manifest-driven settings form.
//
// The detail page embeds the app's signage-app manifest as JSON (see the
// app-config.html partial). Here we read its `settings` JSON Schema and render
// the form controls — one per property, in manifest order — then rebuild the
// launch URL into #app-form-url from `launch.template` whenever a value changes.
// No app re-implements its own form: every manifest-driven app shares this code.
//
// Supported `x-widget`s (falling back to the JSON Schema type): text, url,
// number, select (enum), toggle (boolean), timezone, and location-map (a
// {lat,lng} object). Unknown widgets degrade to a text input.

import { buildLaunchUrl } from './lib/expand-template.js';
import { initLocationMap } from './lib/location-map.js';

// Which control to render for a settings property.
function widgetFor(schema) {
  if (schema['x-widget']) return schema['x-widget'];
  if (Array.isArray(schema.enum)) return 'select';
  if (schema.type === 'boolean') return 'toggle';
  if (schema.type === 'number' || schema.type === 'integer') return 'number';
  // Only a {lat,lng} object is a location map; other objects/arrays have no
  // generic control, so mark them unsupported (skipped) rather than mis-render.
  if (schema.type === 'object') {
    const props = schema.properties || {};
    return props.lat && props.lng ? 'location-map' : 'unsupported';
  }
  if (schema.type === 'array') return 'unsupported';
  return 'text';
}

// A labelled wrapper shared by every control. When the control is a real form
// element we bind a <label for>; custom controls (e.g. the location map) have no
// focusable input, so we use a plain styled caption and wire aria-labelledby.
function fieldRow(schema, key, control, { labelFor } = {}) {
  const row = document.createElement('div');
  row.className = 'cfg-field';

  const captionText = schema.title || key;
  let caption;
  if (labelFor) {
    caption = document.createElement('label');
    caption.htmlFor = labelFor;
  } else {
    caption = document.createElement('span');
    const captionId = `cfg-lbl-${key}`;
    caption.id = captionId;
    control.setAttribute('role', 'group');
    control.setAttribute('aria-labelledby', captionId);
  }
  caption.className = 'eyebrow block';
  caption.textContent = captionText;
  row.append(caption, control);

  if (schema.description) {
    const help = document.createElement('p');
    help.className = 'cfg-help';
    help.textContent = schema.description;
    row.appendChild(help);
  }
  return row;
}

// One shared <datalist> of IANA time zones for all timezone fields (avoids
// duplicate ids), created lazily when the browser can enumerate zones.
function timezoneList(host) {
  const existing = host.querySelector('#cfg-tz-list');
  if (existing) return existing;
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  if (!zones.length) return null;
  const list = document.createElement('datalist');
  list.id = 'cfg-tz-list';
  for (const zone of zones) {
    const opt = document.createElement('option');
    opt.value = zone;
    list.appendChild(opt);
  }
  host.appendChild(list);
  return list;
}

// Build the control for one property; wire it to `set(key, value)`.
function renderField(key, schema, widget, set, host) {
  const id = `cfg-${key}`;

  // Settings with no generic control — arrays (e.g. World Clock's repeated
  // `{?tz*}`, which needs a bespoke add/remove-row UI) and non-location objects.
  // Skip them rather than emit a scalar text input with the wrong value type.
  // (No manifest-driven app currently uses one; World Clock has its own form.)
  if (widget === 'unsupported') return null;

  if (widget === 'select') {
    const select = document.createElement('select');
    select.className = 'field mt-2';
    select.id = id;
    const labels = schema['x-enumLabels'] || [];
    const options = schema.enum || [];
    // <select> values read back as strings; map the chosen option back to its
    // original enum value so a typed (number/boolean) default still compares
    // equal and isn't emitted into the URL.
    const typed = (raw) => options.find((v) => String(v) === raw) ?? raw;
    options.forEach((value, i) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = labels[i] !== undefined ? labels[i] : (value === '' ? 'Default' : String(value));
      if (String(value) === String(schema.default ?? '')) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => set(key, typed(select.value)));
    return fieldRow(schema, key, select, { labelFor: id });
  }

  if (widget === 'toggle') {
    const wrap = document.createElement('label');
    wrap.className = 'cfg-toggle mt-2';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = id;
    box.checked = schema.default === true;
    const text = document.createElement('span');
    text.textContent = schema.title || key;
    wrap.append(box, text);
    box.addEventListener('change', () => set(key, box.checked));
    // The toggle carries its own inline label, so don't add a second one.
    const row = document.createElement('div');
    row.className = 'cfg-field';
    row.appendChild(wrap);
    if (schema.description) {
      const help = document.createElement('p');
      help.className = 'cfg-help';
      help.textContent = schema.description;
      row.appendChild(help);
    }
    return row;
  }

  if (widget === 'location-map') {
    const mount = document.createElement('div');
    mount.className = 'mt-2';
    // Seed the map from a schema default (initLocationMap reads data-lat/lng),
    // so the control opens on the app's default rather than the generic centre.
    const def = schema.default;
    if (def && def.lat !== undefined && def.lng !== undefined) {
      mount.dataset.lat = def.lat;
      mount.dataset.lng = def.lng;
    }
    initLocationMap(mount, { onChange: ({ lat, lng }) => set(key, { lat, lng }) });
    return fieldRow(schema, key, mount);
  }

  // Scalar text-like inputs: text, url, number, timezone.
  const input = document.createElement('input');
  input.className = 'field mt-2';
  input.id = id;
  input.value = schema.default ?? '';
  if (widget === 'number') {
    input.type = 'number';
    if (schema.minimum !== undefined) input.min = schema.minimum;
    if (schema.maximum !== undefined) input.max = schema.maximum;
  } else if (widget === 'url') {
    input.type = 'url';
  } else {
    input.type = 'text';
  }
  if (widget === 'timezone') {
    const list = timezoneList(host);
    if (list) {
      input.setAttribute('list', list.id);
      input.autocomplete = 'off';
    }
    input.placeholder = 'e.g. Europe/London';
  }
  // Number inputs read back as strings; store a Number so a numeric default
  // compares equal and unchanged numeric defaults don't leak into the URL.
  const read = widget === 'number' ? () => (input.value === '' ? '' : Number(input.value)) : () => input.value;
  input.addEventListener('input', () => set(key, read()));
  return fieldRow(schema, key, input, { labelFor: id });
}

export function initManifestConfig() {
  const host = document.querySelector('[data-manifest-config]');
  const urlInput = document.getElementById('app-form-url');
  if (!host || !urlInput) return;

  const script = host.querySelector('script[data-manifest]');
  if (!script) return;
  let manifest;
  try {
    manifest = JSON.parse(script.textContent);
  } catch {
    return;
  }

  const props = manifest.settings?.properties || {};
  const launch = manifest.launch || {};
  const baseUrl = launch.baseUrl || urlInput.dataset.url || '';
  const template = launch.template || '';

  const fields = host.querySelector('[data-config-fields]');
  const values = {};
  const defaults = {};
  const update = () => {
    urlInput.value = buildLaunchUrl(baseUrl, template, values, defaults);
  };
  const set = (key, value) => {
    values[key] = value;
    update();
  };

  let currentGroup = null;
  for (const [key, schema] of Object.entries(props)) {
    defaults[key] = schema.default;
    values[key] = schema.default;

    const group = schema['x-group'] || null;
    if (group && group !== currentGroup) {
      const heading = document.createElement('h3');
      heading.className = 'cfg-group';
      heading.textContent = group;
      fields.appendChild(heading);
    }
    currentGroup = group;

    const field = renderField(key, schema, widgetFor(schema), set, host);
    if (field) fields.appendChild(field);
  }

  update();
}
