/**
 * Share dialog wiring: QR code, copy-link and WhatsApp share link. No
 * visual design here — the dialog's basic show/hide comes from engine.css.
 */
import { makeQrSvg } from './lib/qr.js';
import { resolveShareUrl, buildWhatsAppUrl } from './lib/share.js';

const SHARE_MESSAGE_PREFIX = 'Lintang Tankworks wastewater & sanitation systems — portfolio concept deck:';
/** Shown instead of a QR/link when the build has no configured site URL
 * (SITE_URL unset, see build.mjs) and the page is open from file://, so
 * there is no real address to encode or copy. */
const NO_SHARE_URL_MESSAGE = 'Host the deck to share a link.';

function parseSvg(svgString) {
  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  return doc.documentElement;
}

/**
 * Render the same QR code (encoding the resolved share URL) into every
 * matching container: the share dialog's [data-qr], the title block's
 * miniature [data-qr-mini], and the contact sheet's [data-qr] (docs/
 * SHEET-KIT.md). Each gets its own parsed <svg> element — SVG nodes cannot
 * be shared between two parents.
 * @param {HTMLElement} root
 * @param {string} shareUrl
 */
function renderQr(root, shareUrl) {
  const svgString = makeQrSvg(shareUrl, { margin: 2 });
  root.querySelectorAll('[data-qr], [data-qr-mini]').forEach((container) => {
    container.replaceChildren(parseSvg(svgString));
  });
}

/** Empties every QR container instead of encoding a QR to nowhere. */
function clearQr(root) {
  root.querySelectorAll('[data-qr], [data-qr-mini]').forEach((container) => {
    container.replaceChildren();
  });
}

/** Mirrors the resolved share URL (or the no-URL message) into the share
 * dialog's visible URL line. */
function setShareUrlText(root, text) {
  const el = root.querySelector('[data-share-url-text]');
  if (el) {
    el.textContent = text;
  }
}

function copyViaTextarea(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  document.body.appendChild(textarea);
  textarea.select();
  let succeeded = false;
  try {
    succeeded = document.execCommand('copy');
  } catch {
    succeeded = false;
  }
  document.body.removeChild(textarea);
  return succeeded;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('navigator.clipboard.writeText failed, falling back', error);
    }
  }
  return copyViaTextarea(text);
}

/** With no share URL there is nothing to copy: the button is disabled
 * rather than wired to copy an empty string. */
function wireCopyLink(root, shareUrl) {
  const button = root.querySelector('[data-copy-link]');
  if (!button) {
    return;
  }
  if (!shareUrl) {
    button.disabled = true;
    return;
  }
  const defaultText = button.textContent;

  button.addEventListener('click', async () => {
    const ok = await copyToClipboard(shareUrl);
    button.textContent = ok ? 'Link copied' : 'Copy failed — copy the link manually';
    window.setTimeout(() => {
      button.textContent = defaultText;
    }, 2500);
  });
}

/** With no share URL there is nothing to send: the link is marked
 * aria-disabled and its href is removed rather than pointing at "undefined". */
function wireWhatsAppShare(root, shareUrl) {
  const link = root.querySelector('[data-share-whatsapp]');
  if (!link) {
    return;
  }
  if (!shareUrl) {
    link.setAttribute('aria-disabled', 'true');
    link.removeAttribute('href');
    return;
  }
  link.setAttribute('href', buildWhatsAppUrl('', `${SHARE_MESSAGE_PREFIX} ${shareUrl}`));
}

/**
 * @param {HTMLElement} root a `[data-deck]` element
 */
export function initShareUi(root) {
  const canonicalUrl = root.dataset.shareUrl || '';
  const shareUrl = resolveShareUrl(window.location, canonicalUrl);

  if (shareUrl) {
    renderQr(root, shareUrl);
  } else {
    clearQr(root);
  }
  setShareUrlText(root, shareUrl || NO_SHARE_URL_MESSAGE);
  wireCopyLink(root, shareUrl);
  wireWhatsAppShare(root, shareUrl);
}
