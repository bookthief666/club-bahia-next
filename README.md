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

## Club Bahia Command Center — Milestone 2 Events and Calendar

Milestone 2 adds a fixture-backed event-management vertical slice under the protected admin shell. Event business rules live in `lib/admin/events/*` so a later Supabase repository can replace the development adapter without rewriting pages.

### Event architecture and routes

- `/admin/events` — searchable, filterable, sortable event list with mobile cards and desktop scanning layouts.
- `/admin/events/new` — React Hook Form + Zod event creation form.
- `/admin/events/[eventId]` — event detail, warnings, status summary, and destructive actions.
- `/admin/events/[eventId]/edit` — validated event editing form.
- `/admin/calendar` — dependency-light month, week, and agenda calendar views.

Money is stored as integer cents. Event dates are local `YYYY-MM-DD` strings with `HH:mm` times and the documented initial venue timezone `America/Los_Angeles` to avoid browser-dependent UTC date shifting. Cross-midnight events keep the same event date and a later operational end time.

### Fixture repository behavior

`StaticFixtureEventRepository` serves read-only data during server rendering. `BrowserFixtureEventRepository` is explicitly development-only and stores mutations in browser `localStorage` under `club-bahia-dev-events-v1`; this is not production persistence and may be reset by clearing browser storage. Production should replace this with Supabase tables, RLS, authorization checks, status-change audit logs, and guarded destructive operations.

### Status workflow

Centralized status metadata is defined in `lib/admin/events/domain.ts` for: `idea`, `planning`, `approved`, `marketing`, `on_sale`, `final_prep`, `live`, `completed`, `cancelled`, and `archived`. The metadata controls labels, descriptions, visual treatments, sort order, active/public classifications, attention flags, and allowed transitions. Cancelled events require a reason. `live` is restricted to the current Los Angeles local date by default.

### Risk rules

At-risk selectors derive warnings when an active event is approved or later without promotion readiness, is within seven days without staffing readiness, has expected attendance above capacity, is in final prep with unresolved warnings, or has a past event date while still active. Archived events are excluded from active queues; cancelled events remain distinct from archived records.

### Responsive review

Review the admin event list, event form, event detail, and calendar at 360–390px narrow phone widths, ~375px Fold folded, ~690px Fold unfolded, tablet widths, and desktop widths. The event list uses cards instead of horizontal tables on phones, while the calendar uses compact month/week cards and a phone-optimized agenda view.

### Verification

```bash
npm test
npm run lint
npm run build
```

### Known limitations

No production database, authentication replacement, reservation backend, ticketing, marketing API, drag-and-drop calendar editing, audit log, or notifications are included in this milestone. Destructive actions are intentionally labeled fixture-mode actions and must receive authorization and audit controls before production use.

## Club Bahia Growth Copilot — Milestone 7A

Milestone 7A begins the transition from campaign-copy generation into a venue-aware promotion system.

- Adds a typed Club Bahia venue profile with verified facts, event-specific policy handling, brand voice, preferred calls to action, prohibited claims, and campaign guardrails.
- Grounds OpenAI campaign requests in the verified venue profile while keeping event details authoritative.
- Adds backward-compatible structured promotion fields for hooks, caption variants, hashtag groups, Story frames, Reel shots, email subjects, SMS variants, and alt text.
- Preserves structured promotion data through shared-workspace migration and revision history.
- Simplifies the manager workflow to Event details → Create promotion → Choose media → Review posts → Promote event.
- Replaces stale prototype language in the event form and primary navigation.

Verification for this checkpoint:

- 19 test files passed
- 98 tests passed
- Next.js 15.5.20 production build passed
- Vercel deployment reported success

See `docs/milestone-7a-venue-intelligence.md` for scope and boundaries.
