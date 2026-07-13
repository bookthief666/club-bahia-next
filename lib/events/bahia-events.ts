import { bahiaAssets, type BahiaImageAsset } from '@/lib/assets/bahia-assets';
import type { PublicProgramType } from '@/lib/public-events/domain';

export type BahiaEvent = {
  slug: string;
  title: string;
  eyebrow: string;
  category: string;
  programType: PublicProgramType;
  dateLabel: string;
  timeLabel: string;
  image: BahiaImageAsset;
  secondaryImage?: BahiaImageAsset;
  description: string;
  status: string;
  ctaLabel: string;
  reservationHref: string;
  ticketUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  room?: string;
  performers?: string;
  genres?: string;
  doorsTime?: string;
  admission?: string;
  ageRestriction?: string;
  foodDrinkSpecial?: string;
  address?: string;
};

export const bahiaEvents: BahiaEvent[] = [
  {
    slug: 'azucar-la-live-weekends',
    title: 'Azucar LA Live Weekends',
    eyebrow: 'Resident live music',
    category: 'Live Latin music',
    programType: 'resident',
    dateLabel: 'Most Fridays & Saturdays',
    timeLabel: 'Evening sets · schedule may vary',
    image: bahiaAssets.exteriorNightFacade,
    secondaryImage: bahiaAssets.sunsetLineExteriorDay,
    description:
      'Club Bahia resident group Azucar LA brings live cumbia, merengue, salsa, bachata, and Latin dance music to the historic Sunset Boulevard stage most Friday and Saturday nights. Come for dinner, live music, dancing, birthdays, and late-night celebrations. Weekend schedules may vary, so check the latest listing or call the venue before making plans.',
    status: 'Weekend reservations available',
    ctaLabel: 'Request a table',
    reservationHref: '/reservations?event=azucar-la-live-weekends',
    ticketUrl: '',
    isPublished: true,
    isFeatured: true,
    room: 'Main room',
    performers: 'Azucar LA',
    genres: 'Cumbia · merengue · salsa · bachata · Latin dance',
    doorsTime: 'Most Friday and Saturday evenings',
    admission: 'Cover and schedule may vary by night',
    ageRestriction: 'Confirm this weekend’s policy',
    foodDrinkSpecial: 'Full kitchen, cocktails, table reservations, and celebration inquiries available.',
    address: '1130 Sunset Blvd, Los Angeles, CA 90012',
  },
  {
    slug: 'dance-floor-nights',
    title: 'Dance Floor Nights',
    eyebrow: 'Weekend energy',
    category: 'Dancing',
    programType: 'evergreen',
    dateLabel: 'Select nights',
    timeLabel: 'Late-night atmosphere',
    image: bahiaAssets.packedDanceFloorGreenNeon,
    description:
      'Reserve a table, bring a group, and settle into Bahia’s red-room dance floor energy with tropical noir lighting, Latin music, cocktails, and bottle-service-ready seating.',
    status: 'Tables available by request',
    ctaLabel: 'Request a table',
    reservationHref: '/reservations?event=dance-floor-nights',
    ticketUrl: '',
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'birthdays-and-celebrations',
    title: 'Birthdays & Celebrations',
    eyebrow: 'Celebrate here',
    category: 'Groups',
    programType: 'evergreen',
    dateLabel: 'By request',
    timeLabel: 'Availability varies',
    image: bahiaAssets.redLoungeVipBooths,
    description:
      'Plan birthdays, anniversaries, and group nights with a reservation inquiry that gives the Bahia team the details needed to coordinate table options and timing.',
    status: 'Inquiry welcome',
    ctaLabel: 'Start an inquiry',
    reservationHref: '/reservations?event=birthdays-and-celebrations',
    ticketUrl: '',
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: 'private-events-filming',
    title: 'Private Events & Filming',
    eyebrow: 'Owner-managed inquiries',
    category: 'Private events',
    programType: 'evergreen',
    dateLabel: 'Custom dates',
    timeLabel: 'Scheduled with the venue',
    image: bahiaAssets.mainRoomRedTables,
    description:
      'Bring private parties, filming inquiries, brand moments, and cultural events to Club Bahia’s historic Sunset Boulevard room for owner-reviewed availability.',
    status: 'Contact venue',
    ctaLabel: 'Start an inquiry',
    reservationHref: '/reservations?event=private-events-filming',
    ticketUrl: '',
    isPublished: true,
    isFeatured: false,
  },
];

export function getEventTitleBySlug(slug: string) {
  return bahiaEvents.find((event) => event.slug === slug)?.title;
}

// Future architecture note: this local event model is intentionally shaped for
// later migration to shared resident-series and event records while keeping the
// current public fallback useful when no dated special events are announced.
