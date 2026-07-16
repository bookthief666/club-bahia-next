# Universal Promotion Review Inbox

## Purpose

The Universal Promotion Review Inbox reduces event-by-event navigation without creating a separate workflow for Azucar LA or any other recurring performer.

Staff open it from the Growth OS Home screen or through `/admin/review`. It aggregates promotion work for active events and preserves the existing event workflow as the place for detailed editing, media preparation, scheduling, and publication.

## Review lanes

- **Needs review** — draft copy still needs human judgment or contains deterministic quality findings.
- **Missing media** — a visual channel does not yet have an approved compatible assignment, or protected media cannot be verified.
- **Ready to approve** — a draft passes copy, media, conversion-link, rights/session, and planned-delivery checks.
- **Approved** — copy has been approved but scheduling and publication remain separate.
- **Publishing problems** — a provider job is failed, paused, or waiting for media.
- **All** — every active-event campaign item loaded by the inbox.

## Safe batch operations

### Assign approved media

The inbox may assign the highest-ranked compatible asset only when:

- the asset is already approved;
- its platform assignment matches the campaign channel;
- the event has no current compatible primary assignment; and
- protected media access is available.

The action never uploads a file, approves a draft asset, changes rights information, or publishes a post.

### Approve safe selected

Bulk approval includes only draft content that currently passes all blocking gates:

- no warning- or error-level campaign quality finding applies to the item;
- required visual media is assigned and verified;
- the campaign has its required final reservation or ticket link;
- a delivery time is planned; and
- protected media access is available when the channel requires media.

Approval changes the copy state only. It does not create or approve provider queue jobs, schedule a post, or publish anything.

## Individual actions

Each review card links back to the existing event tools:

- **Improve with AI** regenerates only that channel and returns it to draft.
- **Edit copy** opens Step 2.
- **Choose media** opens Step 3.
- **Review package** opens Step 4.
- **Schedule or publish** opens Step 5 only after the package is ready.

## Partial-failure behavior

The inbox is intentionally resilient:

- an unavailable publishing queue does not block copy or media review;
- one unreachable media record does not blank other events;
- one conflicted growth or post-assignment workspace is omitted with a visible event-specific warning;
- visual posts remain blocked from bulk approval whenever media cannot be verified.

The loader reviews at most 40 active events per refresh and limits concurrent event reads to four.

## Security boundary

- `/admin/review` remains protected by the signed Growth OS session.
- The route redirects internally to the Home-based review mode so the Fold 6 navigation remains at five primary destinations.
- Guest information is not loaded or displayed.
- Provider credentials, tokens, and secret values are not loaded by the inbox.
- The event media API and publishing queue keep their existing server-side authorization boundaries.

## Verification

Automated coverage includes:

- a fully verified draft becoming batch-approvable;
- approved media being recommended but not silently assigned;
- warning-level campaign copy blocking batch approval;
- locked media preventing visual approval;
- provider failures taking priority in the problems lane;
- cross-event summary and filter behavior; and
- release smoke validation that `/admin/review` redirects unauthenticated visitors to login.
