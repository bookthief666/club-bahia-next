import { describe, expect, it } from 'vitest';
import {
  formatUtcForVenueInput,
  venueInputToUtc,
} from '../lib/admin/autopilot/venue-time';

describe('Club Bahia publishing time', () => {
  it('converts summer Los Angeles wall time to UTC', () => {
    expect(venueInputToUtc('2026-08-08T19:00')).toBe(
      '2026-08-09T02:00:00.000Z',
    );
    expect(formatUtcForVenueInput('2026-08-09T02:00:00.000Z')).toBe(
      '2026-08-08T19:00',
    );
  });

  it('converts winter Los Angeles wall time to UTC', () => {
    expect(venueInputToUtc('2026-12-08T19:00')).toBe(
      '2026-12-09T03:00:00.000Z',
    );
  });

  it('rejects a nonexistent daylight-saving wall time', () => {
    expect(venueInputToUtc('2026-03-08T02:30')).toBeUndefined();
  });

  it('rejects malformed input', () => {
    expect(venueInputToUtc('not-a-date')).toBeUndefined();
    expect(formatUtcForVenueInput('not-a-date')).toBe('');
  });
});
