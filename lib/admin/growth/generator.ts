import type { OperationsEvent } from '@/lib/admin/domain';
import { addDays, eventLocalDate, localDateToVenueDate } from '@/lib/admin/date';
import { getVenueFact } from '@/lib/admin/venue-intelligence/profile';
import type {
  CampaignBrief,
  CampaignChannel,
  CampaignContentItem,
  CampaignGenerator,
  CampaignHashtagGroups,
  CampaignLanguage,
  CampaignMilestone,
  CampaignStructuredContent,
  PublishingMode,
} from './domain';

function scheduledIso(event: OperationsEvent, daysBefore: number, hour: number): string {
  const eventDate = eventLocalDate(event.startsAt);
  return localDateToVenueDate(addDays(eventDate, -daysBefore), hour).toISOString();
}

function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function sentence(value: string): string {
  const next = clean(value);
  if (!next) return '';
  return /[.!?]$/.test(next) ? next : `${next}.`;
}

function joinLanguage(
  english: string,
  spanish: string,
  language: CampaignLanguage,
  compact = false,
): string {
  if (language === 'spanish') return spanish;
  if (language === 'bilingual') {
    return compact ? `${english} / ${spanish}` : `${english}\n\n— Español —\n\n${spanish}`;
  }
  return english;
}

function publishingModeFor(channel: CampaignChannel): PublishingMode {
  return channel === 'website' ? 'automatic' : 'manual';
}

function buildDetails(brief: CampaignBrief, spanish = false): string {
  const details = [
    brief.performers
      ? `${spanish ? 'Con' : 'Featuring'} ${clean(brief.performers)}`
      : '',
    brief.genres
      ? `${spanish ? 'Música' : 'Music'}: ${clean(brief.genres)}`
      : '',
    brief.doorsTime
      ? `${spanish ? 'Puertas' : 'Doors'}: ${clean(brief.doorsTime)}`
      : '',
    brief.admission
      ? `${spanish ? 'Entrada' : 'Admission'}: ${clean(brief.admission)}`
      : '',
    brief.ageRestriction ? clean(brief.ageRestriction) : '',
    brief.foodDrinkSpecial ? clean(brief.foodDrinkSpecial) : '',
  ].filter(Boolean);

  return details.join(' · ');
}

function hashtagGroups(brief: CampaignBrief): CampaignHashtagGroups {
  const genreTags = clean(brief.genres)
    .split(',')
    .map((genre) => genre.trim().replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 4)
    .map((genre) => `#${genre}`);

  return {
    branded: ['#ClubBahia', '#BahiaSunset'],
    localDiscovery: ['#EchoPark', '#LosAngelesNightlife', '#SunsetBoulevard'],
    musicCommunity: genreTags,
  };
}

function structuredWebsite(
  event: OperationsEvent,
  body: string,
  attraction: string,
): CampaignStructuredContent {
  return {
    primaryHook: `${event.title} at Club Bahia`,
    shortCaption: sentence(attraction),
    standardCaption: body,
    longCaption: body,
  };
}

