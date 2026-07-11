'use client';

import type { OperationsEvent } from '@/lib/admin/domain';
import type {
  CampaignBrief,
  CampaignChannel,
  CampaignContentItem,
  CampaignGenerationResult,
  CampaignGenerator,
} from '@/lib/admin/growth/domain';
import { FixtureCampaignGenerator } from '@/lib/admin/growth/generator';
import {
  CampaignGenerationResultSchema,
  CampaignItemGenerationResultSchema,
} from '@/lib/admin/growth/validation';

const GENERATION_ENDPOINT = '/api/admin/growth/generate';

interface ErrorResponse {
  error?: string;
}

async function postGenerationRequest(body: unknown): Promise<unknown> {
  const response = await fetch(GENERATION_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const errorPayload = payload as ErrorResponse;
    throw new Error(errorPayload.error || `Campaign generation failed with status ${response.status}.`);
  }

  return payload;
}

export class ApiCampaignGenerator implements CampaignGenerator {
  constructor(private readonly fallback = new FixtureCampaignGenerator()) {}

  async generate(
    event: OperationsEvent,
    brief: CampaignBrief,
  ): Promise<CampaignGenerationResult> {
    try {
      const payload = await postGenerationRequest({
        mode: 'campaign',
        event,
        brief,
      });
      return CampaignGenerationResultSchema.parse(payload);
    } catch (error) {
      const fallback = await this.fallback.generate(event, brief);
      const message = error instanceof Error ? error.message : 'Unknown campaign API error.';
      return {
        ...fallback,
        provider: 'fixture',
        warning: `The campaign API could not be reached, so local fixture copy was used. ${message}`.slice(
          0,
          1000,
        ),
      };
    }
  }

  async generateItem(
    event: OperationsEvent,
    brief: CampaignBrief,
    channel: CampaignChannel,
  ): Promise<CampaignContentItem> {
    try {
      const payload = await postGenerationRequest({
        mode: 'item',
        event,
        brief,
        channel,
      });
      return CampaignItemGenerationResultSchema.parse(payload).item;
    } catch {
      return this.fallback.generateItem(event, brief, channel);
    }
  }
}
