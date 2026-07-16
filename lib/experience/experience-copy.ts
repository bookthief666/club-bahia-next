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
    heading: 'A Los Angeles Nightlife Landmark',
    paragraphs: [
      'Since 1974, Club Bahia has been a fixture of Los Angeles Latin nightlife, where live bands, late dinners, and a packed dance floor meet beneath the neon.',
      'Red VIP booths, glowing palms, and a real stage preserve the cinematic character of old L.A. as generations return to celebrate.',
      'Weekend performances and private events carry the night from dinner on Sunset into a full Bahia experience.',
    ],
    facts: [
      'EST. 1974',
      'LATIN NIGHTLIFE',
      'LIVE BANDS',
      'SUNSET BOULEVARD',
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
