/**
 * The contact sheet's primary action ([data-enquiry-cta], sheet 12): a
 * recipientless WhatsApp enquiry whose value line names the model the
 * visitor picked on sheet 10, or reads "Send a general enquiry" until they
 * pick one. The sheet 10 example (8 PE, drawn before any input) is not a
 * pick, so it never shows here. textContent only, never innerHTML.
 */
import { buildWhatsAppUrl, buildEnquiryText, enquiryCtaLabel } from '../lib/share.js';

/**
 * @param {HTMLElement} root a `[data-deck]` element
 * @param {{modelCode: string, pe: number, seriesName: string, conditions?: string[]}|null} selection
 *   the visitor's own selection, or null before they pick one
 */
export function updateEnquiryCta(root, selection) {
  const href = buildWhatsAppUrl(root.dataset.whatsapp || '', buildEnquiryText(selection));
  const label = enquiryCtaLabel(selection);
  root.querySelectorAll('[data-enquiry-cta]').forEach((link) => {
    link.setAttribute('href', href);
    const value = link.querySelector('[data-enquiry-label]');
    if (value) {
      value.textContent = label;
    }
  });
}
