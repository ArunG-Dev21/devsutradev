import {describe, it, expect} from 'vitest';
import {getLocaleFromRequest} from '~/lib/i18n';

function makeRequest(url: string): Request {
  return new Request(url);
}

describe('getLocaleFromRequest', () => {
  it('returns default EN/IN locale when no locale prefix is present', () => {
    const locale = getLocaleFromRequest(makeRequest('https://example.com/'));
    expect(locale).toEqual({language: 'EN', country: 'IN', pathPrefix: ''});
  });

  it('returns default for arbitrary non-locale paths', () => {
    const locale = getLocaleFromRequest(
      makeRequest('https://example.com/products/foo'),
    );
    expect(locale.language).toBe('EN');
    expect(locale.country).toBe('IN');
    expect(locale.pathPrefix).toBe('');
  });

  it('parses /EN-US prefix into language EN, country US', () => {
    const locale = getLocaleFromRequest(
      makeRequest('https://example.com/EN-US/products/foo'),
    );
    expect(locale.language).toBe('EN');
    expect(locale.country).toBe('US');
    expect(locale.pathPrefix).toBe('/EN-US');
  });

  it('uppercases lowercased locale segments', () => {
    const locale = getLocaleFromRequest(
      makeRequest('https://example.com/en-gb/'),
    );
    expect(locale.language).toBe('EN');
    expect(locale.country).toBe('GB');
    expect(locale.pathPrefix).toBe('/EN-GB');
  });

  it('ignores three-letter language codes (not the locale shape)', () => {
    const locale = getLocaleFromRequest(
      makeRequest('https://example.com/eng-us/'),
    );
    expect(locale.pathPrefix).toBe('');
  });
});
