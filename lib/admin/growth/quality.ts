import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignChannel,
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

  const englishCtaPattern = /\b(reserve now|buy tickets|learn more|book now)\b/i;
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
        `The SMS is ${sms.body.length} characters. Shorten it before sending.`,
        'sms',
      ),
    );
  }

  if (
    sms &&
    !/\b(reply|text|responde)\s+(stop|alto|cancel|cancelar)\b|\bopt\s*out\b|\bdarse\s+de\s+baja\b/i.test(
      sms.body,
    )
  ) {
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
  }

  const penalty = issues.reduce((total, item) => {
    if (item.severity === 'error') return total + 22;
    if (item.severity === 'warning') return total + 10;
    return total + 4;
  }, 0);

  return {
    score: Math.max(0, 100 - penalty),
    issues,
  };
}
