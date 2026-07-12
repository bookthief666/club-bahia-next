# Milestone 3D — Campaign Quality, Provenance, and Identity

## Purpose

Make AI-generated campaigns auditable and safer to publish before any external posting connector is enabled.

## Added

### Campaign provenance

The workspace records and displays:

- generation provider (`openai` or `fixture`)
- model name when available
- generation timestamp
- provider fallback warning when applicable

### Event identity

The event title entered when an event is created is the single public event name. The campaign theme is internal creative direction only.

The audit panel now displays:

- public event name
- internal campaign direction
- a direct link to edit the event record

The AI prompt is required to keep the event title as the only public name and may not present the campaign theme as a second title or subtitle.

### Deterministic quality checks

The browser performs non-AI checks for:

- public event name missing from generated copy
- internal audience language leaking into public copy
- rough placeholder phrases
- English CTAs inside Spanish-only campaigns
- English CTAs inside Spanish sections of bilingual campaigns
- SMS content above 300 characters
- missing reservation or ticket URL for conversion objectives
- repeated lines across multiple channels
- empty campaign items

These checks produce a quality score and actionable findings. They do not replace human review.

### Revision history

Before a full campaign regeneration, the previous campaign is preserved in browser storage. The five most recent full generations are retained.

A prior generation can be restored as a new draft. Restored content never preserves an approved or published state.

### Connection truthfulness

The audit panel explicitly identifies current connection status:

- Club Bahia website: not connected
- Instagram / Facebook: manual publishing
- Email: manual publishing
- SMS: manual publishing

No UI audit status should imply that an external connector exists when it does not.

## Persistence

Campaign audit data and revisions remain development-only browser localStorage state. They are not shared between devices or users.

A deprecated preview-only subtitle value may remain in old browser records, but it is ignored by current generation and is no longer shown in the interface.

## Security and safety

- AI output remains draft-only.
- Restore operations reset content to draft.
- No external account is connected.
- No content is published by this milestone.
- The OpenAI secret remains server-only.

## Acceptance criteria

1. A generated campaign displays provider, model, and timestamp when available.
2. The event title is displayed as the sole public event name.
3. The campaign theme is clearly labeled as internal creative direction.
4. Generated copy that omits the public event name is flagged.
5. Spanish-only or bilingual Spanish sections containing English CTAs are flagged.
6. SMS above 300 characters receives a visible error-level finding.
7. A full regeneration preserves the preceding campaign in history.
8. Restoring a prior campaign resets all restored items to draft.
9. The audit panel states that publishing connectors are not yet connected.
10. The production build succeeds before merge.
