import type { OperationsEvent } from '@/lib/admin/domain';
import { flattenHashtagGroups } from '@/lib/admin/growth/composer';
import type {
  CampaignChannel,
  CampaignContentItem,
  CampaignQualityIssue,
  CampaignQualityReport,
  EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';

function issue(
  id: string,
  severity: CampaignQualityIssue['severity'],
  title: string,
  detail: string,
  channel?: CampaignChannel,
): CampaignQualityIssue {
  return { id, severity, title, detail, channel };
}

function repeatedPublicLines(workspace: EventGrowthWorkspace): string[] {
  const occurrences = new Map<string, { count: number; original: string }>();

  for (const item of workspace.content) {
    const uniqueLines = new Set(
      item.body
        .split(/\n+/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 28)
        .map((line) => line.toLowerCase()),
    );

    for (const line of uniqueLines) {
      const current = occurrences.get(line);
      occurrences.set(line, {
        count: (current?.count ?? 0) + 1,
        original: current?.original ?? line,
      });
    }
  }

  return [...occurrences.values()]
    .filter((entry) => entry.count >= 3)
    .map((entry) => entry.original)
    .slice(0, 3);
}

function spanishSections(workspace: EventGrowthWorkspace): string {
  return workspace.content
    .map((item) => {
      const parts = item.body.split(/—\s*Español\s*—/i);
      return parts.length > 1 ? parts.slice(1).join('\n') : '';
    })
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
}

function hasOptOut(body: string): boolean {
  return /\b(reply|text|responde)\s+(stop|alto|cancel|cancelar)\b|\bopt\s*out\b|\bdarse\s+de\s+baja\b/i.test(
    body,
  );
}

function normalizedCaption(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function socialVariantChecks(
  item: CampaignContentItem,
  issues: CampaignQualityIssue[],
): void {
  if (item.channel === 'instagram-feed') {
    const variants = [
      item.structured?.shortCaption,
      item.structured?.standardCaption,
      item.structured?.longCaption,
    ].filter((value): value is string => Boolean(value?.trim()));
    const uniqueVariants = new Set(variants.map(normalizedCaption));
    if (uniqueVariants.size < 2) {
      issues.push(
        issue(
          'instagram-caption-choices',
          'info',
          'Instagram needs more useful caption choices',
          'Provide at least two meaningfully different lengths so the manager can choose quickly without regenerating the whole campaign.',
          item.channel,
        ),
      );
    }

    const hashtags = flattenHashtagGroups(item.structured?.hashtags);
    if (hashtags.length < 3 || hashtags.length > 8) {
      issues.push(
        issue(
          'instagram-hashtag-count',
          'warning',
          'Instagram hashtag set needs refinement',
          `The current package contains ${hashtags.length} unique hashtags. Keep the approved set focused at roughly 3–8 relevant tags.`,
          item.channel,
        ),
      );
    }
  }

  if (item.channel === 'instagram-story') {
    const frames = item.structured?.storyFrames ?? [];
    if (frames.length < 4) {
      issues.push(
        issue(
          'story-frame-count',
          'warning',
          'Story sequence is incomplete',
          'Prepare at least four concise frames covering hook, atmosphere or talent, verified details, and action.',
          item.channel,
        ),
      );
    }
    if (frames.some((frame) => frame.text.length > 180)) {
      issues.push(
        issue(
          'story-frame-density',
          'warning',
          'A Story frame is too text-heavy',
          'Shorten the frame so it remains readable on a phone without covering the creative.',
          item.channel,
        ),
      );
    }
  }

  if (item.channel === 'reel') {
    const variants = item.structured?.shortVideoVariants ?? [];
    const instagram = variants.find(
      (variant) => variant.platform === 'instagram-reel',
    );
    const tiktok = variants.find((variant) => variant.platform === 'tiktok');
    if (!instagram) {
      issues.push(
        issue(
          'missing-instagram-reel-caption',
          'error',
          'Instagram Reel caption is missing',
          'Create a platform-specific Instagram Reel caption before approval.',
          item.channel,
        ),
      );
    }
    if (!tiktok) {
      issues.push(
        issue(
          'missing-tiktok-caption',
          'error',
          'TikTok caption is missing',
          'Create a separate TikTok caption before approval.',
          item.channel,
        ),
      );
    }
    if (
      instagram &&
      tiktok &&
      normalizedCaption(instagram.caption) === normalizedCaption(tiktok.caption)
    ) {
      issues.push(
        issue(
          'duplicated-short-video-caption',
          'warning',
          'Instagram and TikTok captions are identical',
          'Keep the shared video, but adapt the hook, length, hashtags, and posting note for each platform.',
          item.channel,
        ),
      );
    }
    if ((item.structured?.reelShots ?? []).length < 4) {
      issues.push(
        issue(
          'short-video-plan',
          'warning',
          'Vertical-video edit plan is incomplete',
          'Include a clear opening hook, atmosphere or talent, verified details, and final action.',
          item.channel,
        ),
      );
    }
  }

  if (
    ['instagram-feed', 'instagram-story', 'reel'].includes(item.channel) &&
    !item.structured?.altText?.trim()
  ) {
    issues.push(
      issue(
        `missing-alt-text-${item.channel}`,
        'info',
        'Accessibility description is missing',
        'Add factual alt text for the approved visual media.',
        item.channel,
      ),
    );
  }
}

export function buildCampaignQualityReport(
  event: OperationsEvent,
  workspace: EventGrowthWorkspace,
): CampaignQualityReport {
  const issues: CampaignQualityIssue[] = [];
  const combinedCopy = workspace.content.map((item) => item.body).join('\n').toLowerCase();
  const internalAudience = workspace.brief.targetAudience.trim().toLowerCase();
  const spanishCopy = spanishSections(workspace);

  if (!combinedCopy.includes(event.title.toLowerCase())) {
    issues.push(
      issue(
        'missing-public-event-name',
        'warning',
        'Public event name is missing from the campaign',
        `Use “${event.title}” consistently. The campaign theme is internal creative direction, not a second event name.`,
      ),
    );
  }

  if (internalAudience.length >= 20 && combinedCopy.includes(internalAudience)) {
    issues.push(
      issue(
        'audience-leak',
        'error',
        'Internal audience strategy appears in public copy',
        'Remove internal targeting language before approval.',
      ),
    );
  }

  if (/\b(goth stuff|goth baddies|lorem ipsum|tbd|placeholder)\b/i.test(combinedCopy)) {
    issues.push(
      issue(
        'rough-placeholder-language',
        'warning',
        'Rough brief language remains in the campaign',
        'Rewrite placeholder or shorthand phrases into audience-ready marketing language.',
      ),
    );
  }

  if (/\b(epic night|unforgettable experience|you do not want to miss|best night ever)\b/i.test(combinedCopy)) {
    issues.push(
      issue(
        'generic-hype-language',
        'info',
        'Generic promotional language remains',
        'Replace empty hype with a concrete performer, sound, atmosphere, verified offer, or reason to attend.',
      ),
    );
  }

  const englishCtaPattern = /\b(reserve now|buy tickets|learn more|book now|reserve your)\b/i;
  if (
    workspace.brief.language === 'spanish' &&
    englishCtaPattern.test(combinedCopy)
  ) {
    issues.push(
      issue(
        'mixed-language-cta',
        'warning',
        'English CTA found in a Spanish-only campaign',
        'Translate the call to action naturally before approval.',
      ),
    );
  }

  if (
    workspace.brief.language === 'bilingual' &&
    englishCtaPattern.test(spanishCopy)
  ) {
    issues.push(
      issue(
        'bilingual-spanish-cta',
        'error',
        'English CTA found inside a Spanish section',
        'Use a natural Spanish call to action such as “Reserva ahora.”',
      ),
    );
  }

  if (
    workspace.brief.language === 'bilingual' &&
    /\b(and late-night|late-night kitchen push|featuring|doors at|the night)\b/i.test(
      spanishCopy,
    )
  ) {
    issues.push(
      issue(
        'partially-untranslated-spanish',
        'warning',
        'Some Spanish sections still contain English phrases',
        'Rewrite the remaining English language into natural Spanish before approval.',
      ),
    );
  }

  const sms = workspace.content.find((item) => item.channel === 'sms');
  if (sms && sms.body.length > 300) {
    issues.push(
      issue(
        'sms-length',
        'error',
        'SMS exceeds 300 characters',
        `The recommended SMS is ${sms.body.length} characters. Choose or edit a shorter variant before sending.`,
        'sms',
      ),
    );
  }

  if (sms && !hasOptOut(sms.body)) {
    issues.push(
      issue(
        'sms-opt-out',
        'error',
        'SMS is missing opt-out language',
        'Add a clear instruction such as “Reply STOP to opt out” before approval.',
        'sms',
      ),
    );
  }

  for (const [index, variant] of (sms?.structured?.smsVariants ?? []).entries()) {
    if (variant.length > 300) {
      issues.push(
        issue(
          `sms-variant-length-${index}`,
          'warning',
          `SMS option ${index + 1} is too long`,
          `This option is ${variant.length} characters. Shorten it to 300 or fewer.`,
          'sms',
        ),
      );
    }
    if (!hasOptOut(variant)) {
      issues.push(
        issue(
          `sms-variant-opt-out-${index}`,
          'error',
          `SMS option ${index + 1} lacks opt-out language`,
          'Every SMS option must preserve the consent and opt-out instruction.',
          'sms',
        ),
      );
    }
  }

  const email = workspace.content.find((item) => item.channel === 'email');
  if (email && (email.structured?.emailSubjects ?? []).length < 2) {
    issues.push(
      issue(
        'email-subject-options',
        'info',
        'Email needs more subject-line choices',
        'Provide at least two materially different subject lines for quick review.',
        'email',
      ),
    );
  }

  if (
    ['reservations', 'ticket-sales'].includes(workspace.brief.objective) &&
    !workspace.brief.reservationUrl.trim()
  ) {
    issues.push(
      issue(
        'missing-conversion-url',
        'warning',
        'No reservation or ticket URL is set',
        'The campaign objective asks people to convert, but there is no destination link.',
      ),
    );
  }

  if (/localhost|127\.0\.0\.1|vercel\.app|git-[a-z0-9-]+-/i.test(combinedCopy)) {
    issues.push(
      issue(
        'temporary-public-url',
        'warning',
        'Campaign copy contains a temporary Preview URL',
        'Replace it with Club Bahia’s permanent public reservation or ticket link before launch.',
      ),
    );
  }

  const repeatedLines = repeatedPublicLines(workspace);
  if (repeatedLines.length) {
    issues.push(
      issue(
        'cross-channel-repetition',
        'info',
        'Several channels repeat the same wording',
        `Vary the channel voice. Repeated example: “${repeatedLines[0]}”`,
      ),
    );
  }

  for (const item of workspace.content) {
    if (!item.body.trim()) {
      issues.push(
        issue(
          `empty-${item.channel}`,
          'error',
          'Generated content is empty',
          'Regenerate or edit this item before approval.',
          item.channel,
        ),
      );
    }
    socialVariantChecks(item, issues);
  }

  const penalty = issues.reduce((total, item) => {
    if (item.severity === 'error') return total + 18;
    if (item.severity === 'warning') return total + 8;
    return total + 3;
  }, 0);

  return {
    score: Math.max(0, 100 - penalty),
    issues,
  };
}
