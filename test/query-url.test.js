import { describe, expect, test } from 'bun:test';
import { buildQueryUrl } from '../assets/js/lib/query-url.js';

describe('buildQueryUrl', () => {
  test('returns the bare url when every param is empty', () => {
    expect(buildQueryUrl('https://app.example', { lat: '', lng: '', lang: '', '24h': '' }))
      .toBe('https://app.example');
  });

  test('includes only the non-empty params, in order', () => {
    expect(buildQueryUrl('https://app.example', { lat: '51.53', lng: '', lang: '', '24h': '1' }))
      .toBe('https://app.example?lat=51.53&24h=1');
  });

  test('appends all params when all are set', () => {
    expect(buildQueryUrl('https://app.example', { lat: '1.0', lng: '2.0' }))
      .toBe('https://app.example?lat=1.0&lng=2.0');
  });

  test('treats an empty param map as no query', () => {
    expect(buildQueryUrl('https://app.example', {})).toBe('https://app.example');
  });
});
