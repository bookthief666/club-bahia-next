import { describe, expect, it } from 'vitest';
import { eventFixtures } from '../lib/admin/events/fixtures';
import { getUpcomingEventDomain,getEventsThisWeek,getNeedsPromotionEvents,getNeedsStaffingEvents,getAtRiskEventDomain,getPastDuePreparationEvents } from '../lib/admin/events/selectors';
import { groupEventsByLocalDate, monthDays, weekDays } from '../lib/admin/events/calendar';
import { BrowserFixtureEventRepository } from '../lib/admin/events/repository';

describe('event selectors and calendar utilities',()=>{
 it('derives dashboard queues excluding archived records',()=>{expect(getUpcomingEventDomain(eventFixtures).map(e=>e.id)).not.toContain('evt-archived-test'); expect(getEventsThisWeek(eventFixtures).length).toBeGreaterThan(0); expect(getNeedsPromotionEvents(eventFixtures).map(e=>e.id)).toContain('evt-domingo-live'); expect(getNeedsStaffingEvents(eventFixtures).map(e=>e.id)).toContain('evt-sabado-caliente'); expect(getAtRiskEventDomain(eventFixtures).map(e=>e.id)).toContain('evt-domingo-live'); expect(getPastDuePreparationEvents(eventFixtures,'2026-08-01').length).toBeGreaterThan(0);});
 it('handles month/year boundaries and local date grouping',()=>{expect(monthDays('2026-01-01')[0]).toBe('2025-12-28'); expect(weekDays('2026-01-01')).toContain('2026-01-01'); expect(groupEventsByLocalDate(eventFixtures)['2026-07-11'][0].id).toBe('evt-sabado-caliente');});
});

describe('browser fixture repository',()=>{
 it('creates updates duplicates archives restores and deletes',async()=>{const store=new Map<string,string>(); // @ts-expect-error test window
 global.window={}; // @ts-expect-error test localStorage
 global.localStorage={getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)}; const repo=new BrowserFixtureEventRepository(); const created=await repo.createEvent({...eventFixtures[0],status:'planning'}); expect(created.id).toMatch('evt-dev'); const updated=await repo.updateEvent(created.id,{title:'Updated'}); expect(updated.title).toBe('Updated'); const dup=await repo.duplicateEvent(created.id,'2026-08-01'); expect(dup.title).toContain('Copy'); expect(dup.status).toBe('planning'); expect((await repo.archiveEvent(created.id)).status).toBe('archived'); expect((await repo.restoreEvent(created.id)).status).toBe('planning'); await repo.deleteEvent(created.id); await expect(repo.updateEvent('missing',{title:'x'})).rejects.toThrow('Event not found');});
});
