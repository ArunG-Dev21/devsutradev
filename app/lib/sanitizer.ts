import { FilterXSS, escapeAttrValue, whiteList } from 'xss';

/**
 * Sanitizes an HTML string to prevent XSS vulnerabilities.
 * Used for rendering HTML content returned from the Shopify Storefront API
 * (e.g., product descriptions, blog posts, pages).
 */

const sanitizer = new FilterXSS({
  // Extend default whitelist with common attributes needed for Hydrogen/Tailwind
  onIgnoreTagAttr: function (tag: string, name: string, value: string, isWhiteAttr: boolean) {
    if (name === 'class' || name === 'style' || name === 'loading') {
      // Allow class, style, and loading on all tags
      return name + '="' + escapeAttrValue(value) + '"';
    }
  },
  // We can inherit defaults or merge. Here we rely on xss's sensible defaults.
  // Plus we enable iframe and video for rich content:
  whiteList: {
    ...whiteList,
    iframe: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'class', 'style'],
    video: ['src', 'controls', 'width', 'height', 'poster', 'class', 'style', 'loop', 'muted', 'playsinline', 'autoplay'],
    source: ['src', 'type'],
    picture: ['class', 'style'],
    figure: ['class', 'style'],
    figcaption: ['class', 'style']
  },
  stripIgnoreTagBody: ['script']
});

export function sanitizeHtml(html: string | undefined | null): string {
  if (!html) return '';
  return sanitizer.process(html);
}
