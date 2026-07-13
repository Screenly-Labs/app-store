// A self-contained date / time / datetime picker themed to the store's design
// system. Native <input type="datetime-local"> gives no usable time popup on
// several browsers (the calendar dropdown is date-only, time is a bare inline
// spinner), so manifest date/time fields render this instead.
//
// createDateTimePicker({ mode, id, initial, onChange }) returns one element: a
// field-styled trigger plus an inline disclosure panel (a calendar and/or a
// segmented HH:MM:SS clock). It emits a plain string via onChange, matching what
// the native control would have produced, so the launch URL is unchanged:
//   date      -> "YYYY-MM-DD"
//   time      -> "HH:MM:SS"
//   datetime  -> "YYYY-MM-DDTHH:MM:SS"
// An empty selection emits "" (so an untouched optional field stays out of the
// URL). All times are wall-clock, exactly like datetime-local — any time-zone
// interpretation is the app's job (e.g. Timer's separate `tz` field).

const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']; // week starts Monday

// Monday-based weekday index (0 = Monday … 6 = Sunday).
const isoDay = (d) => (d.getDay() + 6) % 7;
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Full, literal icon class strings — Tailwind only extracts complete class names
// from source, so these can't be built by interpolation (`icon-[lucide--${x}]`).
const ICONS = {
  'chevron-left': 'icon-[lucide--chevron-left]',
  'chevron-right': 'icon-[lucide--chevron-right]',
  'chevron-up': 'icon-[lucide--chevron-up]',
  'chevron-down': 'icon-[lucide--chevron-down]',
  calendar: 'icon-[lucide--calendar]',
  clock: 'icon-[lucide--clock]',
  'calendar-clock': 'icon-[lucide--calendar-clock]',
  crosshair: 'icon-[lucide--crosshair]',
};
function icon(name) {
  const s = document.createElement('span');
  s.className = `${ICONS[name]} size-4`;
  s.setAttribute('aria-hidden', 'true');
  return s;
}

// Parse a stored value back into { date, time } parts for re-opening a field
// that already has a default. Tolerant: a bad string just yields no selection.
function parseInitial(mode, raw) {
  const out = { date: null, h: 0, m: 0, s: 0, timeTouched: false };
  if (!raw || typeof raw !== 'string') return out;
  const [datePart, timePart] = raw.includes('T') ? raw.split('T') : [mode === 'time' ? '' : raw, mode === 'time' ? raw : ''];
  if (datePart && mode !== 'time') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart.trim());
    if (m) out.date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  if (timePart && mode !== 'date') {
    const t = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(timePart.trim());
    if (t) { out.h = +t[1]; out.m = +t[2]; out.s = +(t[3] || 0); out.timeTouched = true; }
  }
  return out;
}

