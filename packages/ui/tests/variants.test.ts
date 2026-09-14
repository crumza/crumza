import { expect, test } from 'bun:test';
import { variants } from '../src/core/variants';

const button = variants({
  base: 'inline-flex',
  variants: {
    variant: { solid: 'bg-primary', glass: 'glass' },
    size: { sm: 'h-6', md: 'h-7' },
  },
  defaults: { variant: 'glass', size: 'md' },
});

test('applies defaults', () => {
  expect(button()).toBe('inline-flex glass h-7');
});

test('overrides and appends className', () => {
  expect(button({ variant: 'solid', className: 'w-full' })).toBe(
    'inline-flex bg-primary h-7 w-full',
  );
});
