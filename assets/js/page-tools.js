// Page tools (layouts/partials/agent-tools.html): copy the page's Markdown or
// its link, and the More menu. The Markdown is a static index.md next to the
// page, fetched when the button is pressed.

// Copy a string, or a promise of one. A ClipboardItem built from a promise keeps
// the click's user activation in Safari while the Markdown is still loading.
async function copy(text) {
  if (typeof text !== 'string' && 'ClipboardItem' in window && navigator.clipboard.write) {
    const blob = text.then((t) => new Blob([t], { type: 'text/plain' }));
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
    return;
  }
  await navigator.clipboard.writeText(await text);
}

function confirm(button, ok, status) {
  const message = ok ? button.dataset.done || 'Copied' : 'Could not copy';
  if (status) status.textContent = message;
  const label = button.querySelector('[data-copy-label]');
  button.classList.add(ok ? 'is-copied' : 'is-failed');
  if (label && !button.dataset.copied) {
    const original = label.textContent;
    button.dataset.copied = '1';
    label.textContent = ok ? 'Copied' : 'Could not copy';
    setTimeout(() => {
      label.textContent = original;
      delete button.dataset.copied;
    }, 2000);
  }
  setTimeout(() => button.classList.remove('is-copied', 'is-failed'), 2000);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.text();
}

export function initPageTools() {
  const tools = document.querySelectorAll('.agent-tools');
  if (!tools.length) return;
  const status = document.querySelector('[data-copy-status]');
  const menus = document.querySelectorAll('details.more-menu');

  document.addEventListener('click', async (event) => {
    // Close an open menu on a click anywhere outside it.
    for (const menu of menus) {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    }

    const button = event.target.closest('.agent-tools [data-copy-url], .agent-tools [data-copy-text]');
    if (!button) return;
    const text = button.dataset.copyText ?? fetchText(button.dataset.copyUrl);
    try {
      await copy(text);
      confirm(button, true, status);
    } catch {
      confirm(button, false, status);
    }
    button.closest('details')?.removeAttribute('open');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const menu of menus) {
      if (!menu.open) continue;
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
}
