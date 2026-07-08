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

// Editable placeholder owner/event data. Replace this array later with Supabase,
// Google Calendar, Sanity, or another CMS feed when real event publishing is ready.
export const bahiaEvents: BahiaEvent[] = [
  { id: 'friday-night-live', slug: 'friday-night-live', dayLabel: 'Fri', dateLabel: 'Weekend', title: 'Friday Night Live', category: 'Live music + kitchen', timeLabel: 'Doors after dark', status: 'RSVP open', description: 'A sample live-music night for the Club Bahia calendar. Edit before publishing real dates.' },
  { id: 'saturday-dance-floor', slug: 'saturday-dance-floor', dayLabel: 'Sat', dateLabel: 'Weekend', title: 'Saturday Dance Floor', category: 'DJ / dancing', timeLabel: 'Late night', status: 'Tables encouraged', description: 'A sample weekend dance-floor listing intended to be replaced with owner-approved programming.' },
  { id: 'private-event-table-inquiry', slug: 'private-event-table-inquiry', dayLabel: 'By request', dateLabel: 'Private', title: 'Private Event / Table Inquiry', category: 'Groups + celebrations', timeLabel: 'Call to coordinate', status: 'Inquiry only', description: 'Use this placeholder for private event and table inquiries until a live calendar source is connected.' },
];

export function getEventTitleBySlug(slug: string) {
  return bahiaEvents.find((event) => event.slug === slug)?.title;
}
