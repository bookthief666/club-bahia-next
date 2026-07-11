import { NextResponse } from 'next/server';
import { isMockAdminEnabled } from '@/lib/admin/mock-auth';
import {
  buildFixtureCampaign,
  FixtureCampaignGenerator,
} from '@/lib/admin/growth/generator';
import type {
  CampaignGenerationResult,
  CampaignItemGenerationResult,
} from '@/lib/admin/growth/domain';
import {
  generateCampaignItemWithOpenAI,
  generateCampaignWithOpenAI,
} from '@/lib/admin/growth/server/openai-campaign';
import { CampaignGenerationRequestSchema } from '@/lib/admin/growth/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

function safeWarning(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown AI provider error.';
  return `AI generation was unavailable, so the deterministic fixture generator was used. ${message}`.slice(
    0,
    700,
  );
}

function fixtureCampaign(
  event: Parameters<typeof buildFixtureCampaign>[0],
  brief: Parameters<typeof buildFixtureCampaign>[1],
  warning: string,
): CampaignGenerationResult {
  return {
    ...buildFixtureCampaign(event, brief),
    provider: 'fixture',
    warning,
  };
}

async function fixtureItem(
  event: Parameters<FixtureCampaignGenerator['generateItem']>[0],
  brief: Parameters<FixtureCampaignGenerator['generateItem']>[1],
  channel: Parameters<FixtureCampaignGenerator['generateItem']>[2],
  warning: string,
): Promise<CampaignItemGenerationResult> {
  const generator = new FixtureCampaignGenerator();
  return {
    item: await generator.generateItem(event, brief, channel),
    provider: 'fixture',
    warning,
  };
}

export async function POST(request: Request) {
  if (!isMockAdminEnabled) {
    return NextResponse.json(
      { error: 'Admin campaign generation is not enabled in this environment.' },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON.' },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const parsed = CampaignGenerationRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Campaign input failed validation.',
        details: parsed.error.flatten(),
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const { event, brief } = parsed.data;
  const apiKeyConfigured = Boolean(process.env.OPENAI_API_KEY);
  const strictProvider = process.env.OPENAI_CAMPAIGN_STRICT === 'true';

  if (!apiKeyConfigured) {
    const warning =
      'OPENAI_API_KEY is not configured for this deployment. Add it in Vercel to enable real AI copy.';

    const result =
      parsed.data.mode === 'campaign'
        ? fixtureCampaign(event, brief, warning)
        : await fixtureItem(event, brief, parsed.data.channel, warning);

    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  }

  try {
    const result =
      parsed.data.mode === 'campaign'
        ? await generateCampaignWithOpenAI(event, brief)
        : await generateCampaignItemWithOpenAI(event, brief, parsed.data.channel);

    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const warning = safeWarning(error);

    if (strictProvider) {
      return NextResponse.json(
        { error: warning },
        { status: 502, headers: NO_STORE_HEADERS },
      );
    }

    const result =
      parsed.data.mode === 'campaign'
        ? fixtureCampaign(event, brief, warning)
        : await fixtureItem(event, brief, parsed.data.channel, warning);

    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  }
}
