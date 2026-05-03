import {describe, it, expect} from 'vitest';
import {getVariantUrl} from '~/lib/variants';

describe('getVariantUrl', () => {
  it('builds a /products/<handle> URL with no locale and no options', () => {
    const url = getVariantUrl({
      handle: 'rudraksha-mala',
      pathname: '/',
      searchParams: new URLSearchParams(),
    });
    expect(url).toBe('/products/rudraksha-mala');
  });

  it('preserves locale prefix when present in the pathname', () => {
    const url = getVariantUrl({
      handle: 'karungali-bracelet',
      pathname: '/EN-US/collections/all',
      searchParams: new URLSearchParams(),
    });
    expect(url).toBe('/EN-US/products/karungali-bracelet');
  });

  it('appends selected options as search params', () => {
    const url = getVariantUrl({
      handle: 'mala',
      pathname: '/',
      searchParams: new URLSearchParams(),
      selectedOptions: [
        {name: 'Size', value: '108 Beads'},
        {name: 'Color', value: 'Black'},
      ],
    });
    expect(url).toBe('/products/mala?Size=108+Beads&Color=Black');
  });

  it('merges selected options with existing search params', () => {
    const url = getVariantUrl({
      handle: 'mala',
      pathname: '/',
      searchParams: new URLSearchParams('utm_source=test'),
      selectedOptions: [{name: 'Size', value: 'Large'}],
    });
    expect(url).toContain('utm_source=test');
    expect(url).toContain('Size=Large');
  });

  it('overwrites a search param of the same name as an option', () => {
    const url = getVariantUrl({
      handle: 'mala',
      pathname: '/',
      searchParams: new URLSearchParams('Size=Old'),
      selectedOptions: [{name: 'Size', value: 'New'}],
    });
    expect(url).toBe('/products/mala?Size=New');
  });
});
