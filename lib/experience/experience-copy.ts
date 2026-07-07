export const experienceCopy = {
  venue: {
    name: 'Club Bahia',
    label: 'Bahia Sunset',
    established: 'Est. 1974',
    address: '1130 Sunset Blvd, Los Angeles, CA',
    phone: '(213) 250-4313',
    instagram: '@clubbahia_la',
  },
  nav: [
    { label: 'Reserve', overlay: 'reservations' },
    { label: 'Our Story', overlay: 'story' },
    { label: 'Door Policy', overlay: 'dress' },
    { label: 'Talk To Us', overlay: 'menu' },
  ] as const,
  story: {
    heading: 'OUR STORY.',
    body: 'Club Bahia has carried Latin nightlife on Sunset Blvd since 1974 — a room for live entertainment, dancing, private celebrations, and late-night Los Angeles memories.',
    bullets: [
      'Live Latin entertainment',
      'Sunset Blvd address',
      '21+ nightlife',
      'Dress code enforced',
      'Private events available',
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
