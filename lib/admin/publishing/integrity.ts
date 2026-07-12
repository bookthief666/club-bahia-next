import type { EventAsset } from '@/lib/admin/assets/domain';
import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignChannel,
  CampaignContentItem,
  EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';
import type { EventPostAssembly } from '@/lib/admin/publishing/domain';
import type { EventPublishingExecution } from '@/lib/admin/publishing/execution-domain';

export type CampaignIntegritySeverity = 'blocker' | 'warning' | 'tip';

export interface CampaignIntegrityIssue {
  id: string;
  severity: CampaignIntegritySeverity;
  title: string;
  detail: string;
  channel?: CampaignChannel;
  assetId?: string;
  actionHref?: string;
  actionLabel?: string;
}

export interface CampaignIntegrityReport {
  score: number;
  canPublish: boolean;
  blockers: number;
  warnings: number;
  tips: number;
  issues: CampaignIntegrityIssue[];
}

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const KNOWN_GENRES = [
  'salsa',
  'bachata',
  'cumbia',
  'merengue',
  'reggaeton',
  'latin',
  'goth',
  'darkwave',
  'post-punk',
  'post punk',
  'industrial',
  'synthpop',
  'synth-pop',
  'punk',
  'metal',
  'grindcore',
  'emo',
  'hip-hop',
  'hip hop',
  'house',
  'techno',
  'disco',
  'funk',
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function issue(
  id: string,
  severity: CampaignIntegritySeverity,
  title: string,
  detail: string,
  options: Partial<CampaignIntegrityIssue> = {},
): CampaignIntegrityIssue {
  return { id, severity, title, detail, ...options };
}

function selectedAssets(
  assembly: EventPostAssembly,
  assets: EventAsset[],
): Array<{ asset: EventAsset; channels: CampaignChannel[] }> {
  const map = new Map<string, Set<CampaignChannel>>();
  for (const postPackage of assembly.packages) {
    if (!postPackage.primaryAssetId) continue;
    const channels = map.get(postPackage.primaryAssetId) ?? new Set<CampaignChannel>();
    channels.add(postPackage.channel);
    map.set(postPackage.primaryAssetId, channels);
  }

  return [...map.entries()]
    .map(([assetId, channels]) => {
      const asset = assets.find((item) => item.id === assetId);
      return asset ? { asset, channels: [...channels] } : null;
    })
    .filter(
      (entry): entry is { asset: EventAsset; channels: CampaignChannel[] } =>
        entry !== null,
    );
}

function dateMentions(text: string): Array<{ month: number; day: number }> {
  const matches: Array<{ month: number; day: number }> = [];
  const monthPattern = Object.keys(MONTHS).join('|');
  const regex = new RegExp(`\\b(${monthPattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'gi');
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    const month = MONTHS[match[1].toLowerCase()];
    const day = Number(match[2]);
    if (month && day >= 1 && day <= 31) matches.push({ month, day });
  }
  return matches;
}

function genreMentions(text: string): string[] {
  const normalized = normalize(text);
  return KNOWN_GENRES.filter((genre) => normalized.includes(normalize(genre)));
}

function briefGenreSet(workspace: EventGrowthWorkspace): Set<string> {
  const source = `${workspace.brief.genres} ${workspace.brief.theme} ${workspace.brief.mainAttraction}`;
  return new Set(genreMentions(source).map(normalize));
}

function splitPerformers(value: string): string[] {
  return value
    .split(/,|\s+x\s+|\s+and\s+|\s+&\s+|\//i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function spanishSection(item: CampaignContentItem): string {
  const parts = item.body.split(/—\s*Español\s*—/i);
  return parts.length > 1 ? parts.slice(1).join('\n') : '';
}

function channelsForAssetText(channels: CampaignChannel[]): string {
  return channels.join(', ');
}

export function buildCampaignIntegrityReport({
  event,
  workspace,
  assembly,
  assets,
  execution,
}: {
  event: OperationsEvent;
  workspace: EventGrowthWorkspace;
  assembly: EventPostAssembly;
  assets: EventAsset[];
  execution?: EventPublishingExecution;
}): CampaignIntegrityReport {
  const issues: CampaignIntegrityIssue[] = [];
  const eventDate = new Date(event.startsAt);
  const eventMonth = eventDate.getMonth() + 1;
  const eventDay = eventDate.getDate();
  const briefAge = workspace.brief.ageRestriction.match(/\b(18|21)\+?\b/)?.[1];
  const campaignGenres = briefGenreSet(workspace);
  const performerNames = splitPerformers(workspace.brief.performers);

  const selected = selectedAssets(assembly, assets);
  for (const { asset, channels } of selected) {
    const text = `${asset.name}\n${asset.altText}\n${asset.notes}`;
    const normalizedText = normalize(text);
    const mentionedDates = dateMentions(text);
    const mentionedAge = text.match(/\b(18|21)\+\b/)?.[1];
    const assetGenres = genreMentions(text).map(normalize);

    if (
      mentionedDates.length > 0 &&
      !mentionedDates.some(
        (mentioned) => mentioned.month === eventMonth && mentioned.day === eventDay,
      )
    ) {
      const first = mentionedDates[0];
      issues.push(
        issue(
          `asset-date-${asset.id}`,
          'blocker',
          'The assigned media appears to show a different event date',
          `“${asset.name}” mentions ${first.month}/${first.day}, while this event is scheduled for ${eventMonth}/${eventDay}. Check the flyer before publishing to ${channelsForAssetText(channels)}.`,
          {
            assetId: asset.id,
            channel: channels[0],
            actionHref: `/admin/events/${event.id}/assets`,
            actionLabel: 'Review event media',
          },
        ),
      );
    }

    if (briefAge && mentionedAge && briefAge !== mentionedAge) {
      issues.push(
        issue(
          `asset-age-${asset.id}`,
          'blocker',
          'Age restriction conflicts with the assigned media',
          `The campaign says ${briefAge}+, but “${asset.name}” appears to say ${mentionedAge}+.`,
          {
            assetId: asset.id,
            channel: channels[0],
            actionHref: `/admin/events/${event.id}/assets`,
            actionLabel: 'Review event media',
          },
        ),
      );
    }

    if (
      assetGenres.length > 0 &&
      campaignGenres.size > 0 &&
      !assetGenres.some((genre) => campaignGenres.has(genre))
    ) {
      issues.push(
        issue(
          `asset-genre-${asset.id}`,
          'blocker',
          'The assigned media promotes a different music concept',
          `The campaign emphasizes ${workspace.brief.genres || workspace.brief.theme}, while “${asset.name}” is described as ${assetGenres.join(', ')}.`,
          {
            assetId: asset.id,
            channel: channels[0],
            actionHref: `/admin/events/${event.id}/assets`,
            actionLabel: 'Choose matching media',
          },
        ),
      );
    }

    if (
      performerNames.length > 0 &&
      /\b(featuring|feat\.?|with|dj)\b/i.test(text) &&
      !performerNames.some((performer) =>
        normalizedText.includes(normalize(performer)),
      )
    ) {
      issues.push(
        issue(
          `asset-performer-${asset.id}`,
          'warning',
          'The performer information may not match the campaign brief',
          `Verify that the names shown in “${asset.name}” match ${workspace.brief.performers}.`,
          {
            assetId: asset.id,
            channel: channels[0],
            actionHref: `/admin/events/${event.id}/assets`,
            actionLabel: 'Check performer names',
          },
        ),
      );
    }

    if (asset.kind === 'image' && !asset.altText.trim()) {
      issues.push(
        issue(
          `missing-alt-${asset.id}`,
          'warning',
          'An assigned image is missing alt text',
          `Add a useful visual description to “${asset.name}” before publishing.`,
          {
            assetId: asset.id,
            channel: channels[0],
            actionHref: `/admin/events/${event.id}/assets`,
            actionLabel: 'Add alt text',
          },
        ),
      );
    }
  }

  for (const item of workspace.content) {
    if (workspace.brief.language === 'bilingual') {
      const spanish = spanishSection(item);
      if (spanish && /\b(reserve now|buy tickets|book now|learn more)\b/i.test(spanish)) {
        issues.push(
          issue(
            `spanish-cta-${item.id}`,
            'blocker',
            'The Spanish section still contains an English call to action',
            'Replace “Reserve now” or similar English CTA language with natural Spanish such as “Reserva ahora.”',
            {
              channel: item.channel,
              actionHref: `/admin/events/${event.id}/growth`,
              actionLabel: 'Edit campaign copy',
            },
          ),
        );
      }
      if (
        spanish &&
        /\b(and late-night|late-night kitchen push|featuring|doors at|the night)\b/i.test(spanish)
      ) {
        issues.push(
          issue(
            `mixed-spanish-${item.id}`,
            'warning',
            'The Spanish section appears partially untranslated',
            'Rewrite the remaining English phrase into natural Spanish before the campaign goes live.',
            {
              channel: item.channel,
              actionHref: `/admin/events/${event.id}/growth`,
              actionLabel: 'Edit campaign copy',
            },
          ),
        );
      }
    }
  }

  const sms = workspace.content.find((item) => item.channel === 'sms');
  if (
    sms &&
    !/\b(reply|text|responde)\s+(stop|alto|cancel|cancelar)\b|\bopt\s*out\b|\bdarse\s+de\s+baja\b/i.test(
      sms.body,
    )
  ) {
    issues.push(
      issue(
        'sms-opt-out',
        'blocker',
        'The SMS is missing opt-out language',
        'Add a clear instruction such as “Reply STOP to opt out” before using this message.',
        {
          channel: 'sms',
          actionHref: `/admin/events/${event.id}/growth`,
          actionLabel: 'Fix SMS copy',
        },
      ),
    );
  }

  const publicCopy = workspace.content.map((item) => item.body).join('\n');
  if (/localhost|127\.0\.0\.1|vercel\.app|git-[a-z0-9-]+-/i.test(publicCopy)) {
    issues.push(
      issue(
        'preview-url',
        'warning',
        'Campaign copy contains a temporary Preview URL',
        'Replace the branch-preview link with Club Bahia’s permanent public reservation or ticket URL before launch.',
        {
          actionHref: `/admin/events/${event.id}/growth`,
          actionLabel: 'Replace temporary link',
        },
      ),
    );
  }

  if (execution) {
    for (const item of execution.items) {
      if (
        item.notes &&
        /\b(h+m+|ye+e+\s*bo+i+|test(?:ing)?|placeholder|lorem|asdf)\b/i.test(item.notes)
      ) {
        issues.push(
          issue(
            `test-note-${item.contentItemId}`,
            'warning',
            'A publishing note looks like test content',
            'Clear temporary notes before exporting or handing the campaign to another person.',
            { channel: item.channel },
          ),
        );
      }
      if (item.status === 'published' && !item.externalUrl?.trim()) {
        issues.push(
          issue(
            `published-url-${item.contentItemId}`,
            'warning',
            'A published item has no live URL recorded',
            'Add the final public post or page URL so campaign results can be audited later.',
            { channel: item.channel },
          ),
        );
      }
    }
  }

  if (!selected.length) {
    issues.push(
      issue(
        'no-selected-media',
        'blocker',
        'No approved campaign media is attached',
        'Prepare the posts and attach the final flyer or video before publishing.',
        {
          actionHref: `/admin/events/${event.id}/publishing`,
          actionLabel: 'Prepare posts',
        },
      ),
    );
  }

  issues.push(
    issue(
      'technical-media-validation',
      'tip',
      'Automatic crop and duration checks are still limited',
      'Visually confirm Story/Reel safe zones, video duration, audio rights, and final mobile playback before publishing.',
      {
        actionHref: `/admin/events/${event.id}/assets`,
        actionLabel: 'Review media',
      },
    ),
  );

  const blockers = issues.filter((item) => item.severity === 'blocker').length;
  const warnings = issues.filter((item) => item.severity === 'warning').length;
  const tips = issues.filter((item) => item.severity === 'tip').length;
  const penalty = blockers * 18 + warnings * 7 + tips * 2;

  return {
    score: Math.max(0, 100 - penalty),
    canPublish: blockers === 0,
    blockers,
    warnings,
    tips,
    issues,
  };
}

export function integrityIssuesForChannel(
  report: CampaignIntegrityReport,
  channel: CampaignChannel,
): CampaignIntegrityIssue[] {
  return report.issues.filter(
    (item) => !item.channel || item.channel === channel,
  );
}
