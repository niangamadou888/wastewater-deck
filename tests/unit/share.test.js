import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhone,
  buildWhatsAppUrl,
  resolveShareUrl,
  buildEnquiryText,
  enquiryCtaLabel,
  GENERAL_ENQUIRY_LABEL,
} from '../../src/js/lib/share.js';

test('normalizePhone: strips spaces and plus sign', () => {
  assert.equal(normalizePhone('+60 3 9123 4567'), '60391234567');
});

test('normalizePhone: strips hyphens and parentheses', () => {
  assert.equal(normalizePhone('+60 (3) 9123-4567'), '60391234567');
});

test('normalizePhone: leaves an already-normalized string alone', () => {
  assert.equal(normalizePhone('60391234567'), '60391234567');
});

test('normalizePhone: empty string returns empty string', () => {
  assert.equal(normalizePhone(''), '');
});

test('normalizePhone: non-string input returns empty string', () => {
  assert.equal(normalizePhone(null), '');
  assert.equal(normalizePhone(undefined), '');
  assert.equal(normalizePhone(60391234567), '');
});

test('buildWhatsAppUrl: normalizes the phone and omits text when absent', () => {
  assert.equal(
    buildWhatsAppUrl('+60 3 9123 4567'),
    'https://wa.me/60391234567'
  );
});

test('buildWhatsAppUrl: appends encoded text when provided', () => {
  assert.equal(
    buildWhatsAppUrl('+60 3 9123 4567', 'Hello there'),
    'https://wa.me/60391234567?text=Hello%20there'
  );
});

test('buildWhatsAppUrl: encodes special characters in text', () => {
  const url = buildWhatsAppUrl('+60 3 9123 4567', 'PE=8 & FRP?');
  assert.equal(url, `https://wa.me/60391234567?text=${encodeURIComponent('PE=8 & FRP?')}`);
});

test('buildWhatsAppUrl: empty string text behaves like no text', () => {
  assert.equal(buildWhatsAppUrl('+60 3 9123 4567', ''), 'https://wa.me/60391234567');
});

test('buildWhatsAppUrl: an empty phone (no real company number) omits digits but keeps the text', () => {
  assert.equal(
    buildWhatsAppUrl('', 'Hello there'),
    'https://wa.me/?text=Hello%20there'
  );
});

test('buildWhatsAppUrl: an empty phone with no text is just the recipientless wa.me root', () => {
  assert.equal(buildWhatsAppUrl(''), 'https://wa.me/');
});

test('buildWhatsAppUrl: a missing phone (undefined/null) behaves like an empty one', () => {
  assert.equal(buildWhatsAppUrl(undefined, 'Hi'), 'https://wa.me/?text=Hi');
  assert.equal(buildWhatsAppUrl(null, 'Hi'), 'https://wa.me/?text=Hi');
});

test('resolveShareUrl: returns origin+pathname for http', () => {
  const location = { protocol: 'http:', origin: 'http://example.com', pathname: '/deck/index.html' };
  assert.equal(resolveShareUrl(location, 'https://canonical.example/deck'), 'http://example.com/deck/index.html');
});

test('resolveShareUrl: returns origin+pathname for https', () => {
  const location = { protocol: 'https:', origin: 'https://example.com', pathname: '/deck/' };
  assert.equal(resolveShareUrl(location, 'https://canonical.example/deck'), 'https://example.com/deck/');
});

test('resolveShareUrl: falls back to canonical url for file protocol', () => {
  const location = { protocol: 'file:', origin: 'null', pathname: '/Users/me/deck/index.html' };
  assert.equal(resolveShareUrl(location, 'https://canonical.example/deck'), 'https://canonical.example/deck');
});

test('resolveShareUrl: falls back to canonical url for other protocols', () => {
  const location = { protocol: 'blob:', origin: 'null', pathname: '/x' };
  assert.equal(resolveShareUrl(location, 'https://canonical.example/deck'), 'https://canonical.example/deck');
});

test('resolveShareUrl: an empty canonical url on file:// (no SITE_URL configured) resolves to empty, not a guess', () => {
  const location = { protocol: 'file:', origin: 'null', pathname: '/Users/me/deck/index.html' };
  assert.equal(resolveShareUrl(location, ''), '');
});

test('resolveShareUrl: http/https still wins even with an empty canonical url', () => {
  const location = { protocol: 'https:', origin: 'https://example.com', pathname: '/deck/' };
  assert.equal(resolveShareUrl(location, ''), 'https://example.com/deck/');
});

test('buildEnquiryText: without a selection produces a general enquiry', () => {
  const text = buildEnquiryText(null);
  assert.match(text, /wastewater/i);
  assert.match(text, /sanitation/i);
});

test('buildEnquiryText: without a selection does not mention a model code', () => {
  const text = buildEnquiryText(null);
  assert.doesNotMatch(text, /MF\d/);
});

test('buildEnquiryText: undefined selection behaves like null', () => {
  assert.equal(buildEnquiryText(undefined), buildEnquiryText(null));
});

test('buildEnquiryText: with a selection names the model code, PE and series', () => {
  const text = buildEnquiryText({
    modelCode: 'LP-8',
    pe: 8,
    seriesName: 'PE Bio-Filter septic tank',
    conditions: [],
  });
  assert.match(text, /LP-8/);
  assert.match(text, /8 PE/);
  assert.match(text, /PE Bio-Filter septic tank/);
});

test('buildEnquiryText: with a selection lists ticked site conditions', () => {
  const text = buildEnquiryText({
    modelCode: 'LF-20V',
    pe: 20,
    seriesName: 'FRP Bio-Filter septic tank',
    conditions: ['high water table', 'deep burial'],
  });
  assert.match(text, /high water table/);
  assert.match(text, /deep burial/);
});

test('buildEnquiryText: with a selection but no conditions omits the conditions sentence', () => {
  const text = buildEnquiryText({
    modelCode: 'LT-40',
    pe: 35,
    seriesName: 'LT small sewage treatment system',
    conditions: [],
  });
  assert.doesNotMatch(text, /Site conditions/i);
});

test('buildEnquiryText: with a selection asks for the specification sheet and CAD drawing', () => {
  const text = buildEnquiryText({
    modelCode: 'LP-8',
    pe: 8,
    seriesName: 'PE Bio-Filter septic tank',
    conditions: [],
  });
  assert.match(text, /specification sheet/i);
  assert.match(text, /CAD drawing/i);
});

test('enquiryCtaLabel: no selection reads as a general enquiry', () => {
  assert.equal(enquiryCtaLabel(null), 'Send a general enquiry');
  assert.equal(enquiryCtaLabel(undefined), GENERAL_ENQUIRY_LABEL);
});

test('enquiryCtaLabel: a selection names the model and PE, as on sheet 10', () => {
  assert.equal(enquiryCtaLabel({ modelCode: 'LF-20V', pe: 20, seriesName: 'FRP Bio-Filter septic tank' }), 'LF-20V, 20 PE');
});
