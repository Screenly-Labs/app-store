import { describe, expect, test } from 'bun:test';
import { applyItemFormat } from '../assets/js/lib/item-format.js';

const F = '{zone}|{label}';

describe('applyItemFormat', () => {
  test('composes both fields with the separator', () => {
    expect(applyItemFormat(F, { zone: 'Europe/London', label: 'Home' })).toBe('Europe/London|Home');
  });

  test('drops a blank trailing field and its separator', () => {
    expect(applyItemFormat(F, { zone: 'America/New_York', label: '' })).toBe('America/New_York');
    expect(applyItemFormat(F, { zone: 'America/New_York' })).toBe('America/New_York');
  });

  test('drops a blank leading field and its separator', () => {
    expect(applyItemFormat(F, { zone: '', label: 'Orphan' })).toBe('Orphan');
  });

  test('trims whitespace around each field', () => {
    expect(applyItemFormat(F, { zone: '  UTC  ', label: '   ' })).toBe('UTC');
  });

  test('yields an empty string when every field is blank', () => {
    expect(applyItemFormat(F, { zone: '', label: '' })).toBe('');
    expect(applyItemFormat(F, {})).toBe('');
  });

  test('keeps surrounding literals only when a field is present', () => {
    expect(applyItemFormat('[{label}]', { label: 'x' })).toBe('[x]');
    expect(applyItemFormat('[{label}]', { label: '' })).toBe('');
  });
});
