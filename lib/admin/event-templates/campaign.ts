import type { OperationsEvent } from '@/lib/admin/domain';
import type { CampaignBrief } from '@/lib/admin/growth/domain';

function eventValue(primary: string | undefined, fallback = ''): string {
  return primary?.trim() || fallback.trim();
}

export function buildInitialCampaignBrief(
  event: OperationsEvent,
  base: CampaignBrief,
): CampaignBrief {
  const template = event.promotionTemplate;
  return {
    ...base,
    theme: event.title,
    targetAudience:
      template?.targetAudience ||
      base.targetAudience ||
      'Club Bahia regulars and nearby Los Angeles nightlife audiences',
    tone: template?.tone || base.tone,
    offer: template?.offer || base.offer,
    language: template?.language || base.language,
    performers: eventValue(event.performers, template?.performers),
    genres: eventValue(event.genres, template?.genres),
    admission: eventValue(event.admission, template?.admission),
    ageRestriction: eventValue(
      event.ageRestriction,
      template?.ageRestriction || base.ageRestriction,
    ),
    reservationUrl: eventValue(event.reservationUrl, base.reservationUrl),
    mainAttraction: event.concept,
  };
}
