import ClipboardJS from 'clipboard';

// Copy an app's URL to the clipboard and give the button quick feedback.
export function initClipboard() {
  const buttons = document.querySelectorAll('.btn-clipboard');
  if (!buttons.length) return;

  for (const button of buttons) {
    button.addEventListener('click', (event) => event.preventDefault());
  }

  const clipboard = new ClipboardJS('.btn-clipboard');
  clipboard.on('success', (event) => {
    const button = event.trigger;
    const label = button.querySelector('[data-copy-label]');
    if (label && !button.dataset.copied) {
      const original = label.textContent;
      button.dataset.copied = '1';
      label.textContent = 'Copied';
      button.classList.add('is-copied');
      setTimeout(() => {
        label.textContent = original;
        button.classList.remove('is-copied');
        delete button.dataset.copied;
      }, 2000);
    }
    event.clearSelection();
  });
}
