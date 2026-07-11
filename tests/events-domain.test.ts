import { describe, expect, it } from 'vitest';
import { EVENT_STATUS_DEFINITIONS, isActiveStatus, isValidTransition } from '../lib/admin/events/domain';

describe('event status workflow',()=>{
 it('centralizes status metadata',()=>{ expect(EVENT_STATUS_DEFINITIONS.on_sale.label).toBe('On sale'); expect(EVENT_STATUS_DEFINITIONS.archived.active).toBe(false); });
 it('prevents invalid transitions',()=>{ expect(isValidTransition('archived','live','2026-07-11')).toBe(false); expect(isValidTransition('completed','idea')).toBe(false); });
 it('allows live only on current Los Angeles date',()=>{ expect(isValidTransition('final_prep','live','2026-07-11',new Date('2026-07-11T18:00:00Z'))).toBe(true); expect(isValidTransition('final_prep','live','2026-07-12',new Date('2026-07-11T18:00:00Z'))).toBe(false); });
 it('classifies active statuses',()=>{ expect(isActiveStatus('marketing')).toBe(true); expect(isActiveStatus('cancelled')).toBe(false); expect(isActiveStatus('archived')).toBe(false); });
});
