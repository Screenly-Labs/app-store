// World Clock configuration page: a board of cities the viewer assembles, plus
// a global language, clock format and seconds toggle. Builds the launch URL
// from the chosen cities (one repeated `tz=` per row) and the global options.
// The pure URL logic lives in ./lib/world-clock-url.js and is unit tested.
import { buildWorldClockUrl } from './lib/world-clock-url.js';

// A curated set of major cities grouped by region. Values are IANA timezone
// names; labels are the city names shown in the picker (and, when no custom
// label is typed, what the app derives on screen anyway).
const CITY_GROUPS = [
  {
    region: 'Americas',
    cities: [
      ['Pacific/Honolulu', 'Honolulu'],
      ['America/Anchorage', 'Anchorage'],
      ['America/Los_Angeles', 'Los Angeles'],
      ['America/Denver', 'Denver'],
      ['America/Chicago', 'Chicago'],
      ['America/New_York', 'New York'],
      ['America/Toronto', 'Toronto'],
      ['America/Mexico_City', 'Mexico City'],
      ['America/Bogota', 'Bogotá'],
      ['America/Sao_Paulo', 'São Paulo'],
      ['America/Argentina/Buenos_Aires', 'Buenos Aires'],
    ],
  },
  {
    region: 'Europe & Africa',
    cities: [
      ['Europe/London', 'London'],
      ['Europe/Dublin', 'Dublin'],
      ['Europe/Lisbon', 'Lisbon'],
      ['Europe/Madrid', 'Madrid'],
      ['Europe/Paris', 'Paris'],
      ['Europe/Berlin', 'Berlin'],
      ['Europe/Rome', 'Rome'],
      ['Europe/Amsterdam', 'Amsterdam'],
      ['Europe/Zurich', 'Zurich'],
      ['Europe/Stockholm', 'Stockholm'],
      ['Europe/Athens', 'Athens'],
      ['Europe/Istanbul', 'Istanbul'],
      ['Europe/Moscow', 'Moscow'],
      ['Africa/Lagos', 'Lagos'],
      ['Africa/Cairo', 'Cairo'],
      ['Africa/Nairobi', 'Nairobi'],
      ['Africa/Johannesburg', 'Johannesburg'],
    ],
  },
  {
    region: 'Asia & Middle East',
    cities: [
      ['Asia/Dubai', 'Dubai'],
      ['Asia/Karachi', 'Karachi'],
      ['Asia/Kolkata', 'Mumbai'],
      ['Asia/Dhaka', 'Dhaka'],
      ['Asia/Bangkok', 'Bangkok'],
      ['Asia/Singapore', 'Singapore'],
      ['Asia/Hong_Kong', 'Hong Kong'],
      ['Asia/Shanghai', 'Shanghai'],
      ['Asia/Seoul', 'Seoul'],
      ['Asia/Tokyo', 'Tokyo'],
    ],
  },
  {
    region: 'Oceania',
    cities: [
      ['Australia/Perth', 'Perth'],
      ['Australia/Sydney', 'Sydney'],
      ['Pacific/Auckland', 'Auckland'],
    ],
  },
  {
    region: 'Universal',
    cities: [['UTC', 'UTC']],
  },
];

// Cities the board starts with, so the picker is never empty on first open.
const DEFAULT_ZONES = ['America/New_York', 'Europe/London', 'Asia/Tokyo'];

// Cap the board so the clocks stay large enough to read across resolutions.
const MAX_CLOCKS = 8;

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// The shared <optgroup>/<option> markup for one timezone <select>, built once
// and reused for every city row.
const OPTIONS_MARKUP = CITY_GROUPS.map(
  ({ region, cities }) =>
    `<optgroup label="${escapeHtml(region)}">${cities
      .map(([tz, label]) => `<option value="${escapeHtml(tz)}">${escapeHtml(label)}</option>`)
      .join('')}</optgroup>`,
).join('');

export function initWorldClockConfig() {
  const input = document.getElementById('app-form-url');
  const root = document.querySelector('[data-world-clock-config]');
  if (!input || !root) return;

  const base = input.dataset.url;
  const clocksEl = root.querySelector('[data-wc-clocks]');
  const addBtn = root.querySelector('[data-wc-add]');
  const titleEl = root.querySelector('[data-wc-title]');
  const localeEl = root.querySelector('[data-wc-locale]');
  const formatEl = root.querySelector('[data-wc-format]');
  const secondsEl = root.querySelector('[data-wc-seconds]');
  if (!clocksEl) return;

  // Shown in place of the rows when the board is emptied, so it is clear the
  // link still works (the app falls back to its own default world view).
  const emptyHint = document.createElement('p');
  emptyHint.className = 'wc-empty';
  emptyHint.textContent = 'No cities yet. The link will show a default world view.';

  // Shown once the board is full, so disabling "Add city" doesn't look broken.
  const limitHint = document.createElement('p');
  limitHint.className = 'wc-empty';
  limitHint.textContent = `That's the most that fits: up to ${MAX_CLOCKS} cities.`;

  const rowCount = () => clocksEl.querySelectorAll('[data-wc-row]').length;

  const readClocks = () =>
    [...clocksEl.querySelectorAll('[data-wc-row]')].map((row) => ({
      tz: row.querySelector('[data-wc-tz]').value,
      label: row.querySelector('[data-wc-label]').value,
    }));

  const update = () => {
    const count = rowCount();
    if (count) emptyHint.remove();
    else clocksEl.after(emptyHint);

    if (addBtn) {
      const atLimit = count >= MAX_CLOCKS;
      addBtn.disabled = atLimit;
      if (atLimit) addBtn.after(limitHint);
      else limitHint.remove();
    }

    input.value = buildWorldClockUrl(base, {
      clocks: readClocks(),
      locale: localeEl?.value ?? '',
      format: formatEl?.value ?? '',
      seconds: Boolean(secondsEl?.checked),
      title: titleEl?.value ?? '',
    });
  };

  const addRow = (tz = '') => {
    const row = document.createElement('div');
    row.className = 'wc-row';
    row.dataset.wcRow = '';
    row.innerHTML = `
      <select class="field wc-row__field" data-wc-tz aria-label="Time zone">${OPTIONS_MARKUP}</select>
      <input class="field wc-row__field" type="text" data-wc-label placeholder="Label (optional)" aria-label="City label">
      <button type="button" class="loc-map__btn" data-wc-remove aria-label="Remove city"><span class="icon-[lucide--x] size-4" aria-hidden="true"></span></button>
    `;
    if (tz) row.querySelector('[data-wc-tz]').value = tz;
    clocksEl.append(row);
    return row;
  };

  // One delegated listener covers edits in any current or future row.
  clocksEl.addEventListener('input', update);
  clocksEl.addEventListener('change', update);
  clocksEl.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-wc-remove]');
    if (!remove) return;
    remove.closest('[data-wc-row]').remove();
    update();
  });

  addBtn?.addEventListener('click', () => {
    if (rowCount() >= MAX_CLOCKS) return;
    const row = addRow();
    row.querySelector('[data-wc-tz]').focus();
    update();
  });
  titleEl?.addEventListener('input', update);
  localeEl?.addEventListener('change', update);
  formatEl?.addEventListener('change', update);
  secondsEl?.addEventListener('change', update);

  for (const tz of DEFAULT_ZONES) addRow(tz);
  update();
}
