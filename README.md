# Club Bahia Asset Pack v2

Drop this folder structure into the repo root.

Files go to:
- `public/assets/bahia/*`
- `lib/assets/bahia-assets.ts`

This v2 pack includes the original optimized venue images plus the new dance-floor / disco-ball / press images. Duplicate checks were done against the existing v1 filenames and visual hashes; the six new uploads are unique enough to keep.

## Recommended usage

### Strong homepage / background candidates
- `exterior-night-sunset-blvd.webp` — homepage hero / Sunset Blvd exterior scene
- `disco-ball-empty-dance-floor.webp` — strongest cinematic hero or transition background
- `couples-dancing-neon-floor.webp` — LIVE MUSIC. HOT KITCHEN. BIG DANCE FLOOR. atmosphere
- `dance-floor-light-trails.webp` — motion/energy background

### Venue proof / story candidates
- `bar-neon-palms.webp` — Our Story / bar scene
- `packed-dance-floor-green-neon.webp` — social proof, event energy
- `live-dance-crowd-stage.webp` — live/event proof
- `sunset-line-exterior-day.webp` — line outside the venue / Sunset Blvd history
- `social-collage-exterior-dancefloor.webp` — archive/social proof

### Reservations / hospitality candidates
- `lounge-vip-booths.webp` — reservations route atmosphere
- `red-lounge-neon-room.webp` — booth/private event atmosphere
- `cocktails-bokeh.webp` — drinks/reservation accent

### Use with care
- `press-red-curtain-newspaper.webp` — only use publicly if the person shown and the newspaper image usage are cleared.

## Notes
- Do not use reservation UI screenshots as website assets.
- If an image contains clearly identifiable patrons, confirm the venue has usage rights/consent before public deployment.
- Use `next/image`, responsive `sizes`, and dark overlays for readability.

## Club Bahia Command Center — Milestone 1

The `/admin` route is a reviewable operational-shell vertical slice for GitHub issue #25. It is protected by an isolated development mock-auth boundary in `lib/admin/mock-auth.ts`; this intentionally does **not** implement production authentication and is designed to be replaced by Supabase auth, RLS-backed repositories, and audit logging in later milestones.

### Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000/admin`. In non-production builds the mock admin user is enabled by default. To exercise the explicit development boundary, set:

```bash
ADMIN_DEV_AUTH_ENABLED=true
ADMIN_DEV_USER_NAME="Maya Rivera"
ADMIN_DEV_USER_ROLE=owner
```

No real reservation, customer, credential, or service-role data is used. Dashboard records come from typed synthetic fixtures through `createCommandCenterRepository()`.

### Verification commands

```bash
npm test
npm run lint
npm run build
```

### Responsive review targets

Review `/admin` at these widths before merging follow-up work:

- Narrow phone: 320px
- Samsung Galaxy Z Fold 6 folded: ~375px
- Samsung Galaxy Z Fold 6 unfolded: ~690px
- Tablet: 768px–1024px
- Desktop: 1280px+

### Milestone 1 limitations and next steps

- Mock auth is development-only and redirects away from `/admin` in production unless explicitly replaced.
- Fixture data is read-only and synthetic; no reservation submission path was changed.
- Next steps: replace the mock boundary with Supabase auth, add database migrations and RLS, connect repositories to Supabase, add role-scoped reservation visibility, and add browser-based visual regression coverage for public routes and the admin shell.
