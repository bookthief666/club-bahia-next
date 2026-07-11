import { describe, expect, it } from 'vitest';
import { eventFormSchema } from '../lib/admin/events/validation';
const base={title:'Night',shortDescription:'Desc',eventDate:'2026-07-11',startTime:'21:00',endTime:'02:00',venueArea:'main_room',category:'salsa',agePolicy:'twenty_one_plus',capacity:100,expectedAttendance:80,coverChargeCents:1000,status:'planning',projectedBudgetCents:10000,promotionalReadiness:'ready',staffingReadiness:'ready',warningFlags:[]};
describe('event validation',()=>{
 it('requires title',()=>expect(eventFormSchema.safeParse({...base,title:''}).success).toBe(false));
 it('allows cross-midnight events',()=>expect(eventFormSchema.safeParse(base).success).toBe(true));
 it('rejects equal start and end times',()=>expect(eventFormSchema.safeParse({...base,endTime:'21:00'}).success).toBe(false));
 it('validates capacity, money, and urls',()=>{expect(eventFormSchema.safeParse({...base,capacity:0}).success).toBe(false); expect(eventFormSchema.safeParse({...base,coverChargeCents:-1}).success).toBe(false); expect(eventFormSchema.safeParse({...base,ticketUrl:'nope'}).success).toBe(false);});
 it('requires cancellation reason',()=>expect(eventFormSchema.safeParse({...base,status:'cancelled'}).success).toBe(false));
 it('warns through validation when attendance exceeds capacity',()=>expect(eventFormSchema.safeParse({...base,expectedAttendance:101}).success).toBe(false));
});
