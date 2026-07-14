export type VenueFactStatus = 'verified' | 'event-specific' | 'unverified';

export interface VenueFact {
  id: string;
  label: string;
  value: string;
  status: VenueFactStatus;
  source: string;
  notes?: string;
}

export interface VenueBrandVoice {
  qualities: string[];
  preferredLanguage: string[];
  avoidLanguage: string[];
}

export interface VenueProfile {
  id: string;
  name: string;
  facts: VenueFact[];
  brandVoice: VenueBrandVoice;
  preferredCallsToAction: string[];
  prohibitedClaims: string[];
  campaignGuardrails: string[];
}

export interface VenueGenerationContext {
  verifiedFacts: Record<string, string>;
  eventSpecificFacts: string[];
  brandVoice: VenueBrandVoice;
  preferredCallsToAction: string[];
  prohibitedClaims: string[];
  campaignGuardrails: string[];
}
