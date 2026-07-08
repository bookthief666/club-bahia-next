export type BahiaEvent = {
  id: string;
  slug: string;
  dayLabel: string;
  dateLabel: string;
  title: string;
  category: string;
  timeLabel: string;
  status: string;
  description: string;
};

// Owner-editable programming categories for demo review. Replace with verified
// dated events only when an approved calendar source is available.
export const bahiaEvents: BahiaEvent[] = [
  {
    id: "live-music-programming",
    slug: "live-music-programming",
    dayLabel: "Programming",
    dateLabel: "Live",
    title: "Live Music Programming",
    category: "Latin entertainment",
    timeLabel: "Schedule announced by the venue",
    status: "Ask about upcoming dates",
    description:
      "Club Bahia regularly welcomes guests for Latin entertainment, nightlife, and kitchen service. Contact the team for the latest confirmed programming before making plans.",
  },
  {
    id: "dance-night-programming",
    slug: "dance-night-programming",
    dayLabel: "Nights",
    dateLabel: "Dance",
    title: "Dance Nights",
    category: "Dance floor + tables",
    timeLabel: "Weekend availability varies",
    status: "Reservations encouraged",
    description:
      "Plan a night out around Club Bahia’s dance floor atmosphere. Table requests and group reservations can be coordinated through the reservations page or by phone.",
  },
  {
    id: "private-events-birthdays",
    slug: "private-events-birthdays",
    dayLabel: "Private",
    dateLabel: "Events",
    title: "Private Events & Birthdays",
    category: "Celebrations + groups",
    timeLabel: "By request",
    status: "Inquiry welcome",
    description:
      "Bring birthdays, celebrations, and private event inquiries to the Club Bahia team for confirmed availability, table details, and hospitality coordination.",
  },
];

export function getEventTitleBySlug(slug: string) {
  return bahiaEvents.find((event) => event.slug === slug)?.title;
}
