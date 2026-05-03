import {describe, it, expect} from 'vitest';
import {cn} from '~/lib/utils';

describe('cn', () => {
  it('joins simple class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('flattens arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('handles object syntax from clsx', () => {
    expect(cn({a: true, b: false, c: true})).toBe('a c');
  });

  it('merges conflicting tailwind utilities (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm', 'text-base')).toBe('text-base');
  });

  it('preserves unrelated tailwind utilities', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
