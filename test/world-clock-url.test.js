import { describe, expect, test } from 'bun:test';
import { buildWorldClockUrl } from '../assets/js/lib/world-clock-url.js';

const BASE = 'https://world-clock.srly.io/';

describe('buildWorldClockUrl', () => {
  test('returns the bare url when nothing is configured', () => {
    expect(buildWorldClockUrl(BASE, {})).toBe(BASE);
    expect(buildWorldClockUrl(BASE)).toBe(BASE);
  });

  test('emits one tz parameter per city, in order', () => {
    expect(
      buildWorldClockUrl(BASE, {
        clocks: [
          { tz: 'America/New_York', label: '' },
          { tz: 'Europe/London', label: '' },
        ],
      }),
    ).toBe(`${BASE}?tz=America/New_York&tz=Europe/London`);
  });

  test('keeps slashes and the pipe literal but encodes spaces in labels', () => {
    expect(
      buildWorldClockUrl(BASE, { clocks: [{ tz: 'America/New_York', label: 'New York' }] }),
    ).toBe(`${BASE}?tz=America/New_York|New%20York`);
  });

  test('skips empty timezones and trims zone and label', () => {
    expect(
      buildWorldClockUrl(BASE, {
        clocks: [
          { tz: '   ', label: 'ignored' },
          { tz: ' Asia/Tokyo ', label: ' HQ ' },
        ],
      }),
    ).toBe(`${BASE}?tz=Asia/Tokyo|HQ`);
  });

  test('adds title, locale, format and a bare seconds flag when set', () => {
    expect(
      buildWorldClockUrl(BASE, {
        title: 'Trading Desk',
        locale: 'de-DE',
        format: '12',
        seconds: true,
        clocks: [{ tz: 'Asia/Tokyo', label: '' }],
      }),
    ).toBe(`${BASE}?title=Trading%20Desk&tz=Asia/Tokyo&locale=de-DE&format=12&seconds`);
  });

  test('ignores an unknown format and omits seconds when off', () => {
    expect(
      buildWorldClockUrl(BASE, { format: '36', seconds: false, clocks: [{ tz: 'UTC' }] }),
    ).toBe(`${BASE}?tz=UTC`);
  });

  test('allows a comma inside a label via a repeated tz parameter', () => {
    expect(
      buildWorldClockUrl(BASE, { clocks: [{ tz: 'Asia/Tokyo', label: 'Tokyo, Japan' }] }),
    ).toBe(`${BASE}?tz=Asia/Tokyo|Tokyo%2C%20Japan`);
  });
});
