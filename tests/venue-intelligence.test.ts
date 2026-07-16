import { describe, expect, it } from 'vitest';
import {
  CLUB_BAHIA_VENUE_PROFILE,
  getVenueFact,
  venueGenerationContext,
} from '../lib/admin/venue-intelligence/profile';

describe('Club Bahia venue intelligence', () => {
  it('exposes verified venue facts without treating event policies as universal facts', () => {
    const context = venueGenerationContext();

    expect(context.verifiedFacts['venue-name']).toBe('Club Bahia');
    expect(context.verifiedFacts.address).toContain('1130 Sunset Blvd');
    expect(context.verifiedFacts['age-policy']).toBeUndefined();
    expect(context.eventSpecificFacts.join(' ')).toContain('Confirm the age policy');
  });

  it('keeps prohibited claims and campaign guardrails explicit', () => {
    expect(CLUB_BAHIA_VENUE_PROFILE.prohibitedClaims.join(' ')).toContain(
      'Do not invent performers',
    );
    expect(CLUB_BAHIA_VENUE_PROFILE.campaignGuardrails).toContain(
      'The event title is the only authoritative public event name.',
    );
  });

  it('can resolve individual venue facts for defaults and UI', () => {
    expect(getVenueFact('phone')?.value).toBe('(213) 250-4313');
    expect(getVenueFact('missing-fact')).toBeUndefined();
  });
});
