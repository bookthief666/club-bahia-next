import type { PublicEventCard } from '@/lib/public-events/domain';

export interface PublicProgramCatalog {
  scheduledEvents: PublicEventCard[];
  residentPrograms: PublicEventCard[];
  evergreenPrograms: PublicEventCard[];
}

function eventEndsAfter(event: PublicEventCard, now: Date): boolean {
  const value = event.endsAt || event.startsAt;
  if (!value) return false;
  return new Date(value).getTime() >= now.getTime();
}

export function buildPublicProgramCatalog(
  cards: PublicEventCard[],
  now = new Date(),
): PublicProgramCatalog {
  const scheduledEvents = cards
    .filter(
      (event) =>
        event.programType === 'scheduled' && eventEndsAfter(event, now),
    )
    .sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) return left.isFeatured ? -1 : 1;
      return (
        new Date(left.startsAt || 0).getTime() -
        new Date(right.startsAt || 0).getTime()
      );
    });

  return {
    scheduledEvents,
    residentPrograms: cards.filter(
      (event) => event.programType === 'resident',
    ),
    evergreenPrograms: cards.filter(
      (event) => event.programType === 'evergreen',
    ),
  };
}
