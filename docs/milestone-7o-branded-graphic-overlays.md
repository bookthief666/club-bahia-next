# Milestone 7O — Branded graphic overlays

## Product objective

Turn an approved clean Club Bahia crop into a finished event-specific promotional graphic without changing the original media, overwriting the reusable crop, or leaving the Growth OS.

The Fold 6 workflow is:

1. choose an approved reusable image or video;
2. select a platform format;
3. keep a clean crop or enable event branding;
4. select the event;
5. review or edit the event title, date, time, and CTA;
6. choose a visual treatment;
7. adjust focal point, zoom, placement, scale, shade, colors, and optional logo;
8. generate a JPEG draft;
9. inspect the exact exported file; and
10. approve that event-and-format version independently.

Nothing publishes from the builder.

## Built-in visual treatments

### Club Bahia Classic

- ivory and gold;
- elegant serif title;
- restrained venue-wide identity; and
- suitable for general Club Bahia promotions.

### Azucar Warm

- warm gold and coral;
- live Latin dance-night positioning;
- selected automatically for Azucar LA Friday and Saturday templates; and
- uses the event template CTA as the initial action line.

### Bahía Nocturna

- dark cinematic gradient;
- restrained red accent;
- selected automatically for Bahía Nocturna events; and
- preserves the event’s alternative-night identity without generic horror styling.

### Minimal Light

- clean white typography;
- reduced decorative framing; and
- useful when the source image already carries strong visual texture.

## Event-grounded defaults

Enabling branding fills the overlay from the selected event:

- public event title;
- Los Angeles venue-local weekday and date;
- Los Angeles venue-local start time;
- recurring-template CTA when available;
- template-aware visual treatment; and
- `CLUB BAHIA` wordmark.

The manager can edit these fields before generation. The exported graphic records the exact reviewed text rather than reading live event data later.

## Identity options

The builder can use:

- a typographic `CLUB BAHIA` wordmark; or
- an active approved image asset marked as a logo in the encrypted Media Library.

A logo reference is accepted only when the catalog still contains an active image asset with that ID. No logo, sponsor mark, performer mark, or identity asset is invented.

## Non-destructive event variants

Clean crops and branded graphics are separate derivatives.

A single canonical photo may therefore safely retain:

- clean Instagram feed portrait;
- clean Story crop;
- Azucar Friday feed graphic;
- Azucar Saturday feed graphic;
- Bahía Nocturna Story graphic;
- website hero for another event; and
- future event-specific versions.

The derivative key combines:

- canonical library asset;
- platform preset; and
- variant key.

Clean versions use `base`. Event graphics use `event-<eventId>`.

Generating or approving one variant cannot replace the clean crop, another platform format, or another event’s graphic.

## Exact public file boundary

Generated JPEGs remain publicly retrievable for Instagram, TikTok, the website, and future Google delivery.

Each file is written to an exact authorized path:

`club-bahia/media-library/assets/<assetId>/derivatives/<presetId>/<variantKey>.jpg`

The upload route accepts only the exact asset, preset, and variant path present in its signed client payload.

The encrypted server-only Media Library catalog stores:

- event relationship;
- overlay text;
- visual treatment;
- focal point and zoom;
- optional video frame;
- optional logo relationship;
- placement and alignment;
- text scale;
- shade and colors;
- draft or approved status;
- canonical source relationship;
- rights metadata; and
- usage history.

## Local browser composition

The authenticated browser performs the complete Canvas composition:

- source image crop or video-frame extraction;
- high-quality resize;
- shade gradient;
- optional approved logo;
- wordmark;
- wrapped event title with adaptive font sizing;
- date and time line;
- CTA pill; and
- JPEG encoding.

The generated JPEG is the same composition the manager reviewed. No external image-design service receives the source media, and no second server-side font or layout pass changes the design after review.

## Approval and validation

Every generated branded graphic begins as draft.

Before saving, the system requires:

- valid source asset;
- exact preset dimensions;
- matching event variant key;
- event ID;
- wordmark;
- event title;
- date;
- time;
- CTA;
- valid treatment, placement, alignment, scale, shade, and colors; and
- active image logo when a logo is selected.

A branded derivative may be assigned only to its own event.

Returning a branded derivative to draft immediately removes its automatic-assignment eligibility.

## Event assignment precedence

For Instagram feed, Story, and website placements, the recommendation and assignment systems now prefer:

1. approved branded graphic for the current event;
2. approved clean platform crop;
3. original canonical asset with a warning.

A graphic for a different event is ignored.

When a manager selects **Use for this post**, the event receives the exact preferred derivative ID. An older clean or previously branded assignment for the same source and platform is replaced in the event workspace.

Reel and TikTok publishing continue to use the approved finished video. A branded static cover never replaces the video itself.

## Scope boundary

Milestone 7O does not yet:

- create vector or layered design files;
- animate overlays;
- burn captions into videos;
- automatically translate overlay text;
- detect faces or reposition typography with AI vision;
- remove image backgrounds;
- retouch source media;
- import brand kits from social accounts; or
- publish from the design builder.

Those capabilities can extend the same event-variant and independent-approval contract.

## Verification coverage

- Azucar events receive warm template-aware defaults.
- Event date and time use `America/Los_Angeles`.
- Overlay recipes require all public fields.
- Clean and event-branded variants coexist for one preset.
- Different events retain separate records and approvals.
- Current-event branded variants outrank clean crops.
- Another event’s graphic is ignored.
- Legacy clean derivative records remain readable.
- Exact derivative references survive event assignment.
- Full repository tests, lint, TypeScript validation, and production build pass.
