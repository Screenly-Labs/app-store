// Small vanilla UI behaviours (no jQuery, no layout library).

const slugify = (text) =>
  text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// Filterable app grid (plain CSS grid + show/hide). The filter bar is built
// from the categories declared on each card; it is omitted when there is
// nothing meaningful to filter.
export function initAppGrid() {
  const grid = document.querySelector('[data-app-grid]');
  if (!grid) return;

  const cards = [...grid.children];
  const categories = new Map();
  for (const card of cards) {
    const slugs = [];
    for (const raw of (card.dataset.categories ?? '').split(',')) {
      const label = raw.trim();
      if (!label) continue;
      const slug = slugify(label);
      slugs.push(slug);
      if (!categories.has(slug)) categories.set(slug, label);
    }
    card.dataset.slugs = slugs.join(' ');
  }

  const bar = document.querySelector('[data-app-filter]');
  if (!bar || categories.size < 2) return;

  const makeButton = (filter, label, active) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.filter = filter;
    button.classList.toggle('is-active', active);
    return button;
  };

  bar.append(makeButton('*', 'All', true));
  for (const [slug, label] of [...categories.entries()].sort((a, b) => a[1].localeCompare(b[1]))) {
    bar.append(makeButton(slug, label, false));
  }

  bar.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    for (const sibling of bar.children) sibling.classList.toggle('is-active', sibling === button);
    const filter = button.dataset.filter;
    for (const card of cards) {
      card.hidden = filter !== '*' && !card.dataset.slugs.split(' ').includes(filter);
    }
  });
}

// Modals: move each to a body-level container (so fixed positioning is never
// trapped by an ancestor) and wire up open/close.
export function initModals() {
  const instances = document.querySelectorAll('.modal-instance');
  if (!instances.length) return;

  const root = document.createElement('div');
  document.body.append(root);

  for (const instance of instances) {
    const modal = instance.querySelector('.modal-container');
    const trigger = instance.querySelector('.modal-trigger');
    if (!modal || !trigger) continue;

    root.append(modal);
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      modal.classList.add('modal-active');
    });
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.remove('modal-active');
    });
  }

  const closeActive = () => {
    for (const modal of root.querySelectorAll('.modal-active')) modal.classList.remove('modal-active');
  };
  root.addEventListener('click', (event) => {
    if (event.target.closest('.modal-close')) closeActive();
  });
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') closeActive();
  });
}

// Toggle a class once a scroll position is passed, e.g.
// data-scroll-class="80vh:is-visible" on the back-to-top button.
export function initScrollClasses() {
  const rules = [];
  for (const el of document.querySelectorAll('[data-scroll-class]')) {
    for (const rule of el.dataset.scrollClass.split(';')) {
      const [point, cls] = rule.split(':').map((part) => part.trim());
      if (!cls) continue;
      const offset = point.endsWith('vh')
        ? () => window.innerHeight * (parseFloat(point) / 100)
        : () => parseFloat(point);
      rules.push({ el, offset, cls });
    }
  }
  if (!rules.length) return;

  const update = () => {
    const y = window.scrollY;
    for (const { el, offset, cls } of rules) el.classList.toggle(cls, y >= offset());
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}
