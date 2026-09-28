function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestFullscreenCompat(element) {
  if (typeof element.requestFullscreen === 'function') {
    return element.requestFullscreen();
  }
  if (typeof element.webkitRequestFullscreen === 'function') {
    return element.webkitRequestFullscreen();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

function exitFullscreenCompat() {
  if (typeof document.exitFullscreen === 'function') {
    return document.exitFullscreen();
  }
  if (typeof document.webkitExitFullscreen === 'function') {
    return document.webkitExitFullscreen();
  }
  return Promise.reject(new Error('Fullscreen API not supported'));
}

function isFullscreenSupported(root) {
  return Boolean(root.requestFullscreen || root.webkitRequestFullscreen);
}

/**
 * Mark the root data-fullscreen="unsupported" (engine.css hides the
 * fullscreen button) when neither the standard nor webkit API exists.
 * @param {HTMLElement} root
 */
export function initFullscreenSupport(root) {
  if (!isFullscreenSupported(root)) {
    root.dataset.fullscreen = 'unsupported';
  }
}

/**
 * Enter fullscreen on `root`, or exit if already in fullscreen. Rejections
 * are logged, never surfaced via alert().
 * @param {HTMLElement} root
 */
export function toggleFullscreen(root) {
  if (getFullscreenElement()) {
    exitFullscreenCompat().catch((error) => {
      console.warn('Exit fullscreen failed', error);
    });
    return;
  }
  requestFullscreenCompat(root).catch((error) => {
    console.warn('Request fullscreen failed', error);
  });
}

/**
 * Keep the fullscreen button's aria-pressed in sync with actual state.
 * @param {HTMLElement} root
 * @returns {() => void} teardown
 */
export function wireFullscreenButton(root) {
  const button = root.querySelector('[data-action="fullscreen"]');
  if (!button) {
    return () => {};
  }

  function syncPressed() {
    button.setAttribute('aria-pressed', getFullscreenElement() === root ? 'true' : 'false');
  }

  document.addEventListener('fullscreenchange', syncPressed);
  document.addEventListener('webkitfullscreenchange', syncPressed);
  syncPressed();

  return () => {
    document.removeEventListener('fullscreenchange', syncPressed);
    document.removeEventListener('webkitfullscreenchange', syncPressed);
  };
}
