import { z } from 'zod';

const optionalLabel = z.string().trim().max(180).default('');
const optionalUrl = z.string().trim().max(2000).default('');

export const ReservationAttributionSchema = z.object({
  source: optionalLabel,
  medium: optionalLabel,
  campaign: optionalLabel,
  content: optionalLabel,
  term: optionalLabel,
  referrer: optionalUrl,
  landingPage: optionalUrl,
  firstTouchAt: z.string().datetime().optional(),
});

export type ReservationAttribution = z.infer<
  typeof ReservationAttributionSchema
>;

export function emptyReservationAttribution(): ReservationAttribution {
  return ReservationAttributionSchema.parse({});
}

export function reservationAttributionLabel(
  attribution: ReservationAttribution,
): string {
  if (attribution.source) {
    return [attribution.source, attribution.medium]
      .filter(Boolean)
      .join(' · ');
  }
  if (attribution.referrer) {
    try {
      return new URL(attribution.referrer).hostname.replace(/^www\./, '');
    } catch {
      return 'Referral';
    }
  }
  return 'Direct / unknown';
}

export function trackedReservationHref(options: {
  eventSlug?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}): string {
  const params = new URLSearchParams();
  if (options.eventSlug) params.set('event', options.eventSlug);
  params.set('utm_source', options.source || 'club-bahia-website');
  params.set('utm_medium', options.medium || 'owned');
  if (options.campaign || options.eventSlug) {
    params.set('utm_campaign', options.campaign || options.eventSlug || 'club-bahia');
  }
  if (options.content) params.set('utm_content', options.content);
  if (options.term) params.set('utm_term', options.term);
  return `/reservations?${params.toString()}`;
}
