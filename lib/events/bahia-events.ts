import { bahiaAssets, type BahiaImageAsset } from "@/lib/assets/bahia-assets";

export type BahiaEvent = {
  slug: string;
  title: string;
  eyebrow: string;
  category: string;
  dateLabel: string;
  timeLabel: string;
  image: BahiaImageAsset;
  description: string;
  status: string;
  ctaLabel: string;
  reservationHref: string;
  ticketUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
};

export const bahiaEvents: BahiaEvent[] = [
  {
    slug: "live-latin-weekends",
    title: "Live Latin Weekends",
    eyebrow: "Upcoming at Bahia",
    category: "Live music",
    dateLabel: "Dates confirmed by venue",
    timeLabel: "Evening programming",
    image: bahiaAssets.liveDanceCrowdStage,
    description:
      "A cinematic Club Bahia night built around live Latin entertainment, a hot kitchen, dancing, and table service. Upcoming programming is updated as dates are confirmed.",
    status: "RSVP recommended",
    ctaLabel: "RSVP / Reserve",
    reservationHref: "/reservations?event=live-latin-weekends",
    ticketUrl: "",
    isPublished: true,
    isFeatured: true,
  },
  {
    slug: "dance-floor-nights",
    title: "Dance Floor Nights",
    eyebrow: "Weekend energy",
    category: "Dancing",
    dateLabel: "Select nights",
    timeLabel: "Late-night atmosphere",
    image: bahiaAssets.packedDanceFloorGreenNeon,
    description:
      "Reserve a table, bring a group, and settle into Bahia’s red-room dance floor energy with tropical noir lighting, Latin music, cocktails, and bottle-service-ready seating.",
    status: "Tables available by request",
    ctaLabel: "RSVP / Reserve",
    reservationHref: "/reservations?event=dance-floor-nights",
    ticketUrl: "",
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "birthdays-and-celebrations",
    title: "Birthdays & Celebrations",
    eyebrow: "Celebrate here",
    category: "Groups",
    dateLabel: "By request",
    timeLabel: "Availability varies",
    image: bahiaAssets.redLoungeVipBooths,
    description:
      "Plan birthdays, anniversaries, and group nights with a reservation inquiry that gives the Bahia team the details needed to coordinate table options and timing.",
    status: "Inquiry welcome",
    ctaLabel: "RSVP / Reserve",
    reservationHref: "/reservations?event=birthdays-and-celebrations",
    ticketUrl: "",
    isPublished: true,
    isFeatured: false,
  },
  {
    slug: "private-events-filming",
    title: "Private Events & Filming",
    eyebrow: "Owner-managed inquiries",
    category: "Private events",
    dateLabel: "Custom dates",
    timeLabel: "Scheduled with the venue",
    image: bahiaAssets.mainRoomRedTables,
    description:
      "Bring private parties, filming inquiries, brand moments, and cultural events to Club Bahia’s historic Sunset Boulevard room for owner-reviewed availability.",
    status: "Contact venue",
    ctaLabel: "RSVP / Reserve",
    reservationHref: "/reservations?event=private-events-filming",
    ticketUrl: "",
    isPublished: true,
    isFeatured: false,
  },
];

export function getEventTitleBySlug(slug: string) {
  return bahiaEvents.find((event) => event.slug === slug)?.title;
}

// Future architecture note: this local event model is intentionally shaped for
// later migration to Sanity CMS event entries, Supabase RSVP records, and Stripe
// Checkout ticketing while keeping the current owner-demo page static and safe.
