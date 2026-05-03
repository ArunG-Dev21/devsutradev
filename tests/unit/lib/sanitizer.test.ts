import {describe, it, expect} from 'vitest';
import {sanitizeHtml, cleanShopifyHtml} from '~/lib/sanitizer';

describe('sanitizeHtml', () => {
  it('returns empty string for nullish input', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });

  it('strips script tags entirely (body removed)', () => {
    const out = sanitizeHtml('<p>Hi</p><script>alert(1)</script>');
    expect(out).not.toMatch(/script/i);
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('<p>Hi</p>');
  });

  it('strips inline event handlers like onclick', () => {
    const out = sanitizeHtml('<a href="/x" onclick="evil()">click</a>');
    expect(out).not.toMatch(/onclick/i);
    expect(out).toContain('href');
  });

  it('preserves class and style attributes on common tags', () => {
    const out = sanitizeHtml('<p class="prose" style="color:red">x</p>');
    expect(out).toContain('class');
    expect(out).toContain('style');
  });

  it('preserves iframe with allowed attributes', () => {
    const out = sanitizeHtml(
      '<iframe src="https://www.youtube.com/embed/abc" allowfullscreen></iframe>',
    );
    expect(out).toContain('iframe');
    expect(out).toContain('youtube.com');
  });

  it('preserves video and source for embedded media', () => {
    const out = sanitizeHtml(
      '<video controls muted><source src="x.mp4" type="video/mp4"></video>',
    );
    expect(out).toContain('<video');
    expect(out).toContain('<source');
  });
});

describe('cleanShopifyHtml', () => {
  it('returns empty for empty input', () => {
    expect(cleanShopifyHtml('')).toBe('');
  });

  it('removes empty paragraphs', () => {
    expect(cleanShopifyHtml('<p>Real</p><p></p><p>  </p>')).toBe('<p>Real</p>');
  });

  it('removes <p><br></p> spacers', () => {
    expect(cleanShopifyHtml('<p>A</p><p><br></p><p>B</p>')).toBe(
      '<p>A</p><p>B</p>',
    );
  });

  it('collapses runs of <br> into a single one', () => {
    expect(cleanShopifyHtml('A<br><br><br>B')).toBe('A<br>B');
  });

  it('strips a leading <br> inside a paragraph', () => {
    expect(cleanShopifyHtml('<p><br>Body</p>')).toBe('<p>Body</p>');
  });

  it('strips a trailing <br> before </p>', () => {
    expect(cleanShopifyHtml('<p>Body<br></p>')).toBe('<p>Body</p>');
  });
});
