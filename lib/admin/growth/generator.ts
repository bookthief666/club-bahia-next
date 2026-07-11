import type { OperationsEvent } from '@/lib/admin/domain';
import { addDays, eventLocalDate, localDateToVenueDate } from '@/lib/admin/date';
import type {
  CampaignBrief,
  CampaignContentItem,
  CampaignGenerator,
  CampaignMilestone,
} from './domain';

function scheduledIso(event: OperationsEvent, daysBefore: number, hour: number) {
  const eventDate = eventLocalDate(event.startsAt);
  return localDateToVenueDate(addDays(eventDate, -daysBefore), hour).toISOString();
}

export function buildFixtureCampaign(
  event: OperationsEvent,
  brief: CampaignBrief,
): {
  content: CampaignContentItem[];
  milestones: CampaignMilestone[];
  readinessScore: number;
} {
  const theme = brief.theme.trim() || event.title;
  const audience = brief.targetAudience.trim() || 'music lovers across Los Angeles';
  const offer = brief.offer.trim() || 'Reserve your night at Club Bahia';
  const tone = brief.tone.trim() || 'energetic, stylish, and welcoming';
  const shortHook = `${theme} takes over Club Bahia.`;

  const content: CampaignContentItem[] = [
    {
      id: 'website',
      channel: 'website',
      title: 'Website event description',
      status: 'draft',
      publishAt: scheduledIso(event, 14, 12),
      callToAction: offer,
      body: `${event.title} brings ${theme.toLowerCase()} to Club Bahia. Expect a ${tone} night built for ${audience}. ${event.concept} ${offer}.`,
    },
    {
      id: 'instagram-feed',
      channel: 'instagram-feed',
      title: 'Instagram launch caption',
      status: 'draft',
      publishAt: scheduledIso(event, 12, 18),
      callToAction: offer,
      assetPrompt: `Editorial nightlife flyer for ${event.title}, ${theme}, dark tropical noir, warm amber light, high contrast, premium club photography, space for event title and date`,
      body: `${shortHook}\n\n${event.concept}\n\n${offer}. Tag the person you are bringing.\n\n#ClubBahia #EchoPark #LosAngelesNightlife`,
    },
    {
      id: 'instagram-story',
      channel: 'instagram-story',
      title: 'Story countdown sequence',
      status: 'draft',
      publishAt: scheduledIso(event, 7, 17),
      callToAction: 'Tap for details',
      body: `${event.title}\n${theme}\nOne week away.\n${offer}.`,
    },
    {
      id: 'reel',
      channel: 'reel',
      title: '15-second Reel script',
      status: 'draft',
      publishAt: scheduledIso(event, 5, 18),
      callToAction: offer,
      assetPrompt: `15-second vertical nightlife teaser, fast cuts of Club Bahia exterior, dance floor lights, crowd silhouettes, performers, kinetic title cards for ${event.title}, end card with date and reservation CTA`,
      body: `0–3s: Club Bahia exterior and title.\n3–9s: Music, crowd, and performer cuts.\n9–12s: “${theme} in Echo Park.”\n12–15s: Date, doors, and “${offer}.”`,
    },
    {
      id: 'facebook',
      channel: 'facebook',
      title: 'Facebook event copy',
      status: 'draft',
      publishAt: scheduledIso(event, 14, 12),
      callToAction: offer,
      body: `${event.title} at Club Bahia: ${event.concept} Designed for ${audience}, with a ${tone} atmosphere. ${offer}.`,
    },
    {
      id: 'email',
      channel: 'email',
      title: 'Email announcement',
      status: 'draft',
      publishAt: scheduledIso(event, 7, 10),
      callToAction: offer,
      body: `Subject: ${event.title} is coming to Club Bahia\n\n${shortHook} ${event.concept}\n\n${offer}.`,
    },
    {
      id: 'sms',
      channel: 'sms',
      title: 'Day-before SMS',
      status: 'draft',
      publishAt: scheduledIso(event, 1, 17),
      callToAction: offer,
      body: `${event.title} is tomorrow at Club Bahia. ${offer}. Reply STOP to opt out.`,
    },
  ];

  const milestones: CampaignMilestone[] = content.map((item) => ({
    id: `milestone-${item.id}`,
    title: `Approve and schedule ${item.title.toLowerCase()}`,
    dueAt: item.publishAt ?? event.startsAt,
    status: 'ready',
    channel: item.channel,
    contentItemId: item.id,
  }));

  return { content, milestones, readinessScore: 58 };
}

export class FixtureCampaignGenerator implements CampaignGenerator {
  async generate(event: OperationsEvent, brief: CampaignBrief) {
    return buildFixtureCampaign(event, brief);
  }
}
