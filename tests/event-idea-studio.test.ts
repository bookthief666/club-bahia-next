import { describe, expect, it } from 'vitest';
import type { EventIdeaInput } from '../lib/admin/event-ideas/domain';
import { buildFixtureEventIdeas } from '../lib/admin/event-ideas/generator';
import {
  EventIdeaGenerationResultSchema,
  EventIdeaInputSchema,
} from '../lib/admin/event-ideas/validation';

const input: EventIdeaInput = {
  roughIdea: 'An 80s darkwave Thursday with local DJs and dramatic lighting',
  preferredDate: '2026-09-17',
  availableTalent: 'DJ Nocturna and one local guest DJ',
  targetAudience: 'alternative nightlife regulars in Echo Park and nearby neighborhoods',
  budgetCents: 35000,
  primaryGoal: 'launch-recurring-night',
  atmosphere: 'nocturnal, cinematic, energetic, and welcoming',
  constraints: 'Limited staff and no original event footage yet',
};

describe('Event Idea Studio', () => {
  it('accepts a complete operator input', () => {
    expect(EventIdeaInputSchema.safeParse(input).success).toBe(true);
  });

  it('rejects an empty rough idea', () => {
    expect(
      EventIdeaInputSchema.safeParse({ ...input, roughIdea: '' }).success,
    ).toBe(false);
  });

  it('builds three distinct starter concepts', () => {
    const concepts = buildFixtureEventIdeas(input);
    expect(concepts).toHaveLength(3);
    expect(new Set(concepts.map((concept) => concept.id)).size).toBe(3);
    expect(new Set(concepts.map((concept) => concept.programmingFormat)).size).toBe(3);
    expect(concepts.every((concept) => concept.risks.length > 0)).toBe(true);
    expect(concepts.every((concept) => concept.openQuestions.length > 0)).toBe(true);
  });

  it('returns a response that satisfies the client boundary', () => {
    const result = EventIdeaGenerationResultSchema.safeParse({
      concepts: buildFixtureEventIdeas(input),
      provider: 'fixture',
      warning: 'Live AI was unavailable.',
    });
    expect(result.success).toBe(true);
  });

  it('does not present a fallback concept as proven or profitable', () => {
    const text = JSON.stringify(buildFixtureEventIdeas(input)).toLowerCase();
    expect(text).not.toContain('guaranteed profit');
    expect(text).not.toContain('proven profitable');
  });
});
