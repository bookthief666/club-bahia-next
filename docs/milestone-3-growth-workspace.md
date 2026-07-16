# Milestone 3 — Event Growth Workspace

## Purpose

Create the first growth-focused vertical slice for Club Bahia. The workspace turns an existing event into a coordinated promotional campaign without introducing real social publishing or AI credentials yet.

## User outcome

From an event detail page, a manager can:

1. Open the Growth Workspace.
2. Define a campaign brief.
3. Generate coordinated drafts for the website, Instagram, Stories, Reels, Facebook, email, and SMS.
4. Review copy and creative prompts.
5. Approve or mark items as scheduled/manual.
6. See a promotion timeline and readiness score.

## Route

`/admin/events/[eventId]/growth`

## Architecture

- `lib/admin/growth/domain.ts` contains provider-neutral campaign types.
- `lib/admin/growth/generator.ts` contains a deterministic fixture generator implementing `CampaignGenerator`.
- `lib/admin/growth/repository.ts` stores development-only workspaces in browser `localStorage` behind a repository boundary.
- `components/admin/growth/EventGrowthWorkspaceClient.tsx` provides the mobile-first workspace UI.

The generator interface is intentionally replaceable. A future server-side OpenAI or other provider adapter can implement the same contract without rewriting the workspace UI.

## Human approval rule

Every generated item begins in `draft`. No content is sent to an external platform. Approval and scheduling statuses are local planning state only.

## Current limitations

- Fixture AI generation is deterministic and does not call a model.
- Browser-local persistence is development-only.
- No image, video, email, SMS, or social publishing connector is active.
- No shared multi-user database exists yet.
- Content editing beyond the campaign brief is not implemented in this slice.

## Next implementation slice

1. Add editable content drafts with revision history.
2. Add a server-side AI provider adapter with structured-output validation.
3. Add campaign templates for Latin live music, darkwave/goth, private events, and recurring nights.
4. Add a connector registry and approval queue.
5. Connect the public event page as the first safe publishing target.
