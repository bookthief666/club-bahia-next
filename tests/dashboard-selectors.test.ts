import { describe, expect, it } from 'vitest';
import { commandCenterFixture } from '../lib/admin/fixtures';
import { getAtRiskEvents, getPendingReservations, getTodayTasks, getUpcomingEvents, hasOperationalAttention } from '../lib/admin/selectors';

describe('dashboard selectors', () => {
  it('returns incomplete work due today in due-date order', () => {
    expect(getTodayTasks(commandCenterFixture).map((task) => task.id)).toEqual(['tsk-door-list', 'tsk-band-deposit']);
  });

  it('returns upcoming active events within 14 days', () => {
    expect(getUpcomingEvents(commandCenterFixture).map((event) => event.id)).toEqual(['evt-sabado-caliente', 'evt-domingo-live', 'evt-cumbia-friday', 'evt-private-quince']);
  });

  it('flags explicit risks and poor near-term ticket pace', () => {
    expect(getAtRiskEvents(commandCenterFixture).map((event) => event.id)).toContain('evt-domingo-live');
    expect(getAtRiskEvents(commandCenterFixture).map((event) => event.id)).not.toContain('evt-cumbia-friday');
  });

  it('sorts pending reservations oldest first', () => {
    expect(getPendingReservations(commandCenterFixture).map((reservation) => reservation.id)).toEqual(['res-003', 'res-002', 'res-001']);
  });

  it('reports operational attention when any dashboard queue is populated', () => {
    expect(hasOperationalAttention(commandCenterFixture)).toBe(true);
  });
});
