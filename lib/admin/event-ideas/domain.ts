export type EventIdeaGoal =
  | 'attendance'
  | 'reservations'
  | 'bar-sales'
  | 'launch-recurring-night';

export type EventIdeaConfidence =
  | 'strong-hypothesis'
  | 'worth-small-test'
  | 'needs-more-information'
  | 'operationally-difficult';

export type EventIdeaProvider = 'openai' | 'fixture';

export interface EventIdeaInput {
  roughIdea: string;
  preferredDate?: string;
  availableTalent: string;
  targetAudience: string;
  budgetCents: number;
  primaryGoal: EventIdeaGoal;
  atmosphere: string;
  constraints: string;
}

export interface EventIdeaConcept {
  id: string;
  title: string;
  oneLineConcept: string;
  intendedAudience: string;
  programmingFormat: string;
  recommendedTiming: string;
  suggestedCadence: string;
  promotionAngle: string;
  talentRequirements: string[];
  operationalRequirements: string[];
  risks: string[];
  lowCostTest: string;
  openQuestions: string[];
  fitRationale: string;
  confidence: EventIdeaConfidence;
}

export interface EventIdeaGenerationResult {
  concepts: EventIdeaConcept[];
  provider: EventIdeaProvider;
  model?: string;
  warning?: string;
}

export const EVENT_IDEA_GOAL_LABELS: Record<EventIdeaGoal, string> = {
  attendance: 'Increase attendance',
  reservations: 'Increase reservations',
  'bar-sales': 'Increase bar sales',
  'launch-recurring-night': 'Test a recurring night',
};

export const EVENT_IDEA_CONFIDENCE_LABELS: Record<EventIdeaConfidence, string> = {
  'strong-hypothesis': 'Strong hypothesis',
  'worth-small-test': 'Worth a small test',
  'needs-more-information': 'Needs more information',
  'operationally-difficult': 'Operationally difficult',
};
