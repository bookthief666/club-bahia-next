# Milestone 4B — Campaign Post Assembly

## Purpose

Combine approved campaign copy with the exact approved flyer, Story creative, or Reel intended for each destination. This creates a complete, inspectable post package without pretending that any external publishing connector is active.

## New route

```text
/admin/events/{eventId}/publishing
```

The route is accessible from event rows, the Growth Workspace, and the Event Asset Studio.

## Post packages

Each generated campaign item can store:

- campaign content item ID
- channel
- assigned asset IDs
- primary asset ID
- last update time

Assignments remain browser-local development state because campaign persistence is still browser-local. The approved media itself remains in shared Vercel Blob storage.

## Automatic media matching

**Auto-assign best media** selects the strongest approved compatible asset available for each channel.

Priority examples:

- Website: primary flyer, venue photo, performer photo
- Instagram feed: feed creative, primary flyer, performer photo
- Story: Story creative, then finished vertical video
- Reel: approved finished Reel only
- Facebook: feed creative, primary flyer, venue photo
- Email: optional approved image
- SMS: no media required

Existing valid manual assignments are preserved when auto-assignment runs.

## Readiness model

A post package is ready only when all required checks pass:

1. Copy is approved, scheduled, or published.
2. Required media is approved, assigned to the destination, and compatible with the channel.
3. A final reservation or ticket URL exists when the campaign objective requires conversion.
4. A suggested delivery time is recorded.

Email and SMS can be ready without media. Website, Instagram feed, Story, Reel, and Facebook require approved media.

## Truthful delivery status

The interface continues to identify current delivery reality:

- Website connector not installed
- Instagram / Story / Reel / Facebook: manual publishing
- Email: manual publishing
- SMS: manual publishing

This milestone does not publish content.

## Current limitations

- Asset assignments are browser-local until the shared campaign database is implemented.
- Aspect ratio, image dimensions, safe zones, video duration, frame rate, and audio rights are not yet machine-validated.
- A file being assigned to Story does not prove it is truly 9:16.
- Platform captions, tags, location IDs, collaborator tags, and music selections are not yet structured delivery fields.
- External platform connectors are not active.

## Acceptance criteria

1. Approved cloud assets load after the Event Asset Studio has been unlocked in the browser session.
2. Each campaign item displays its copy, delivery plan, selected asset, and readiness checks.
3. A Reel can only use an approved asset with the finished-Reel role and Reel destination.
4. Draft media never appears as a valid assignment.
5. Required-media channels remain blocked until media is assigned.
6. Reservation or ticket campaigns remain blocked until a final destination URL exists.
7. Draft campaign copy remains blocked even when media is complete.
8. Email and SMS can pass the media check without an asset.
9. Auto-assignment chooses channel-specific approved media where available.
10. No interface claims that content has been published or scheduled through a live connector.
