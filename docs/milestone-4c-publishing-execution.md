# Milestone 4C — Publishing Execution Queue

## Purpose

Turn a fully assembled `7/7` campaign into a practical operator queue for real manual publishing while external connectors remain unavailable.

## New route

```text
/admin/events/{eventId}/publishing/execute
```

## Capabilities

Each channel package displays:

- final approved copy
- assigned approved media
- planned publishing time
- reservation or ticket link
- media alt text when available
- execution notes
- optional final published-post URL
- current manual execution status

Operators can:

- copy the complete post package
- open the approved image or video
- edit the planned execution time
- mark an item scheduled manually
- mark an item published manually only after confirming it is live
- record the published URL
- skip or reopen a channel
- export a complete JSON campaign manifest
- export a CSV copy sheet

## Status model

```text
ready → scheduled → published
ready → published
ready/scheduled → skipped
published/skipped → ready
```

The queue never claims that a platform connector performed an action. Every state transition is explicitly manual.

## Readiness boundary

Execution remains blocked until Post Assembly verifies:

1. copy approval
2. required approved compatible media
3. conversion URL for reservation/ticket campaigns
4. planned delivery time

Email and SMS can execute without media. Visual channels require an approved compatible asset.

## Persistence

Execution status, times, notes, and published URLs remain browser-local development state. Media remains shared in Vercel Blob. Shared campaign persistence and real authentication remain future milestones.

## Export formats

### JSON manifest

Includes event identity, campaign objective, language, conversion URL, all channel copy, schedule, asset name and URL, alt text, execution status, notes, and published URL.

### CSV copy sheet

Provides a spreadsheet-friendly operational handoff for collaborators or manual publishing outside the app.

## Scope boundary

This milestone does not:

- publish to Meta, TikTok, email, SMS, or the website
- schedule jobs with an external provider
- validate social handles, collaborator tags, music licensing, or platform-specific safe zones
- persist execution status across browsers or team members
- replace real production authentication
