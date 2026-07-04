import { describe, expect, test } from 'bun:test';
import { buildLaunchUrl } from '../assets/js/lib/expand-template.js';

const BASE = 'https://opening-hours.srly.io/';

describe('buildLaunchUrl', () => {
  test('returns the bare url with no template', () => {
    expect(buildLaunchUrl(BASE, '')).toBe(BASE);
    expect(buildLaunchUrl('https://product-hunt.srly.io/')).toBe('https://product-hunt.srly.io/');
  });

  test('returns the bare url when nothing is set', () => {
    expect(buildLaunchUrl(BASE, '{?name,tz,format,mon}')).toBe(BASE);
  });

  test('emits only the set params, in template order', () => {
    const t = '{?name,tz,format,mon,tue}';
    const v = { name: 'Cafe', tz: 'Europe/London', mon: '09:00-17:00' };
    expect(buildLaunchUrl(BASE, t, v)).toBe(
      `${BASE}?name=Cafe&tz=Europe/London&mon=09%3A00-17%3A00`,
    );
  });

  test('omits a value equal to its default', () => {
    const t = '{?format,seconds}';
    const defaults = { format: '', seconds: false };
    expect(buildLaunchUrl(BASE, t, { format: '', seconds: false }, defaults)).toBe(BASE);
    expect(buildLaunchUrl(BASE, t, { format: '24', seconds: false }, defaults)).toBe(`${BASE}?format=24`);
  });

  test('renders a boolean true as name=1 and omits false', () => {
    expect(buildLaunchUrl(BASE, '{?seconds}', { seconds: true })).toBe(`${BASE}?seconds=1`);
    expect(buildLaunchUrl(BASE, '{?seconds}', { seconds: false })).toBe(BASE);
  });

  test('explodes an object into its key=value pairs, keeping slashes literal', () => {
    const t = '{?location*,locale}';
    const v = { location: { lat: '51.5', lng: '-0.12' }, locale: 'en-GB' };
    expect(buildLaunchUrl('https://weather.srly.io/', t, v)).toBe(
      'https://weather.srly.io/?lat=51.5&lng=-0.12&locale=en-GB',
    );
  });

  test('explodes an array into repeated params', () => {
    const t = '{?tz*}';
    const v = { tz: ['Europe/London', 'Asia/Tokyo|HQ'] };
    expect(buildLaunchUrl('https://world-clock.srly.io/', t, v)).toBe(
      'https://world-clock.srly.io/?tz=Europe/London&tz=Asia/Tokyo|HQ',
    );
  });

  test('percent-encodes spaces but keeps commas readable via decode round-trip', () => {
    const v = { mon: '09:00-12:00,13:00-17:00' };
    const url = buildLaunchUrl(BASE, '{?mon}', v);
    const got = new URL(url).searchParams.get('mon');
    expect(got).toBe('09:00-12:00,13:00-17:00');
  });
});
