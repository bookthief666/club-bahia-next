# Milestone 7C — Promotion Autopilot Foundation

Milestone 7C redirects the Growth OS away from embedded event brainstorming and toward execution, orchestration, automation, and measurement.

## Product principle

Use AI for content. Use software for execution, persistence, coordination, automation, and measurement.

The Event Idea Studio remains available only as an optional Labs feature. The primary workflow begins with confirmed event facts.

## Primary workflow

1. Enter event facts.
2. Upload the flyer, photos, and videos.
3. Generate the promotion package.
4. Approve the publishing schedule.
5. Publish automatically through connected accounts.
6. Review results and reservations.

## Factual event record

The event editor now captures the information that promotional channels need:

- event name
- date and start time
- public description and special details
- performers, DJs, bands, and hosts
- music, genres, or event style
- admission or cover
- event-specific age policy
- reservation or ticket URL
- existing flyer or primary media URL
- room and responsible operator

These fields form the source of truth for website copy, social captions, hashtags, flyer prompts, tracked links, and publishing jobs.

## Autopilot domain

The foundation introduces explicit publishing concepts:

- social provider and capability state
- prepare-only, approve-each, and approve-campaign modes
- durable publishing-job statuses
- content and media versions
- approval invalidation when content or media changes
- stable idempotency keys to prevent duplicate retries
- per-channel UTM campaign links
- due-job checks that require approved versions to match current versions

## Connected-account readiness

The new Publishing Connections screen reports safe configuration presence without exposing credentials. It covers:

- Meta application configuration
- Facebook Page and Instagram professional account readiness
- supported and planned Meta publishing capabilities
- Google Business Profile OAuth and venue-location readiness
- transactional publishing database readiness
- authenticated scheduler-trigger readiness

Automatic publishing remains gated until the provider connections and durable execution infrastructure are complete.

## Current boundary

This checkpoint does not yet send a live post. The next proof of concept will:

1. connect the authorized Meta account;
2. publish one controlled Instagram image post;
3. save the provider publication ID and public URL;
4. reconcile uncertain responses before retrying; and
5. prove that a repeated request does not create a duplicate post.

After that proof, the build continues through scheduled Meta publishing, Facebook Page posts, Google Business Profile event posts, recurring-night templates, media preparation, analytics, and performer sharing kits.
