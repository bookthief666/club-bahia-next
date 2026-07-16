# Milestone 3E — Campaign Review Optimization

## Purpose

Turn the generated campaign into a fast, truthful, mobile-first review queue that can be used during real Club Bahia event promotion.

## Improvements

### Compact mobile review

- Campaign cards start collapsed with a concise preview.
- Full copy opens only when requested.
- Editing automatically opens the complete item.
- Visual prompts remain hidden until the item is expanded.
- A sticky filter bar separates all content, drafts needing review, approved content, and published content.

### Truthful publishing state

- The website card now says **Website publishing not connected**.
- Social, email, and SMS cards say **Manual publishing**.
- An approved website item cannot be marked scheduled while no connector exists.
- The timeline explicitly states that its dates are planning dates rather than active publishing jobs.

### Inline campaign setup validation

- Reservation and ticket campaigns require a public conversion URL before generation.
- The warning appears beside the URL field rather than only in the audit panel.
- Campaign generation is disabled while that required URL is missing.
- The interface warns operators to use a final public URL rather than a temporary Vercel preview address.

### Safer approval

- Empty items cannot be approved.
- SMS items above 300 characters cannot be approved.
- Blocking reasons appear directly on the affected campaign card.

### Faster workflow

- The overview shows drafts remaining rather than only total campaign assets.
- The primary action opens the draft review queue.
- Full-campaign regeneration is relabeled **Improve all with AI** and requires confirmation because it creates a saved revision.
- Per-item regeneration is relabeled **Improve item**.
- Quality and readiness are displayed separately.

## Scope boundary

This milestone still does not connect or publish to the Club Bahia website, Meta, email, or SMS providers. It makes those states explicit and prepares the review workflow for the first real connector.

## Acceptance criteria

1. Long content cards are collapsed by default on mobile.
2. A reviewer can filter directly to drafts that need attention.
3. Website copy never displays a misleading connector-ready state.
4. A conversion campaign cannot regenerate without a destination URL.
5. Overlong SMS content cannot be approved.
6. Approved website copy remains waiting for the future website connector.
7. Full campaign improvement preserves revision history through the existing repository behavior.
8. The production build succeeds before merge.
