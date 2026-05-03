import {describe, it, expect} from 'vitest';
import {
  truncate,
  stripHtml,
  canonicalUrl,
  generateMeta,
  jsonLd,
  SEO_DEFAULTS,
} from '~/lib/seo';

describe('truncate', () => {
  it('returns empty string for falsy input', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('returns the input when shorter than max', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('collapses internal whitespace', () => {
    expect(truncate('Hello   world', 100)).toBe('Hello world');
  });

  it('truncates and appends ellipsis when text exceeds max length', () => {
    const out = truncate('The quick brown fox jumps over the lazy dog', 20);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(22);
  });
});

describe('stripHtml', () => {
  it('removes all tags but keeps inner text', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('handles self-closing tags', () => {
    expect(stripHtml('A<br/>B<br>C')).toBe('ABC');
  });

  it('trims whitespace', () => {
    expect(stripHtml('  <p>X</p>  ')).toBe('X');
  });
});

describe('canonicalUrl', () => {
  it('joins origin and path', () => {
    expect(canonicalUrl('https://devasutra.com', '/products/x')).toBe(
      'https://devasutra.com/products/x',
    );
  });

  it('strips query params and hash from the path', () => {
    expect(
      canonicalUrl('https://devasutra.com', '/products/x?utm=1#review'),
    ).toBe('https://devasutra.com/products/x');
  });
});

describe('generateMeta', () => {
  const base = {
    title: 'Test Title',
    description: 'Test description.',
    canonical: 'https://devasutra.com/test',
  };

  it('emits title, description, robots and theme-color', () => {
    const metas = generateMeta(base);
    const titleEntry = metas.find((m) => 'title' in m);
    const descEntry = metas.find((m) => m.name === 'description');
    const robots = metas.find((m) => m.name === 'robots');
    const themeColors = metas.filter((m) => m.name === 'theme-color');

    expect(titleEntry?.title).toBe('Test Title');
    expect(descEntry?.content).toBe('Test description.');
    expect(robots?.content).toBe('index, follow');
    expect(themeColors).toHaveLength(2);
  });

  it('emits noindex when noIndex is true', () => {
    const robots = generateMeta({...base, noIndex: true}).find(
      (m) => m.name === 'robots',
    );
    expect(robots?.content).toBe('noindex, nofollow');
  });

  it('emits og: tags using the canonical URL', () => {
    const metas = generateMeta(base);
    expect(metas.find((m) => m.property === 'og:title')?.content).toBe(
      'Test Title',
    );
    expect(metas.find((m) => m.property === 'og:url')?.content).toBe(
      'https://devasutra.com/test',
    );
    expect(metas.find((m) => m.property === 'og:site_name')?.content).toBe(
      SEO_DEFAULTS.siteName,
    );
  });

  it('emits Twitter summary card by default and large_image when ogImage given', () => {
    const noImage = generateMeta(base).find((m) => m.name === 'twitter:card');
    const withImage = generateMeta({...base, ogImage: 'https://x/i.png'}).find(
      (m) => m.name === 'twitter:card',
    );
    expect(noImage?.content).toBe('summary');
    expect(withImage?.content).toBe('summary_large_image');
  });
});

describe('jsonLd', () => {
  it('serializes the schema object to JSON', () => {
    const out = jsonLd({'@type': 'Organization', name: 'X'});
    expect(JSON.parse(out)).toEqual({'@type': 'Organization', name: 'X'});
  });
});
