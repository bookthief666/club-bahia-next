# Milestone 3C — Real AI Campaign Generation

## Purpose

Replace purely deterministic campaign copy with a server-side, structured AI generation path while preserving the existing fixture generator as a safe fallback.

## Architecture

### Browser

`ApiCampaignGenerator` sends validated event and campaign-brief data to:

`POST /api/admin/growth/generate`

The browser never receives or stores the OpenAI API key.

### Server

The route:

1. Confirms that the preview/development admin boundary is enabled.
2. Validates the request with Zod.
3. Uses the OpenAI Responses API with strict JSON Schema output when `OPENAI_API_KEY` is configured.
4. Validates the model response with Zod.
5. Merges generated copy into deterministic channel IDs, titles, publishing modes, and suggested dates.
6. Falls back to deterministic fixture copy when no key is configured or the provider fails, unless strict mode is enabled.

## Generation rules

- The official event title remains authoritative.
- Internal target-audience strategy must not be repeated as public copy.
- Rough notes are transformed rather than copied literally.
- Performers, prices, times, age limits, specials, URLs, and addresses may not be invented.
- English, Spanish, and bilingual campaigns are supported.
- Spanish-only campaigns must use natural Spanish calls to action.
- Each channel receives native copy rather than the same paragraph repeated.
- SMS output is instructed to remain under 300 characters and include opt-out language.
- Every returned item remains a draft requiring human approval.

## Environment variables

```text
OPENAI_API_KEY=
OPENAI_CAMPAIGN_MODEL=gpt-5.6
OPENAI_CAMPAIGN_STRICT=false
```

`OPENAI_API_KEY` must remain server-only. Never prefix it with `NEXT_PUBLIC_`.

When `OPENAI_CAMPAIGN_STRICT=false`, provider errors return fixture copy with a warning. When set to `true`, provider errors return an HTTP 502 and block generation.

## Provider visibility

The Growth Workspace shows a server-rendered provider banner:

- **OpenAI** when a server-side key is configured.
- **Fixture AI** when no key is configured.

## Security boundary

This milestone still uses the synthetic preview/development mock-admin boundary. Production generation remains disabled until real authentication replaces mock auth.

## Intentionally excluded

- Social OAuth
- Automatic posting
- Shared database persistence
- Image or video generation
- Website publishing
- Production authentication
- Billing controls and per-user quotas

## Acceptance criteria

1. The application builds successfully without an OpenAI key.
2. Without a key, campaign generation remains functional through fixture fallback.
3. With a valid key, generation happens only on the server.
4. Model output is constrained by JSON Schema and validated again with Zod.
5. Invalid or incomplete model output never reaches the workspace.
6. Regenerating one item calls the item-generation route and preserves deterministic metadata.
7. Every generated item remains in draft state.
8. The UI clearly identifies whether OpenAI or Fixture AI is configured.