function buildContentItems(
  event: OperationsEvent,
  brief: CampaignBrief,
): CampaignContentItem[] {
  const theme = clean(brief.theme) || event.title;
  const attraction = clean(brief.mainAttraction) || clean(event.concept) || theme;
  const offer = clean(brief.offer) || 'Reserve your night';
  const verifiedAddress = getVenueFact('address')?.value ?? 'Club Bahia, Los Angeles';
  const address = clean(brief.address) || verifiedAddress;
  const reservationUrl = clean(brief.reservationUrl);
  const detailsEn = buildDetails(brief);
  const detailsEs = buildDetails(brief, true);
  const targetAudience = clean(brief.targetAudience) || 'Los Angeles nightlife audiences';
  const hashtags = hashtagGroups(brief);
  const now = new Date().toISOString();

  const websiteEn = [
    `${event.title} comes to Club Bahia for ${attraction}.`,
    brief.performers ? `Featuring ${clean(brief.performers)}.` : '',
    brief.genres ? `Move all night to ${clean(brief.genres)}.` : '',
    detailsEn ? `${detailsEn}.` : '',
    `${address}.`,
    `${offer}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter(Boolean).join(' ');

  const websiteEs = [
    `${event.title} llega a Club Bahia con ${attraction}.`,
    brief.performers ? `Con ${clean(brief.performers)}.` : '',
    brief.genres ? `Baila toda la noche con ${clean(brief.genres)}.` : '',
    detailsEs ? `${detailsEs}.` : '',
    `${address}.`,
    `${offer}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter(Boolean).join(' ');

  const instagramHookEn = `${event.title} is taking over Club Bahia.`;
  const instagramHookEs = `${event.title} llega a Club Bahia.`;
  const instagramEn = [
    instagramHookEn,
    sentence(attraction),
    detailsEn,
    `${offer}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    'Tag the person joining you.',
    [...hashtags.branded, ...hashtags.localDiscovery, ...hashtags.musicCommunity].join(' '),
  ].filter(Boolean).join('\n\n');

  const instagramEs = [
    instagramHookEs,
    sentence(attraction),
    detailsEs,
    `${offer}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    'Etiqueta a la persona que viene contigo.',
    [...hashtags.branded, '#VidaNocturnaLA', ...hashtags.musicCommunity].join(' '),
  ].filter(Boolean).join('\n\n');

  const storyEn = [
    event.title,
    attraction,
    detailsEn || 'One night only at Club Bahia',
    offer,
  ].join('\n');

  const storyEs = [
    event.title,
    attraction,
    detailsEs || 'Una sola noche en Club Bahia',
    offer,
  ].join('\n');

  const reelEn = [
    `0–3s: Club Bahia exterior and ${event.title} title card.`,
    `3–8s: Fast cuts that sell ${attraction}.`,
    brief.performers ? `8–11s: Feature ${clean(brief.performers)}.` : '8–11s: Crowd, lights, and dance-floor energy.',
    `11–15s: Event details and “${offer}.”`,
  ].join('\n');

  const reelEs = [
    `0–3s: Exterior de Club Bahia y título de ${event.title}.`,
    `3–8s: Cortes rápidos que presenten ${attraction}.`,
    brief.performers ? `8–11s: Presentar a ${clean(brief.performers)}.` : '8–11s: Público, luces y energía de la pista.',
    `11–15s: Detalles del evento y “${offer}.”`,
  ].join('\n');

  const facebookEn = [
    `${event.title} at Club Bahia`,
    sentence(attraction),
    detailsEn,
    `${address}.`,
    `${offer}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter(Boolean).join('\n\n');

  const facebookEs = [
    `${event.title} en Club Bahia`,
    sentence(attraction),
    detailsEs,
    `${address}.`,
    `${offer}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter(Boolean).join('\n\n');

  const emailSubjectEn = `${event.title} is coming to Club Bahia`;
  const emailSubjectEs = `${event.title} llega a Club Bahia`;
  const emailEn = [
    `Subject: ${emailSubjectEn}`,
    '',
    sentence(attraction),
    detailsEn,
    `${offer}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter((part, index) => part || index === 1).join('\n\n');

  const emailEs = [
    `Asunto: ${emailSubjectEs}`,
    '',
    sentence(attraction),
    detailsEs,
    `${offer}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter((part, index) => part || index === 1).join('\n\n');

  const smsEn = `${event.title} is tomorrow at Club Bahia. ${offer}${reservationUrl ? `: ${reservationUrl}` : ''}. Reply STOP to opt out.`;
  const smsEs = `${event.title} es mañana en Club Bahia. ${offer}${reservationUrl ? `: ${reservationUrl}` : ''}. Responde STOP para salir.`;

  const websiteBody = joinLanguage(websiteEn, websiteEs, brief.language);
  const instagramBody = joinLanguage(instagramEn, instagramEs, brief.language);
  const storyBody = joinLanguage(storyEn, storyEs, brief.language);
  const reelBody = joinLanguage(reelEn, reelEs, brief.language);
  const facebookBody = joinLanguage(facebookEn, facebookEs, brief.language);
  const emailBody = joinLanguage(emailEn, emailEs, brief.language);
  const smsBody = joinLanguage(smsEn, smsEs, brief.language, true);

  return [
    {
      id: 'website',
      channel: 'website',
      title: 'Website event description',
      status: 'draft',
      publishingMode: publishingModeFor('website'),
      publishAt: scheduledIso(event, 14, 12),
      callToAction: offer,
      body: websiteBody,
      structured: structuredWebsite(event, websiteBody, attraction),
      updatedAt: now,
    },
    {
      id: 'instagram-feed',
      channel: 'instagram-feed',
      title: 'Instagram launch caption',
      status: 'draft',
      publishingMode: publishingModeFor('instagram-feed'),
      publishAt: scheduledIso(event, 12, 18),
      callToAction: offer,
      assetPrompt: `Editorial nightlife flyer for ${event.title}; ${theme}; ${attraction}; dark tropical noir; warm amber light; premium club photography; strong hierarchy for title, date, doors, and call to action; aimed at ${targetAudience}`,
      body: instagramBody,
      structured: {
        primaryHook: joinLanguage(instagramHookEn, instagramHookEs, brief.language, true),
        alternativeHooks: [
          `${event.title}: one night at Club Bahia`,
          `${attraction} at Club Bahia`,
        ],
        shortCaption: joinLanguage(
          `${instagramHookEn} ${offer}.`,
          `${instagramHookEs} ${offer}.`,
          brief.language,
        ),
        standardCaption: instagramBody,
        longCaption: instagramBody,
        hashtags,
        altText: `Promotional creative for ${event.title} at Club Bahia featuring ${attraction}.`,
      },
      updatedAt: now,
    },
    {
      id: 'instagram-story',
      channel: 'instagram-story',
      title: 'Story countdown sequence',
      status: 'draft',
      publishingMode: publishingModeFor('instagram-story'),
      publishAt: scheduledIso(event, 7, 17),
      callToAction: 'Tap for details',
      body: storyBody,
      structured: {
        primaryHook: event.title,
        storyFrames: [
          { frame: 1, text: event.title, visualDirection: 'Use the strongest event image or title card.' },
          { frame: 2, text: attraction, visualDirection: 'Show atmosphere, talent, or dance-floor energy.' },
          { frame: 3, text: detailsEn || detailsEs || 'One night at Club Bahia', interaction: 'Add a countdown sticker.' },
          { frame: 4, text: offer, interaction: 'Add the reservation link sticker.' },
        ],
        altText: `Instagram Story sequence for ${event.title} at Club Bahia.`,
      },
      updatedAt: now,
    },
    {
      id: 'reel',
      channel: 'reel',
      title: '15-second Reel script',
      status: 'draft',
      publishingMode: publishingModeFor('reel'),
      publishAt: scheduledIso(event, 5, 18),
      callToAction: offer,
      assetPrompt: `15-second vertical nightlife teaser for ${event.title}; fast cuts of Club Bahia exterior, dance floor, performers, food or drink details, and crowd energy; kinetic title cards; end card with date, doors, and ${offer}`,
      body: reelBody,
      structured: {
        primaryHook: `${event.title} at Club Bahia`,
        reelShots: [
          { startSecond: 0, endSecond: 3, shot: 'Club Bahia exterior or strongest establishing shot.', onScreenText: event.title },
          { startSecond: 3, endSecond: 8, shot: `Fast atmosphere cuts that communicate ${attraction}.` },
          { startSecond: 8, endSecond: 11, shot: brief.performers ? `Feature ${clean(brief.performers)}.` : 'Show crowd, lights, and dance-floor energy.' },
          { startSecond: 11, endSecond: 15, shot: 'Final event-details card.', onScreenText: offer },
        ],
        reelVoiceover: joinLanguage(
          `${event.title} is coming to Club Bahia. ${offer}.`,
          `${event.title} llega a Club Bahia. ${offer}.`,
          brief.language,
          true,
        ),
        reelThumbnailText: event.title,
        altText: `Vertical video promotion for ${event.title} at Club Bahia.`,
      },
      updatedAt: now,
    },
    {
      id: 'facebook',
      channel: 'facebook',
      title: 'Facebook event copy',
      status: 'draft',
      publishingMode: publishingModeFor('facebook'),
      publishAt: scheduledIso(event, 14, 12),
      callToAction: offer,
      body: facebookBody,
      structured: {
        primaryHook: `${event.title} at Club Bahia`,
        standardCaption: facebookBody,
        longCaption: facebookBody,
        hashtags,
      },
      updatedAt: now,
    },
    {
      id: 'email',
      channel: 'email',
      title: 'Email announcement',
      status: 'draft',
      publishingMode: publishingModeFor('email'),
      publishAt: scheduledIso(event, 7, 10),
      callToAction: offer,
      body: emailBody,
      structured: {
        primaryHook: event.title,
        emailSubjects: [
          joinLanguage(emailSubjectEn, emailSubjectEs, brief.language, true),
          `${event.title}: ${offer}`,
          `Your next night at Club Bahia: ${event.title}`,
        ],
        emailPreheader: joinLanguage(
          `${attraction}. See the details and ${offer.toLowerCase()}.`,
          `${attraction}. Mira los detalles y ${offer.toLowerCase()}.`,
          brief.language,
        ),
        standardCaption: emailBody,
      },
      updatedAt: now,
    },
    {
      id: 'sms',
      channel: 'sms',
      title: 'Day-before SMS',
      status: 'draft',
      publishingMode: publishingModeFor('sms'),
      publishAt: scheduledIso(event, 1, 17),
      callToAction: offer,
      body: smsBody,
      structured: {
        primaryHook: event.title,
        smsVariants: [
          smsBody,
          joinLanguage(
            `${event.title} at Club Bahia is almost here. ${offer}${reservationUrl ? `: ${reservationUrl}` : ''}. Reply STOP to opt out.`,
            `${event.title} en Club Bahia ya casi llega. ${offer}${reservationUrl ? `: ${reservationUrl}` : ''}. Responde STOP para salir.`,
            brief.language,
            true,
          ),
        ],
      },
      updatedAt: now,
    },
  ];
}

export function buildFixtureCampaign(
  event: OperationsEvent,
  brief: CampaignBrief,
): {
  content: CampaignContentItem[];
  milestones: CampaignMilestone[];
  readinessScore: number;
} {
  const content = buildContentItems(event, brief);
  const milestones: CampaignMilestone[] = content.map((item) => ({
    id: `milestone-${item.id}`,
    title: `Review ${item.title.toLowerCase()}`,
    dueAt: item.publishAt ?? event.startsAt,
    status: 'todo',
    channel: item.channel,
    contentItemId: item.id,
  }));

  return { content, milestones, readinessScore: 45 };
}

export class FixtureCampaignGenerator implements CampaignGenerator {
  async generate(event: OperationsEvent, brief: CampaignBrief) {
    return buildFixtureCampaign(event, brief);
  }

  async generateItem(
    event: OperationsEvent,
    brief: CampaignBrief,
    channel: CampaignChannel,
  ): Promise<CampaignContentItem> {
    const item = buildContentItems(event, brief).find((candidate) => candidate.channel === channel);
    if (!item) throw new Error(`Unsupported campaign channel: ${channel}`);
    return item;
  }
}
