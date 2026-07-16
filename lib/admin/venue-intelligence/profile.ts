import { venue } from '@/lib/constants/venue';
import type {
  VenueFact,
  VenueGenerationContext,
  VenueProfile,
} from './domain';

const facts: VenueFact[] = [
  {
    id: 'venue-name',
    label: 'Venue name',
    value: venue.name,
    status: 'verified',
    source: 'project venue constants',
  },
  {
    id: 'alternate-name',
    label: 'Alternate name',
    value: venue.alternateName,
    status: 'verified',
    source: 'project venue constants',
  },
  {
    id: 'address',
    label: 'Address',
    value: venue.address,
    status: 'verified',
    source: 'project venue constants',
  },
  {
    id: 'phone',
    label: 'Phone',
    value: venue.phone,
    status: 'verified',
    source: 'project venue constants',
  },
  {
    id: 'established',
    label: 'Established',
    value: venue.established,
    status: 'verified',
    source: 'project venue constants',
  },
  {
    id: 'tagline',
    label: 'Approved venue description',
    value: venue.tagline,
    status: 'verified',
    source: 'project venue constants',
  },
  {
    id: 'age-policy',
    label: 'Age policy',
    value: venue.ageRule,
    status: 'event-specific',
    source: 'project venue constants',
    notes: 'Confirm the age policy for every event before publishing.',
  },
];

export const CLUB_BAHIA_VENUE_PROFILE: VenueProfile = {
  id: 'club-bahia-los-angeles',
  name: venue.name,
  facts,
  brandVoice: {
    qualities: [
      'energetic',
      'welcoming',
      'stylish',
      'culturally natural',
      'specific rather than generic',
    ],
    preferredLanguage: [
      'clear calls to action',
      'natural Los Angeles English and Spanish',
      'concrete event details',
      'warm nightlife energy',
    ],
    avoidLanguage: [
      'stiff machine translation',
      'generic luxury clichés',
      'exclusionary audience labels',
      'unsupported superlatives',
      'technical product language',
    ],
  },
  preferredCallsToAction: [
    'Reserve your night',
    'Request a reservation',
    'See event details',
    'Call Club Bahia',
  ],
  prohibitedClaims: [
    'Do not invent performers, prices, times, specials, age limits, addresses, or URLs.',
    'Do not claim a reservation is confirmed until staff explicitly confirms it.',
    'Do not promise free drinks, guaranteed entry, or table availability unless verified for the event.',
    'Do not describe an experimental event concept as proven or profitable without evidence.',
  ],
  campaignGuardrails: [
    'The event title is the only authoritative public event name.',
    'Treat target-audience notes as internal strategy, not public labels.',
    'Use event-specific facts when they conflict with venue defaults.',
    'Keep English and Spanish sections internally consistent.',
    'Make every channel native to its format instead of repeating one paragraph.',
  ],
};

export function getVenueFact(
  id: string,
  profile: VenueProfile = CLUB_BAHIA_VENUE_PROFILE,
): VenueFact | undefined {
  return profile.facts.find((fact) => fact.id === id);
}

export function venueGenerationContext(
  profile: VenueProfile = CLUB_BAHIA_VENUE_PROFILE,
): VenueGenerationContext {
  const verifiedFacts = Object.fromEntries(
    profile.facts
      .filter((fact) => fact.status === 'verified')
      .map((fact) => [fact.id, fact.value]),
  );

  return {
    verifiedFacts,
    eventSpecificFacts: profile.facts
      .filter((fact) => fact.status === 'event-specific')
      .map((fact) => `${fact.label}: ${fact.value}. ${fact.notes ?? ''}`.trim()),
    brandVoice: profile.brandVoice,
    preferredCallsToAction: profile.preferredCallsToAction,
    prohibitedClaims: profile.prohibitedClaims,
    campaignGuardrails: profile.campaignGuardrails,
  };
}
