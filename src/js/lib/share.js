/**
 * Sharing helpers: phone normalisation, WhatsApp deep links, canonical share
 * URL resolution and enquiry message copy. No DOM access.
 */

/**
 * Strip everything but digits from a phone number, e.g.
 * '+60 3 1234 5678' -> '60312345678'. An empty or missing phone normalises
 * to an empty string (see buildWhatsAppUrl).
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }
  return phone.replace(/\D+/g, '');
}

/**
 * Build a wa.me deep link for a phone number, with an optional prefilled
 * message. This portfolio deck has no real company number to message: an
 * empty (or missing) `phone` normalises to no digits at all, so the link
 * becomes `https://wa.me/?text=...` — a recipientless wa.me link, which
 * WhatsApp opens by letting the person pick who to send it to.
 * @param {string} phone
 * @param {string} [text]
 * @returns {string}
 */
export function buildWhatsAppUrl(phone, text) {
  const digits = normalizePhone(phone);
  const base = `https://wa.me/${digits}`;
  if (!text) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Resolve the URL to encode for sharing. On http/https origins this is the
 * live page URL; file:// (and any other scheme) has no shareable URL, so the
 * deck's canonical URL is used instead. `canonicalUrl` is empty when the
 * build has no configured site (SITE_URL unset, see build.mjs), in which
 * case this returns an empty string too — callers (initShareUi) show a
 * "host the deck to share a link" message instead of a QR to nowhere.
 * @param {{protocol: string, origin: string, pathname: string}} location
 * @param {string} canonicalUrl
 * @returns {string}
 */
export function resolveShareUrl(location, canonicalUrl) {
  const protocol = location?.protocol;
  if (protocol === 'http:' || protocol === 'https:') {
    return `${location.origin}${location.pathname}`;
  }
  return canonicalUrl;
}

const GENERAL_ENQUIRY_TEXT =
  "Hello Lintang Tankworks, I'd like to enquire about your wastewater & sanitation range " +
  '(PE Bio-Filter, FRP Bio-Filter and LT septic / sewage treatment systems). ' +
  'Please send more information.';

/**
 * Build the plain-English WhatsApp enquiry message. With a selection, names
 * the model code, PE, series and any ticked site conditions, and asks for
 * the specification sheet and CAD drawing. Without one, sends a general
 * enquiry about the range.
 * @param {{modelCode: string, pe: number, seriesName: string, conditions?: string[]}|null|undefined} selection
 * @returns {string}
 */
export function buildEnquiryText(selection) {
  if (!selection) {
    return GENERAL_ENQUIRY_TEXT;
  }

  const { modelCode, pe, seriesName, conditions = [] } = selection;
  const parts = [
    `Hello Lintang Tankworks, I'd like to enquire about the ${modelCode} (${seriesName}, rated ${pe} PE).`,
  ];

  if (conditions.length > 0) {
    parts.push(`Site conditions: ${conditions.join(', ')}.`);
  }

  parts.push('Please send the specification sheet and CAD drawing.');

  return parts.join(' ');
}

/** Sheet 12's primary action before the visitor has picked a model. */
export const GENERAL_ENQUIRY_LABEL = 'Send a general enquiry';

/**
 * The value line of the contact sheet's enquiry button: the chosen model and
 * PE, written as on sheet 10 ("LF-20V, 20 PE"), or a general enquiry.
 * @param {{modelCode: string, pe: number}|null|undefined} selection
 * @returns {string}
 */
export function enquiryCtaLabel(selection) {
  if (!selection) {
    return GENERAL_ENQUIRY_LABEL;
  }
  return `${selection.modelCode}, ${selection.pe} PE`;
}
