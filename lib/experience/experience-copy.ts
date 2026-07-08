export const experienceCopy = {
  venue: {
    name: 'Club Bahia',
    label: 'Bahia Sunset',
    established: 'Est. 1974',
    address: '1130 Sunset Blvd · Los Angeles, CA',
    phone: '(213) 250-4313',
    instagram: '@clubbahia_la',
  },
  nav: [
    { label: 'Reserve', overlay: 'reservations' },
    { label: 'Our Story', overlay: 'story' },
    { label: 'Door Policy', overlay: 'dress' },
    { label: 'Events', href: '/events' },
    { label: 'Talk To Us', overlay: 'menu' },
  ] as const,
  story: {
    heading: 'Since 1974 on Sunset Boulevard',
    paragraphs: [
      'Since 1974, Club Bahia has held its place on Sunset Boulevard as a Los Angeles Latin nightlife destination: part live-music room, part kitchen, part dance floor, and part neighborhood ritual.',
      'The room carries the character of old L.A. nightlife — neon palms, red booths, a real stage, and a crowd that comes to celebrate across generations.',
      'Reservations, weekend parties, private events, and live entertainment keep the Bahia experience moving from dinner plans into a full night out.',
    ],
    facts: [
      'EST. 1974',
      'SUNSET BLVD',
      'LIVE MUSIC',
      'KITCHEN + DANCE FLOOR',
    ],
  },
  reservations: {
    heading: 'RESERVATIONS.',
    lines: [
      'Friday and Saturday nights.',
      'For groups of 5 or more, phone confirmation may be required.',
      '21+ ID required.',
      'Dress code enforced.',
    ],
  },
  dressCode: {
    heading: 'DOOR POLICY.',
    intro: ['21 and over ID required.', 'Dress code enforced.'],
    notPermitted: [
      'T-shirts',
      'Sandals',
      'Shorts',
      'Hats',
      'Sleeveless shirts',
      'Sports attire',
      'Oversized or baggy clothing',
    ],
  },
  menu: {
    heading: 'MENUS & EVENTS.',
    body: 'Live Latin entertainment every Friday and Saturday. Private events and filming location inquiries available.',
  },
};

export type ExperienceOverlay = 'story' | 'reservations' | 'dress' | 'menu';
