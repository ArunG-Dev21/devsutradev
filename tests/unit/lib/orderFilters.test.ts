import {describe, it, expect} from 'vitest';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
} from '~/lib/orderFilters';

describe('buildOrderSearchQuery', () => {
  it('returns undefined when no filters are provided', () => {
    expect(buildOrderSearchQuery({})).toBeUndefined();
  });

  it('builds a single name filter', () => {
    expect(buildOrderSearchQuery({name: '1001'})).toBe('name:1001');
  });

  it('strips a leading hash from the order name', () => {
    expect(buildOrderSearchQuery({name: '#1001'})).toBe('name:1001');
  });

  it('combines name and confirmation number with AND', () => {
    expect(
      buildOrderSearchQuery({name: '1001', confirmationNumber: 'ABC123'}),
    ).toBe('name:1001 AND confirmation_number:ABC123');
  });

  it('sanitizes injection attempts in the name field', () => {
    // GraphQL injection shouldn't survive — only alnum/underscore/dash kept.
    expect(
      buildOrderSearchQuery({name: '1001 OR name:9999'}),
    ).toBe('name:1001ORname9999');
  });

  it('returns undefined when the only filter sanitizes to empty', () => {
    expect(buildOrderSearchQuery({name: '!!!'})).toBeUndefined();
  });
});

describe('parseOrderFilters', () => {
  it('parses both name and confirmation_number', () => {
    const params = new URLSearchParams('name=1001&confirmation_number=ABC');
    expect(parseOrderFilters(params)).toEqual({
      name: '1001',
      confirmationNumber: 'ABC',
    });
  });

  it('returns an empty object when no params are present', () => {
    expect(parseOrderFilters(new URLSearchParams())).toEqual({});
  });

  it('omits empty values', () => {
    const params = new URLSearchParams('name=&confirmation_number=ABC');
    expect(parseOrderFilters(params)).toEqual({confirmationNumber: 'ABC'});
  });
});
