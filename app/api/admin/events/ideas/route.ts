import { NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/admin/auth/session';
import { buildFixtureEventIdeas } from '@/lib/admin/event-ideas/generator';
import { generateEventIdeasWithOpenAI } from '@/lib/admin/event-ideas/server/openai-event-ideas';
import { EventIdeaInputSchema } from '@/lib/admin/event-ideas/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

function safeWarning(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown AI provider error.';
  return `AI event development was unavailable, so practical starter concepts were used instead. ${message}`.slice(
    0,
    900,
  );
}

export async function POST(request: Request) {
  try {
    requireAdminRequest(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized.' },
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

  const parsed = EventIdeaInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Event idea input failed validation.',
        details: parsed.error.flatten(),
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const apiKeyConfigured = Boolean(process.env.OPENAI_API_KEY);
  const strictProvider =
    process.env.OPENAI_EVENT_IDEA_STRICT === 'true' ||
    process.env.OPENAI_CAMPAIGN_STRICT === 'true';

  if (!apiKeyConfigured) {
    return NextResponse.json(
      {
        concepts: buildFixtureEventIdeas(parsed.data),
        provider: 'fixture',
        warning:
          'OPENAI_API_KEY is not configured for this deployment. Starter concepts were generated without live AI.',
      },
      { headers: NO_STORE_HEADERS },
    );
  }

  try {
    const result = await generateEventIdeasWithOpenAI(parsed.data);
    return NextResponse.json(result, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const warning = safeWarning(error);
    if (strictProvider) {
      return NextResponse.json(
        { error: warning },
        { status: 502, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      {
        concepts: buildFixtureEventIdeas(parsed.data),
        provider: 'fixture',
        warning,
      },
      { headers: NO_STORE_HEADERS },
    );
  }
}
