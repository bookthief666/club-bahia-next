export const bahiaAssets = [
  {
    "key": "heroExteriorNight",
    "src": "/assets/bahia/exterior-night-sunset-blvd.webp",
    "alt": "Exterior night view on Sunset Blvd with marquee, mural, skyline",
    "role": "hero/background",
    "width": 1536,
    "height": 1151,
    "sourceUpload": "11497.webp"
  },
  {
    "key": "barNeonPalms",
    "src": "/assets/bahia/bar-neon-palms.webp",
    "alt": "Club Bahia bar with green neon palm signage and bottle glow",
    "role": "overlay/story",
    "width": 1536,
    "height": 1154,
    "sourceUpload": "11494.jpg"
  },
  {
    "key": "mainRoomStage",
    "src": "/assets/bahia/main-room-stage-red-tables.webp",
    "alt": "Main room with stage, red chairs, tables, colored nightclub lighting",
    "role": "scene/background",
    "width": 1536,
    "height": 1024,
    "sourceUpload": "11491.jpg"
  },
  {
    "key": "redLoungeNeon",
    "src": "/assets/bahia/red-lounge-neon-room.webp",
    "alt": "Red lounge seating with neon Club Bahia palms",
    "role": "scene/background",
    "width": 1536,
    "height": 1152,
    "sourceUpload": "11493.jpg"
  },
  {
    "key": "loungeVipBooths",
    "src": "/assets/bahia/lounge-vip-booths.webp",
    "alt": "VIP lounge booth area with red seating and glowing cube tables",
    "role": "reservation/background",
    "width": 1536,
    "height": 1024,
    "sourceUpload": "11492.jpg"
  },
  {
    "key": "cocktailsBokeh",
    "src": "/assets/bahia/cocktails-bokeh.webp",
    "alt": "Cocktails on table with club lights blurred in background",
    "role": "reservation/accent",
    "width": 865,
    "height": 1536,
    "sourceUpload": "11496.webp"
  },
  {
    "key": "exteriorLineDay",
    "src": "/assets/bahia/sunset-line-exterior-day.webp",
    "alt": "Daytime exterior line outside Club Bahia on Sunset Blvd",
    "role": "story/proof",
    "width": 1536,
    "height": 1536,
    "sourceUpload": "11490.jpg"
  },
  {
    "key": "socialCollage",
    "src": "/assets/bahia/social-collage-exterior-dancefloor.webp",
    "alt": "Collage of Club Bahia exterior, guests, and dancefloor",
    "role": "gallery/proof",
    "width": 1536,
    "height": 1536,
    "sourceUpload": "11495.jpg"
  },
  {
    "key": "pressRedCurtainNewspaper",
    "src": "/assets/bahia/press-red-curtain-newspaper.webp",
    "alt": "Person standing before red velvet curtains holding a newspaper clipping about a Club Bahia event",
    "role": "story/press",
    "width": 1536,
    "height": 1021,
    "sourceUpload": "11503.jpg",
    "publicUseNote": "Use only with appropriate permission from the person shown."
  },
  {
    "key": "danceFloorLightTrails",
    "src": "/assets/bahia/dance-floor-light-trails.webp",
    "alt": "Guests dancing on a nightclub floor with red and green light trails",
    "role": "scene/background",
    "width": 1536,
    "height": 1021,
    "sourceUpload": "11502.jpg",
    "publicUseNote": "Crowd image; confirm usage rights/consent before public deployment."
  },
  {
    "key": "packedDanceFloorGreenNeon",
    "src": "/assets/bahia/packed-dance-floor-green-neon.webp",
    "alt": "Packed Club Bahia dance floor with guests cheering beneath green neon signage",
    "role": "scene/proof",
    "width": 1536,
    "height": 1018,
    "sourceUpload": "11501.jpg",
    "publicUseNote": "Crowd image; confirm usage rights/consent before public deployment."
  },
  {
    "key": "discoBallEmptyDanceFloor",
    "src": "/assets/bahia/disco-ball-empty-dance-floor.webp",
    "alt": "Club Bahia dance floor with disco ball, green neon signage, and warm lens flares",
    "role": "hero/background",
    "width": 1536,
    "height": 1018,
    "sourceUpload": "11500.jpg",
    "publicUseNote": "Strong candidate for hero/background; no close identifiable faces."
  },
  {
    "key": "liveDanceCrowdStage",
    "src": "/assets/bahia/live-dance-crowd-stage.webp",
    "alt": "Club Bahia dance crowd near the stage under red lights",
    "role": "scene/event",
    "width": 1536,
    "height": 1018,
    "sourceUpload": "11499.jpg",
    "publicUseNote": "Crowd image; confirm usage rights/consent before public deployment."
  },
  {
    "key": "couplesDancingNeonFloor",
    "src": "/assets/bahia/couples-dancing-neon-floor.webp",
    "alt": "Couples dancing at Club Bahia under red and green neon lighting",
    "role": "scene/background",
    "width": 1536,
    "height": 1018,
    "sourceUpload": "11498.jpg",
    "publicUseNote": "Crowd image; confirm usage rights/consent before public deployment."
  }
] as const;

export type BahiaAssetKey = typeof bahiaAssets[number]['key'];
