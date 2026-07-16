import { z } from 'zod';

export const EventIdeaGoalSchema = z.enum([
  'attendance',
  'reservations',
  'bar-sales',
  'launch-recurring-night',
]);

export const EventIdeaConfidenceSchema = z.enum([
  'strong-hypothesis',
  'worth-small-test',
  'needs-more-information',
  'operationally-difficult',
]);

export const EventIdeaInputSchema = z.object({
  roughIdea: z.string().trim().min(3).max(1200),
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  availableTalent: z.string().trim().max(600),
  targetAudience: z.string().trim().max(600),
  budgetCents: z.number().int().min(0).max(10_000_000),
  primaryGoal: EventIdeaGoalSchema,
  atmosphere: z.string().trim().max(600),
  constraints: z.string().trim().max(1000),
});

export const EventIdeaConceptSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(120),
  oneLineConcept: z.string().trim().min(10).max(500),
  intendedAudience: z.string().trim().min(3).max(500),
  programmingFormat: z.string().trim().min(3).max(500),
  recommendedTiming: z.string().trim().min(3).max(300),
  suggestedCadence: z.string().trim().min(3).max(300),
  promotionAngle: z.string().trim().min(3).max(500),
  talentRequirements: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
  operationalRequirements: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
  risks: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
  lowCostTest: z.string().trim().min(10).max(700),
  openQuestions: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
  fitRationale: z.string().trim().min(10).max(700),
  confidence: EventIdeaConfidenceSchema,
});

export const EventIdeaGenerationResultSchema = z.object({
  concepts: z.array(EventIdeaConceptSchema).length(3),
  provider: z.enum(['openai', 'fixture']),
  model: z.string().trim().max(200).optional(),
  warning: z.string().trim().max(1000).optional(),
});

export const AiEventIdeaResponseSchema = z.object({
  concepts: z.array(EventIdeaConceptSchema).length(3),
});

const stringArray = {
  type: 'array',
  minItems: 1,
  maxItems: 8,
  items: { type: 'string' },
} as const;

export const AI_EVENT_IDEA_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['concepts'],
  properties: {
    concepts: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'id',
          'title',
          'oneLineConcept',
          'intendedAudience',
          'programmingFormat',
          'recommendedTiming',
          'suggestedCadence',
          'promotionAngle',
          'talentRequirements',
          'operationalRequirements',
          'risks',
          'lowCostTest',
          'openQuestions',
          'fitRationale',
          'confidence',
        ],
        properties: {
          id: { type: 'string', enum: ['concept-1', 'concept-2', 'concept-3'] },
          title: { type: 'string' },
          oneLineConcept: { type: 'string' },
          intendedAudience: { type: 'string' },
          programmingFormat: { type: 'string' },
          recommendedTiming: { type: 'string' },
          suggestedCadence: { type: 'string' },
          promotionAngle: { type: 'string' },
          talentRequirements: stringArray,
          operationalRequirements: stringArray,
          risks: stringArray,
          lowCostTest: { type: 'string' },
          openQuestions: stringArray,
          fitRationale: { type: 'string' },
          confidence: {
            type: 'string',
            enum: [
              'strong-hypothesis',
              'worth-small-test',
              'needs-more-information',
              'operationally-difficult',
            ],
          },
        },
      },
    },
  },
} as const;
