import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignChannel,
  CampaignQualityIssue,
  CampaignQualityReport,
  EventGrowthWorkspace,
} from '@/lib/admin/growth/domain';

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'club',
  'de',
  'del',
  'el',
  'en',
  'for',
  'la',
  'las',
  'los',
  'night',
  'of',
  'the',
  'y',
]);

function normalizedTokens(value: string): Set<string> {
  return new Set(
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function overlapRatio(left: string, right: string): number {
  const a = normalizedTokens(left);
  const b = normalizedTokens(right);
  if (!a.size || !b.size) return 0;

  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.min(a.size, b.size);
}

export function hasCampaignIdentityConflict(
  eventTitle: string,
  theme: string,
  publicSubtitle: string,
): boolean {
  if (publicSubtitle.trim()) return false;
  if (!theme.trim() || eventTitle.trim().toLowerCase() === theme.trim().toLowerCase()) return false;
  return overlapRatio(eventTitle, theme) < 0.25;
}

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

export function buildCampaignQualityReport(
  event: OperationsEvent,
  workspace: EventGrowthWorkspace,
): CampaignQualityReport {
  const issues: CampaignQualityIssue[] = [];
  const titleConflict = hasCampaignIdentityConflict(
    event.title,
    workspace.brief.theme,
    workspace.brief.publicSubtitle,
  );

  if (titleConflict) {
    issues.push(
      issue(
        'identity-conflict',
        'warning',
        'Event identity needs clarification',
        `The official title “${event.title}” and campaign theme “${workspace.brief.theme}” read like different events. Add a public subtitle or rename the event before publishing.`,
      ),
    );
  }

  const combinedCopy = workspace.content.map((item) => item.body).join('\n').toLowerCase();
  const internalAudience = workspace.brief.targetAudience.trim().toLowerCase();
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

  if (
    workspace.brief.language === 'spanish' &&
    /\b(reserve now|buy tickets|learn more|book now)\b/i.test(combinedCopy)
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

  const sms = workspace.content.find((item) => item.channel === 'sms');
  if (sms && sms.body.length > 300) {
    issues.push(
      issue(
        'sms-length',
        'error',
        'SMS exceeds 300 characters',
        `The SMS is ${sms.body.length} characters. Shorten it before sending.`,
        'sms',
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
  }

  const penalty = issues.reduce((total, item) => {
    if (item.severity === 'error') return total + 22;
    if (item.severity === 'warning') return total + 10;
    return total + 4;
  }, 0);

  return {
    score: Math.max(0, 100 - penalty),
    titleConflict,
    issues,
  };
}
