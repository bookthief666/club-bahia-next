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

function spanishOffer(offer: string): string {
  const normalized = clean(offer).toLowerCase();
  if (!normalized) return 'Reserva tu noche';
  if (normalized.includes('friday')) return 'Reserva tu viernes';
  if (normalized.includes('saturday')) return 'Reserva tu sábado';
  if (normalized.includes('ticket')) return 'Compra tus boletos';
  if (normalized.includes('learn more')) return 'Conoce los detalles';
  if (normalized.includes('reserve')) return 'Reserva tu noche';
  if (normalized.includes('book')) return 'Haz tu reservación';
  return 'Reserva ahora';
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

function uniqueHashtags(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim();
    if (!normalized || !normalized.startsWith('#')) return false;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hashtagGroups(
  event: OperationsEvent,
  brief: CampaignBrief,
): CampaignHashtagGroups {
  const genreTags = clean(brief.genres)
    .split(',')
    .map((genre) => genre.trim().replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 4)
    .map((genre) => `#${genre}`);
  const template = event.promotionTemplate?.hashtags;

  return {
    branded: uniqueHashtags([
      ...(template?.branded ?? []),
      '#ClubBahia',
      '#BahiaSunset',
    ]).slice(0, 2),
    localDiscovery: uniqueHashtags([
      ...(template?.localDiscovery ?? []),
      '#EchoPark',
      '#LosAngelesNightlife',
      '#SunsetBoulevard',
    ]).slice(0, 2),
    musicCommunity: uniqueHashtags([
      ...(template?.musicCommunity ?? []),
      ...genreTags,
    ]).slice(0, 3),
  };
}

function allHashtags(groups: CampaignHashtagGroups): string[] {
  return uniqueHashtags([
    ...groups.branded,
    ...groups.localDiscovery,
    ...groups.musicCommunity,
  ]);
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

function eventGroundedBrief(
  event: OperationsEvent,
  brief: CampaignBrief,
): CampaignBrief {
  const template = event.promotionTemplate;
  return {
    ...brief,
    performers:
      event.performers?.trim() || brief.performers || template?.performers || '',
    genres: event.genres?.trim() || brief.genres || template?.genres || '',
    admission:
      event.admission?.trim() || brief.admission || template?.admission || '',
    ageRestriction:
      event.ageRestriction?.trim() ||
      brief.ageRestriction ||
      template?.ageRestriction ||
      '',
    reservationUrl:
      event.reservationUrl?.trim() || brief.reservationUrl || '',
    mainAttraction: event.concept.trim() || brief.mainAttraction,
  };
}

function buildContentItems(
  event: OperationsEvent,
  inputBrief: CampaignBrief,
): CampaignContentItem[] {
  const brief = eventGroundedBrief(event, inputBrief);
  const theme = clean(brief.theme) || event.title;
  const attraction = clean(brief.mainAttraction) || clean(event.concept) || theme;
  const offer = clean(brief.offer) || 'Reserve your night';
  const offerEs = spanishOffer(offer);
  const verifiedAddress = getVenueFact('address')?.value ?? 'Club Bahia, Los Angeles';
  const address = clean(brief.address) || verifiedAddress;
  const reservationUrl = clean(brief.reservationUrl);
  const detailsEn = buildDetails(brief);
  const detailsEs = buildDetails(brief, true);
  const targetAudience = clean(brief.targetAudience) || 'Los Angeles nightlife audiences';
  const hashtags = hashtagGroups(event, brief);
  const hashtagLine = allHashtags(hashtags).join(' ');
  const visualDirection = event.promotionTemplate?.visualDirection;
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
    `${offerEs}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter(Boolean).join(' ');

  const instagramHookEn = `${event.title} is taking over Club Bahia.`;
  const instagramHookEs = `${event.title} llega a Club Bahia.`;
  const instagramShortEn = [
    instagramHookEn,
    detailsEn,
    `${offer}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    hashtagLine,
  ].filter(Boolean).join('\n\n');
  const instagramShortEs = [
    instagramHookEs,
    detailsEs,
    `${offerEs}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    hashtagLine,
  ].filter(Boolean).join('\n\n');
  const instagramStandardEn = [
    instagramHookEn,
    sentence(attraction),
    detailsEn,
    `${offer}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    'Tag the person joining you.',
    hashtagLine,
  ].filter(Boolean).join('\n\n');
  const instagramStandardEs = [
    instagramHookEs,
    sentence(attraction),
    detailsEs,
    `${offerEs}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    'Etiqueta a la persona que viene contigo.',
    hashtagLine,
  ].filter(Boolean).join('\n\n');
  const instagramLongEn = [
    instagramHookEn,
    sentence(attraction),
    brief.performers ? `The night features ${clean(brief.performers)}.` : '',
    brief.genres ? `Expect ${clean(brief.genres)} throughout the night.` : '',
    detailsEn,
    `${offer}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    'Send this to your crew and make the plan now.',
    hashtagLine,
  ].filter(Boolean).join('\n\n');
  const instagramLongEs = [
    instagramHookEs,
    sentence(attraction),
    brief.performers ? `La noche presenta a ${clean(brief.performers)}.` : '',
    brief.genres ? `Disfruta ${clean(brief.genres)} durante la noche.` : '',
    detailsEs,
    `${offerEs}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    'Compártelo con tu grupo y hagan el plan.',
    hashtagLine,
  ].filter(Boolean).join('\n\n');

  const storyEn = [
    event.title,
    attraction,
    detailsEn || 'One night at Club Bahia',
    offer,
  ].join('\n');
  const storyEs = [
    event.title,
    attraction,
    detailsEs || 'Una noche en Club Bahia',
    offerEs,
  ].join('\n');

  const reelEn = [
    `0–3s: Open on the strongest movement or live-performance shot. On-screen text: “${event.title}.”`,
    `3–8s: Fast cuts that communicate ${attraction}.`,
    brief.performers
      ? `8–11s: Feature ${clean(brief.performers)}.`
      : '8–11s: Show crowd, lights, and dance-floor energy.',
    `11–15s: End card with verified event details and “${offer}.”`,
  ].join('\n');
  const reelEs = [
    `0–3s: Abre con la toma más fuerte de movimiento o música en vivo. Texto: “${event.title}.”`,
    `3–8s: Cortes rápidos que comuniquen ${attraction}.`,
    brief.performers
      ? `8–11s: Presenta a ${clean(brief.performers)}.`
      : '8–11s: Muestra al público, las luces y la pista.',
    `11–15s: Tarjeta final con los datos confirmados y “${offerEs}.”`,
  ].join('\n');
  const instagramReelCaptionEn = [
    `${event.title} at Club Bahia.`,
    sentence(attraction),
    `${offer}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    hashtagLine,
  ].filter(Boolean).join('\n\n');
  const instagramReelCaptionEs = [
    `${event.title} en Club Bahia.`,
    sentence(attraction),
    `${offerEs}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    hashtagLine,
  ].filter(Boolean).join('\n\n');
  const tiktokCaptionEn = [
    `Your next night out: ${event.title}.`,
    detailsEn || attraction,
    `${offer}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    allHashtags(hashtags).slice(0, 5).join(' '),
  ].filter(Boolean).join('\n');
  const tiktokCaptionEs = [
    `Tu próxima salida: ${event.title}.`,
    detailsEs || attraction,
    `${offerEs}${reservationUrl ? ` → ${reservationUrl}` : ''}`,
    allHashtags(hashtags).slice(0, 5).join(' '),
  ].filter(Boolean).join('\n');

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
    `${offerEs}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
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
    `${offerEs}${reservationUrl ? `: ${reservationUrl}` : ''}.`,
  ].filter((part, index) => part || index === 1).join('\n\n');

  const smsEn = `${event.title} is tomorrow at Club Bahia. ${offer}${reservationUrl ? `: ${reservationUrl}` : ''}. Reply STOP to opt out.`;
  const smsEs = `${event.title} es mañana en Club Bahia. ${offerEs}${reservationUrl ? `: ${reservationUrl}` : ''}. Responde STOP para salir.`;
  const smsSoonEn = `${event.title} at Club Bahia is almost here. ${offer}${reservationUrl ? `: ${reservationUrl}` : ''}. Reply STOP to opt out.`;
  const smsSoonEs = `${event.title} en Club Bahia ya casi llega. ${offerEs}${reservationUrl ? `: ${reservationUrl}` : ''}. Responde STOP para salir.`;

  const websiteBody = joinLanguage(websiteEn, websiteEs, brief.language);
  const instagramShort = joinLanguage(
    instagramShortEn,
    instagramShortEs,
    brief.language,
  );
  const instagramStandard = joinLanguage(
    instagramStandardEn,
    instagramStandardEs,
    brief.language,
  );
  const instagramLong = joinLanguage(
    instagramLongEn,
    instagramLongEs,
    brief.language,
  );
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
      assetPrompt: [
        `Editorial nightlife flyer for ${event.title}`,
        theme,
        attraction,
        visualDirection ||
          'dark tropical noir; warm amber light; premium club photography',
        'clear hierarchy for title, date, doors, and call to action',
        'leave generous readable negative space for event text',
        `designed for ${targetAudience}`,
      ].join('; '),
      body: instagramStandard,
      structured: {
        primaryHook: joinLanguage(
          instagramHookEn,
          instagramHookEs,
          brief.language,
          true,
        ),
        alternativeHooks: [
          `${event.title}: one night at Club Bahia`,
          `${attraction} at Club Bahia`,
        ],
        shortCaption: instagramShort,
        standardCaption: instagramStandard,
        longCaption: instagramLong,
        hashtags,
        altText: `Promotional event artwork for ${event.title} at Club Bahia, presenting ${attraction}.`,
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
        shortCaption: storyBody,
        storyFrames: [
          {
            frame: 1,
            text: event.title,
            visualDirection:
              visualDirection || 'Use the strongest event image or title card.',
            interaction: '',
          },
          {
            frame: 2,
            text: attraction,
            visualDirection: 'Show atmosphere, talent, or dance-floor energy.',
            interaction: '',
          },
          {
            frame: 3,
            text: detailsEn || detailsEs || 'One night at Club Bahia',
            visualDirection: 'Keep verified details large and readable.',
            interaction: 'Add a countdown sticker.',
          },
          {
            frame: 4,
            text: joinLanguage(offer, offerEs, brief.language, true),
            visualDirection: 'Use the flyer or strongest closing image.',
            interaction: reservationUrl
              ? 'Add the reservation link sticker.'
              : 'Add a profile or message CTA.',
          },
        ],
        altText: `Instagram Story sequence promoting ${event.title} at Club Bahia.`,
      },
      updatedAt: now,
    },
    {
      id: 'reel',
      channel: 'reel',
      title: 'Instagram Reel and TikTok package',
      status: 'draft',
      publishingMode: publishingModeFor('reel'),
      publishAt: scheduledIso(event, 5, 18),
      callToAction: offer,
      assetPrompt: [
        `15-second vertical nightlife teaser for ${event.title}`,
        visualDirection ||
          'fast cuts of Club Bahia exterior, dance floor, performers, and crowd energy',
        'open with visible movement in the first second',
        'use kinetic but readable title cards inside mobile safe zones',
        `end card with verified event details and ${offer}`,
      ].join('; '),
      body: reelBody,
      structured: {
        primaryHook: `${event.title} at Club Bahia`,
        reelShots: [
          {
            startSecond: 0,
            endSecond: 3,
            shot: 'Strongest motion, performance, or dance-floor opening shot.',
            onScreenText: event.title,
          },
          {
            startSecond: 3,
            endSecond: 8,
            shot: `Fast atmosphere cuts that communicate ${attraction}.`,
          },
          {
            startSecond: 8,
            endSecond: 11,
            shot: brief.performers
              ? `Feature ${clean(brief.performers)}.`
              : 'Show crowd, lights, and dance-floor energy.',
          },
          {
            startSecond: 11,
            endSecond: 15,
            shot: 'Final verified event-details card.',
            onScreenText: joinLanguage(offer, offerEs, brief.language, true),
          },
        ],
        reelVoiceover: joinLanguage(
          `${event.title} is coming to Club Bahia. ${offer}.`,
          `${event.title} llega a Club Bahia. ${offerEs}.`,
          brief.language,
          true,
        ),
        reelThumbnailText: event.title,
        shortVideoVariants: [
          {
            platform: 'instagram-reel',
            caption: joinLanguage(
              instagramReelCaptionEn,
              instagramReelCaptionEs,
              brief.language,
            ),
            title: event.title,
            hashtags: allHashtags(hashtags),
            postingNotes:
              'Use the strongest readable cover frame and preserve event details inside Reel-safe margins.',
          },
          {
            platform: 'tiktok',
            caption: joinLanguage(
              tiktokCaptionEn,
              tiktokCaptionEs,
              brief.language,
            ),
            title: `${event.title} at Club Bahia`,
            hashtags: allHashtags(hashtags).slice(0, 5),
            postingNotes:
              'Lead with movement immediately; use a conversational opening and avoid duplicating the Instagram caption.',
          },
        ],
        altText: `Vertical video promotion for ${event.title} at Club Bahia featuring venue atmosphere and ${attraction}.`,
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
        shortCaption: joinLanguage(
          `${event.title} at Club Bahia. ${offer}.`,
          `${event.title} en Club Bahia. ${offerEs}.`,
          brief.language,
        ),
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
          joinLanguage(
            `${event.title}: ${offer}`,
            `${event.title}: ${offerEs}`,
            brief.language,
            true,
          ),
          joinLanguage(
            `Your next night at Club Bahia: ${event.title}`,
            `Tu próxima noche en Club Bahia: ${event.title}`,
            brief.language,
            true,
          ),
        ],
        emailPreheader: joinLanguage(
          `${attraction}. See the details and ${offer.toLowerCase()}.`,
          `${attraction}. Mira los detalles y ${offerEs.toLowerCase()}.`,
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
          joinLanguage(smsSoonEn, smsSoonEs, brief.language, true),
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
    const item = buildContentItems(event, brief).find(
      (candidate) => candidate.channel === channel,
    );
    if (!item) throw new Error(`Unsupported campaign channel: ${channel}`);
    return item;
  }
}
