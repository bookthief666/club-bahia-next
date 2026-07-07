export type BahiaAssetKey =
  | 'exteriorNightFacade'
  | 'barNeonPalms'
  | 'mainRoomRedTables'
  | 'redLoungeVipBooths'
  | 'redLoungeNeonRoom'
  | 'cocktailsBokeh'
  | 'couplesDancingNeonFloor'
  | 'danceFloorLightTrails'
  | 'packedDanceFloorGreenNeon'
  | 'discoBallEmptyDanceFloor'
  | 'sunsetLineExteriorDay'
  | 'pressRedCurtain';

export type BahiaImageAsset = {
  src: `/assets/bahia/${string}`;
  alt: string;
};

export const bahiaAssets = {
  exteriorNightFacade: {
    src: '/assets/bahia/exterior-night-sunset-blvd.webp',
    alt: 'Club Bahia exterior facade glowing at night on Sunset Boulevard',
  },
  barNeonPalms: {
    src: '/assets/bahia/bar-neon-palms.webp',
    alt: 'Club Bahia bar with neon palm lighting',
  },
  mainRoomRedTables: {
    src: '/assets/bahia/main-room-stage-red-tables.webp',
    alt: 'Club Bahia main room stage with red tables',
  },
  redLoungeVipBooths: {
    src: '/assets/bahia/lounge-vip-booths.webp',
    alt: 'Club Bahia red VIP lounge booths',
  },
  redLoungeNeonRoom: {
    src: '/assets/bahia/red-lounge-neon-room.webp',
    alt: 'Club Bahia red lounge room with neon lighting',
  },
  cocktailsBokeh: {
    src: '/assets/bahia/cocktails-bokeh.webp',
    alt: 'Cocktails at Club Bahia with warm bokeh lights',
  },
  couplesDancingNeonFloor: {
    src: '/assets/bahia/couples-dancing-neon-floor.webp',
    alt: 'Couples dancing on Club Bahia neon dance floor',
  },
  danceFloorLightTrails: {
    src: '/assets/bahia/dance-floor-light-trails.webp',
    alt: 'Club Bahia dance floor with cinematic light trails',
  },
  packedDanceFloorGreenNeon: {
    src: '/assets/bahia/packed-dance-floor-green-neon.webp',
    alt: 'Club Bahia packed dance floor under green neon lights',
  },
  discoBallEmptyDanceFloor: {
    src: '/assets/bahia/disco-ball-empty-dance-floor.webp',
    alt: 'Club Bahia disco ball above an empty dance floor',
  },
  sunsetLineExteriorDay: {
    src: '/assets/bahia/sunset-line-exterior-day.webp',
    alt: 'Guests lined outside Club Bahia on Sunset Boulevard',
  },
  pressRedCurtain: {
    src: '/assets/bahia/press-red-curtain.webp',
    alt: 'Club Bahia press image with red curtain atmosphere',
  },
} as const satisfies Record<BahiaAssetKey, BahiaImageAsset>;
