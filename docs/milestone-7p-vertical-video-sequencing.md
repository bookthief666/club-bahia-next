# Milestone 7P — Vertical-video clip sequencing

## Product objective

Turn the generated 15-second campaign shot plan and approved reusable Club Bahia footage into one reviewed edit recipe for Instagram Reel and TikTok.

The workflow must preserve the distinction between:

- an approved editorial recipe; and
- a rendered, provider-ready MP4.

Milestone 7P builds and approves the recipe. It does not pretend that browser preview playback is a finished video export.

## Staff workflow

Inside **Step 3 — Choose media**:

1. generate the campaign so the vertical-video shot plan exists;
2. open Vertical Video Studio;
3. choose approved reusable video footage;
4. assign footage to the generated shots;
5. set trim start and end points;
6. reorder clips;
7. mute or retain source audio per clip;
8. compare Instagram Reel and TikTok previews;
9. edit the separate platform titles, captions, hashtags, and posting notes;
10. satisfy the deterministic readiness checks;
11. save the draft; and
12. approve the event-specific edit recipe.

Nothing publishes and no final MP4 is created by this milestone.

## Generated shot-plan inheritance

A new project uses the campaign Reel item as its source of truth.

It inherits:

- ordered shot windows;
- shot descriptions;
- on-screen text;
- voice-over guidance;
- target duration;
- Instagram Reel caption package; and
- TikTok caption package.

When the campaign lacks an explicit shot plan, the project receives a conservative four-shot 15-second fallback:

1. Club Bahia establishing shot;
2. atmosphere and dance-floor energy;
3. performer or defining event detail; and
4. event details and CTA.

## Timeline model

Each clip records:

- canonical Media Library asset ID;
- canonical source name and URL;
- known source duration;
- assigned campaign shot;
- trim start;
- trim end;
- timeline order; and
- source-audio choice.

The project supports up to 12 clips.

Timeline duration is calculated from the selected trim windows rather than from source-file durations.

## Readiness rules

Approval requires:

- at least one clip;
- no more than 12 clips;
- every generated shot covered by footage;
- valid trim points;
- each clip at least 0.25 seconds;
- no clip longer than 15 seconds;
- no trim extending beyond a known source duration;
- total timeline duration within 0.25 seconds of the campaign target;
- Instagram Reel caption;
- TikTok caption;
- different Reel and TikTok captions;
- platform titles; and
- no more than 12 hashtags per platform.

Any editorial change returns the project to draft and removes its approval version.

## Separate platform previews

The same shared clip sequence can be previewed in:

- an Instagram Reel presentation; and
- a TikTok presentation.

The preview changes platform chrome, caption, title, hashtags, and posting notes without duplicating the underlying edit timeline.

Preview playback moves through the selected clip order and respects each clip’s trim start and trim end.

The preview is a review aid only. It is not a frame-accurate encoded deliverable and does not guarantee final provider compression, audio behavior, transitions, or color management.

## Encrypted persistence

Video-edit projects use the server-only `video-edit` Growth OS workspace.

The generic browser workspace API cannot read or write this workspace.

The encrypted record stores:

- event relationship;
- campaign item relationship;
- shot plan;
- clip source references;
- trim points and order;
- platform packages;
- content version;
- approval version;
- approval timestamp; and
- revision history through the shared append-only workspace layer.

Optimistic concurrency prevents one browser from silently overwriting another browser’s edit.

## Source canonicalization

The browser cannot approve an arbitrary external media URL.

Before every save or approval, the server reloads the encrypted Media Library and replaces browser-supplied source names, URLs, and durations with the canonical active library record.

The server rejects:

- missing assets;
- archived assets;
- non-video assets;
- unapproved or missing cover derivatives; and
- covers prepared for the wrong platform.

This keeps the edit recipe tied to approved, rights-reviewed Club Bahia media.

## Publishing handoff

Step 4 now reports one of three states:

- sequence not built;
- edit recipe still in draft; or
- edit recipe approved.

An approved recipe does not satisfy the existing final-video media requirement.

Instagram Reel and TikTok scheduling still require an approved finished vertical-video asset. This prevents staff from scheduling a timeline recipe as though it were a real MP4.

## Scope boundary

Milestone 7P does not yet:

- render or transcode MP4 files;
- concatenate video clips;
- add transitions;
- normalize or mix audio;
- burn captions into the video;
- add animated event branding;
- apply LUTs or color correction;
- automatically select footage with AI vision;
- detect beats;
- synchronize cuts to music;
- obtain music licensing; or
- publish from the editor.

The approved recipe is the deterministic input for a future renderer.

## Verification coverage

- Campaign shot-plan inheritance
- Separate Reel and TikTok packages
- Exact target-duration tolerance
- Complete shot coverage
- Source-duration enforcement
- Platform-caption separation
- Approval and approval invalidation
- Canonical Media Library source enforcement
- Archived and non-video source rejection
- Server-only workspace boundary
- Full repository tests, lint, TypeScript validation, and production build