export function createDateTimePicker({ mode = 'datetime', id, initial, onChange } = {}) {
  const wantsDate = mode === 'date' || mode === 'datetime';
  const wantsTime = mode === 'time' || mode === 'datetime';
  const state = parseInitial(mode, initial);
  let cursor = new Date(state.date || new Date()); // calendar view + keyboard focus
  cursor.setHours(0, 0, 0, 0);
  let open = false;

  const emit = () => onChange && onChange(compose());
  const timeStr = () => `${pad(state.h)}:${pad(state.m)}:${pad(state.s)}`;
  const dateStr = () => state.date
    ? `${state.date.getFullYear()}-${pad(state.date.getMonth() + 1)}-${pad(state.date.getDate())}` : '';
  function compose() {
    if (mode === 'date') return dateStr();
    if (mode === 'time') return state.timeTouched ? timeStr() : '';
    return state.date ? `${dateStr()}T${timeStr()}` : '';
  }
  function label() {
    const d = state.date ? `${state.date.getDate()} ${MON[state.date.getMonth()]} ${state.date.getFullYear()}` : '';
    if (mode === 'date') return d;
    const t = state.timeTouched || mode === 'datetime' ? timeStr() : '';
    if (mode === 'time') return t;
    return d ? `${d} · ${t}` : '';
  }

  // ---- structure -----------------------------------------------------------
  const wrap = document.createElement('div');
  wrap.className = 'dtp mt-2';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = id;
  trigger.className = 'dtp__trigger field';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  const triggerText = document.createElement('span');
  triggerText.className = 'dtp__value';
  const glyphName = mode === 'time' ? 'clock' : mode === 'date' ? 'calendar' : 'calendar-clock';
  trigger.append(triggerText, icon(glyphName, 4));

  const panel = document.createElement('div');
  panel.className = 'dtp__panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', mode === 'time' ? 'Choose a time' : mode === 'date' ? 'Choose a date' : 'Choose date and time');
  panel.hidden = true;

  // ---- calendar ------------------------------------------------------------
  let grid; // re-rendered on navigation
  const monthLabel = document.createElement('div');
  if (wantsDate) {
    const cal = document.createElement('div');
    cal.className = 'dtp__cal';

    const head = document.createElement('div');
    head.className = 'dtp__calhead';
    const prev = navBtn('chevron-left', 'Previous month', () => shiftMonth(-1));
    const next = navBtn('chevron-right', 'Next month', () => shiftMonth(1));
    monthLabel.className = 'dtp__month';
    monthLabel.setAttribute('aria-live', 'polite');
    head.append(prev, monthLabel, next);

    const wd = document.createElement('div');
    wd.className = 'dtp__weekdays';
    WEEKDAYS.forEach((w) => { const c = document.createElement('span'); c.textContent = w; wd.appendChild(c); });

    grid = document.createElement('div');
    grid.className = 'dtp__grid';
    grid.setAttribute('role', 'grid');
    grid.addEventListener('keydown', onGridKey);

    cal.append(head, wd, grid);
    panel.appendChild(cal);
  }

  // ---- time ----------------------------------------------------------------
  const segs = {};
  if (wantsTime) {
    if (wantsDate) panel.appendChild(divider());
    const timeWrap = document.createElement('div');
    timeWrap.className = 'dtp__time';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'dtp__eyebrow';
    eyebrow.textContent = 'Time';
    const clock = document.createElement('div');
    clock.className = 'dtp__clock';
    clock.append(
      segment('h', 23, 'Hours'),
      colon(), segment('m', 59, 'Minutes'),
      colon(), segment('s', 59, 'Seconds'),
    );
    timeWrap.append(eyebrow, clock);
    panel.appendChild(timeWrap);
  }

  // ---- footer --------------------------------------------------------------
  const footer = document.createElement('div');
  footer.className = 'dtp__footer';
  const nowBtn = document.createElement('button');
  nowBtn.type = 'button';
  nowBtn.className = 'dtp__now';
  nowBtn.append(icon('crosshair', 4), document.createTextNode('Now'));
  nowBtn.addEventListener('click', () => {
    const n = new Date();
    if (wantsDate) { state.date = new Date(n.getFullYear(), n.getMonth(), n.getDate()); cursor = new Date(state.date); }
    if (wantsTime) { state.h = n.getHours(); state.m = n.getMinutes(); state.s = n.getSeconds(); state.timeTouched = true; }
    refresh(); if (wantsDate && open) renderGrid(); emit();
  });
  const spacer = document.createElement('span');
  spacer.className = 'dtp__spacer';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'dtp__clear';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => {
    state.date = null; state.h = state.m = state.s = 0; state.timeTouched = false;
    refresh(); if (wantsDate && open) renderGrid(); emit();
  });
  const doneBtn = document.createElement('button');
  doneBtn.type = 'button';
  doneBtn.className = 'dtp__done';
  doneBtn.textContent = 'Done';
  doneBtn.addEventListener('click', () => close(true));
  footer.append(nowBtn, spacer, clearBtn, doneBtn);
  panel.appendChild(footer);

  wrap.append(trigger, panel);

  // ---- behaviour -----------------------------------------------------------
  trigger.addEventListener('click', () => (open ? close(true) : openPanel()));
  // Close on an outside press. Use pointerdown, not click: selecting a day
  // rebuilds the grid, so by the time a click bubbles here its target is already
  // detached and wrap.contains() would wrongly read as "outside".
  document.addEventListener('pointerdown', (e) => { if (open && !wrap.contains(e.target)) close(false); });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(true); } });

  function openPanel() {
    open = true;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    if (wantsDate) { renderGrid(); requestAnimationFrame(() => focusCursor()); }
  }
  function close(returnFocus) {
    open = false;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }
  function shiftMonth(delta) {
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + delta);
    renderGrid();
  }
  // Update the trigger label and time segments. Callers that change the date or
  // month re-render the grid themselves, so this never rebuilds it (rebuilding
  // would detach cells mid-interaction and thrash on every time step).
  function refresh() {
    const text = label();
    triggerText.textContent = text || (mode === 'time' ? 'Select a time' : mode === 'date' ? 'Select a date' : 'Select date & time');
    triggerText.classList.toggle('dtp__value--empty', !text);
    if (wantsTime) Object.entries(segs).forEach(([k, el]) => { el.value = pad(state[k]); });
  }

  function renderGrid() {
    monthLabel.textContent = `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    grid.textContent = '';
    const today = new Date();
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - isoDay(first)); // back up to the Monday of the first row
    for (let i = 0; i < 42; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'dtp__day';
      cell.textContent = String(day.getDate());
      cell.setAttribute('role', 'gridcell');
      const outside = day.getMonth() !== cursor.getMonth();
      if (outside) cell.classList.add('is-outside');
      if (sameDay(day, today)) cell.classList.add('is-today');
      if (sameDay(day, state.date)) { cell.classList.add('is-selected'); cell.setAttribute('aria-selected', 'true'); }
      cell.tabIndex = sameDay(day, cursor) ? 0 : -1;
      cell.addEventListener('click', () => selectDay(day));
      grid.appendChild(cell);
    }
  }
  function selectDay(day) {
    state.date = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    cursor = new Date(state.date);
    if (mode === 'date') { refresh(); emit(); close(true); return; }
    renderGrid(); refresh(); emit();
  }
  function focusCursor() {
    const el = grid && grid.querySelector('[tabindex="0"]');
    if (el) el.focus();
  }
  function onGridKey(e) {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in moves) {
      e.preventDefault();
      cursor.setDate(cursor.getDate() + moves[e.key]);
      renderGrid(); focusCursor();
    } else if (e.key === 'PageUp') { e.preventDefault(); shiftMonth(-1); focusCursor(); }
    else if (e.key === 'PageDown') { e.preventDefault(); shiftMonth(1); focusCursor(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDay(cursor); }
  }

  // Segmented HH / MM / SS control: a stacked up-chevron, value, down-chevron.
  function segment(key, max, aria) {
    const col = document.createElement('div');
    col.className = 'dtp__seg';
    const up = navBtn('chevron-up', `Increase ${aria.toLowerCase()}`, () => step(key, max, 1));
    const val = document.createElement('input');
    val.className = 'dtp__num';
    val.value = pad(state[key]);
    val.setAttribute('inputmode', 'numeric');
    val.setAttribute('aria-label', aria);
    val.maxLength = 2;
    val.addEventListener('focus', () => val.select());
    val.addEventListener('input', () => {
      const digits = val.value.replace(/\D/g, '').slice(0, 2);
      let n = digits === '' ? 0 : Number(digits);
      if (n > max) n = max;
      state[key] = n; state.timeTouched = true; emit();
    });
    val.addEventListener('blur', () => { val.value = pad(state[key]); });
    val.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); step(key, max, 1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); step(key, max, -1); }
    });
    const down = navBtn('chevron-down', `Decrease ${aria.toLowerCase()}`, () => step(key, max, -1));
    segs[key] = val;
    col.append(up, val, down);
    return col;
  }
  function step(key, max, delta) {
    state[key] = (state[key] + delta + (max + 1)) % (max + 1);
    state.timeTouched = true;
    segs[key].value = pad(state[key]);
    refresh(); emit();
  }

  refresh();
  return wrap;
}

function navBtn(iconName, aria, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'dtp__nav';
  b.setAttribute('aria-label', aria);
  b.appendChild(icon(iconName, 4));
  b.addEventListener('click', onClick);
  return b;
}
function colon() {
  const c = document.createElement('span');
  c.className = 'dtp__colon';
  c.textContent = ':';
  c.setAttribute('aria-hidden', 'true');
  return c;
}
function divider() {
  const d = document.createElement('div');
  d.className = 'dtp__divider';
  return d;
}
