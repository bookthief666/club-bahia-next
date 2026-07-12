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

### Campaign identity

The audit panel compares:

- official event title
- campaign theme
- optional public subtitle

When the official title and theme read like different events, the workspace warns the operator and offers a public subtitle field. This allows a structure such as:

```text
Sábado Caliente
Noche Oscura — Darkwave, Goth & Post-Punk
```

without silently renaming the underlying event record.

### Deterministic quality checks

The browser performs non-AI checks for:

- event-title / theme conflict
- internal audience language leaking into public copy
- rough placeholder phrases
- English CTAs inside Spanish-only campaigns
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

## Security and safety

- AI output remains draft-only.
- Restore operations reset content to draft.
- No external account is connected.
- No content is published by this milestone.
- The OpenAI secret remains server-only.

## Acceptance criteria

1. A generated campaign displays provider, model, and timestamp when available.
2. A conflicting event title and theme generate a visible warning.
3. Saving a public subtitle removes the identity-conflict warning after reload.
4. Spanish-only campaigns containing an English CTA are flagged.
5. SMS above 300 characters is blocked by a visible error-level finding.
6. A full regeneration preserves the preceding campaign in history.
7. Restoring a prior campaign resets all restored items to draft.
8. The audit panel states that publishing connectors are not yet connected.
9. The production build succeeds before merge.
