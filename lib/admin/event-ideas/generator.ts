import type {
  EventIdeaConcept,
  EventIdeaInput,
} from '@/lib/admin/event-ideas/domain';

function clean(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function titleCase(value: string): string {
  return clean(value)
    .split(' ')
    .slice(0, 7)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 70);
}

function budgetDescription(cents: number): string {
  if (cents <= 0) return 'No promotional budget has been confirmed.';
  if (cents < 20_000) return 'Keep the test lightweight and rely on owned channels and partner sharing.';
  if (cents < 60_000) return 'A focused local campaign and modest creative production are realistic.';
  return 'The budget can support stronger creative production and a limited paid-media test.';
}

function audience(input: EventIdeaInput): string {
  return clean(input.targetAudience) || 'Club Bahia regulars and nearby Los Angeles nightlife audiences';
}

function talent(input: EventIdeaInput): string[] {
  const available = clean(input.availableTalent);
  return available
    ? [`Confirm availability and terms with ${available}.`, 'Assign one host or promoter responsible for audience activation.']
    : ['Confirm one lead DJ, band, or host who can credibly represent the concept.', 'Identify at least one partner who will actively share the event.'];
}

function sharedQuestions(input: EventIdeaInput): string[] {
  const questions = [
    'What cover, reservation offer, or entry policy is approved for this event?',
    'Which performer or promoter will commit to sharing a tracked link?',
  ];
  if (!input.preferredDate) questions.unshift('Which date is available and operationally realistic?');
  if (!input.targetAudience.trim()) questions.push('Which specific audience should the first test prioritize?');
  return questions;
}

export function buildFixtureEventIdeas(input: EventIdeaInput): EventIdeaConcept[] {
  const idea = clean(input.roughIdea);
  const baseTitle = titleCase(idea) || 'New Club Bahia Night';
  const intendedAudience = audience(input);
  const dateGuidance = input.preferredDate
    ? `Test on ${input.preferredDate}; confirm talent and venue availability before announcement.`
    : 'Choose a lower-risk available night and allow at least 10 days for promotion.';
  const budget = budgetDescription(input.budgetCents);
  const constraints = clean(input.constraints);
  const atmosphere = clean(input.atmosphere) || 'distinctive, welcoming, and energetic';
  const commonRisks = [
    'Audience demand is still a hypothesis until tracked RSVPs and attendance are measured.',
    constraints || 'Talent, staffing, and promotion responsibilities still need confirmation.',
  ];
  const openQuestions = sharedQuestions(input);

  return [
    {
      id: 'concept-1',
      title: baseTitle,
      oneLineConcept: `${idea} presented as a focused, easy-to-understand Club Bahia event with a ${atmosphere} atmosphere.`,
      intendedAudience,
      programmingFormat: 'One clear music or performance identity, one lead host or act, and a direct reservation-focused promotion.',
      recommendedTiming: dateGuidance,
      suggestedCadence: 'Run once as a measured pilot before deciding whether it should recur.',
      promotionAngle: `Lead with the clearest promise of the night and show exactly what guests will experience. Primary goal: ${input.primaryGoal}.`,
      talentRequirements: talent(input),
      operationalRequirements: [
        'Confirm event hours, admission, age policy, room, and reservation offer before publishing.',
        'Prepare one strong flyer, one short vertical video, and a tracked RSVP link.',
        budget,
      ],
      risks: commonRisks,
      lowCostTest: 'Launch one tracked announcement, one performer-sharing link, and one day-of Story sequence. Compare RSVPs, arrivals, walk-ins, and spending before expanding the concept.',
      openQuestions,
      fitRationale: 'This is the lowest-complexity version of the idea and gives Club Bahia the cleanest signal about whether the underlying concept attracts a real audience.',
      confidence: 'worth-small-test',
    },
    {
      id: 'concept-2',
      title: `${baseTitle}: Live Showcase`.slice(0, 120),
      oneLineConcept: `${idea} expanded into a programmed showcase with multiple moments, stronger visual identity, and a reason to arrive early.`,
      intendedAudience,
      programmingFormat: 'A hosted sequence with an opening set, featured performance or DJ block, and a defined peak-hour moment.',
      recommendedTiming: dateGuidance,
      suggestedCadence: 'Quarterly or monthly only after the pilot proves that talent partners can activate their audiences.',
      promotionAngle: 'Promote the lineup and progression of the night, giving each participating artist a personalized tracked sharing link.',
      talentRequirements: [
        ...talent(input),
        'Confirm a simple run-of-show and one featured moment that can anchor the campaign.',
      ].slice(0, 8),
      operationalRequirements: [
        'Assign one person to coordinate talent arrivals, set times, and media collection.',
        'Create separate performer assets while preserving one authoritative event title.',
        budget,
      ],
      risks: [
        'More participants increase coordination risk and can blur the event promise.',
        'The concept fails if participating talent does not actively promote.',
        constraints || 'Production requirements and set changes need confirmation.',
      ],
      lowCostTest: 'Use no more than two featured participants for the first edition. Require each participant to share a unique tracked link and compare their actual arrival conversion.',
      openQuestions: [
        ...openQuestions,
        'Which featured moment is strong enough to lead the flyer and Reel?',
      ].slice(0, 8),
      fitRationale: 'This version can extend Club Bahia beyond a standard DJ night while using performer networks as measurable distribution channels.',
      confidence: input.availableTalent.trim() ? 'worth-small-test' : 'needs-more-information',
    },
    {
      id: 'concept-3',
      title: `${baseTitle}: Community Edition`.slice(0, 120),
      oneLineConcept: `${idea} reframed as a participatory community night built around sharing, interaction, and repeat attendance rather than only a headline act.`,
      intendedAudience,
      programmingFormat: 'Music or performance programming combined with one simple participatory element such as a themed photo moment, audience vote, guest playlist prompt, or community partner feature.',
      recommendedTiming: dateGuidance,
      suggestedCadence: 'Test once, then repeat only if referrals and return intent are visibly stronger than a standard event.',
      promotionAngle: 'Make guests feel like early members of a new recurring scene and give them a specific reason to invite friends.',
      talentRequirements: [
        'Choose a host who can welcome guests and explain the participatory element clearly.',
        ...talent(input),
      ].slice(0, 8),
      operationalRequirements: [
        'Keep participation optional, fast, and easy for door and floor staff to support.',
        'Capture opt-in feedback and post-event media without slowing entry.',
        budget,
      ],
      risks: [
        'The participatory element may feel forced if it is not culturally natural to the audience.',
        'Community language can become generic unless the event has a specific musical and visual identity.',
        constraints || 'Staff responsibilities for hosting and data capture need confirmation.',
      ],
      lowCostTest: 'Add one lightweight referral mechanic and one post-event question to the focused pilot. Measure friend referrals, repeat-interest responses, and attendance rather than building a complex loyalty system.',
      openQuestions: [
        ...openQuestions,
        'What interaction would feel natural rather than promotional or forced?',
      ].slice(0, 8),
      fitRationale: 'This version tests whether the concept can become a repeatable scene with lower dependence on expensive talent or paid advertising.',
      confidence: 'needs-more-information',
    },
  ];
}
