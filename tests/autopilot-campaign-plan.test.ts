import { describe, expect, it } from 'vitest';
import { buildPromotionTimeline } from '../lib/admin/autopilot/campaign-plan';
import type { OperationsEvent } from '../lib/admin/domain';

function eventAt(startsAt: string): OperationsEvent {
  return {
    id: 'evt-campaign-plan',
    title: 'Club Bahia Saturday Night',
    concept: 'Live music and dancing.',
    startsAt,
    endsAt: new Date(new Date(startsAt).getTime() + 5 * 3_600_000).toISOString(),
    status: 'approved',
    room: 'Main room',
    capacityTarget: 250,
    ticketsSold: 0,
    owner: 'Manager',
    marketingLaunchAt: startsAt,
    riskFlags: [],
    revenueTarget: 0,
    committedCosts: 0,
  };
}

describe('Promotion Autopilot campaign planner', () => {
  it('preserves the complete ideal timeline when the event is entered early', () => {
    const now = new Date('2026-08-01T19:00:00.000Z');
    const event = eventAt('2026-08-22T04:00:00.000Z');
    const plan = buildPromotionTimeline({ event, now });

    expect(plan.compressed).toBe(false);
    expect(plan.entries).toHaveLength(10);
    expect(plan.skippedPhases).toEqual([]);
    expect(plan.entries[0]?.phase).toBe('announcement');
    expect(plan.entries.at(-1)?.phase).toBe('thank-you');
    expect(plan.entries.every((entry) => entry.venueTime.length === 16)).toBe(true);
  });

  it('compresses missed high-value posts into future slots for a late event', () => {
    const now = new Date('2026-08-19T19:00:00.000Z');
    const event = eventAt('2026-08-22T04:00:00.000Z');
    const plan = buildPromotionTimeline({ event, now });

    expect(plan.compressed).toBe(true);
    expect(plan.compressionReason).toContain('redistributed');
    expect(plan.entries.some((entry) => entry.compressed)).toBe(true);
    expect(
      plan.entries.every(
        (entry) => new Date(entry.scheduledFor).getTime() > now.getTime(),
      ),
    ).toBe(true);
    expect(plan.entries.some((entry) => entry.phase === 'thank-you')).toBe(true);
  });

  it('limits same-day compression and never schedules a pre-event post too late', () => {
    const now = new Date('2026-08-21T22:00:00.000Z');
    const event = eventAt('2026-08-22T04:00:00.000Z');
    const plan = buildPromotionTimeline({ event, now });
    const eventTime = new Date(event.startsAt).getTime();
    const preEvent = plan.entries.filter((entry) => entry.phase !== 'thank-you');

    expect(plan.compressed).toBe(true);
    expect(preEvent.filter((entry) => entry.compressed).length).toBeLessThanOrEqual(1);
    expect(
      preEvent.every(
        (entry) => new Date(entry.scheduledFor).getTime() <= eventTime - 90 * 60_000,
      ),
    ).toBe(true);
  });

  it('rejects events without a valid start time', () => {
    expect(() =>
      buildPromotionTimeline({
        event: eventAt('not-a-date'),
        now: new Date('2026-08-01T19:00:00.000Z'),
      }),
    ).toThrow('valid start time');
  });
});
