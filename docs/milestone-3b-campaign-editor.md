# Milestone 3B — Campaign Editor and Quality Pass

## Purpose

Make generated campaign content safe and practical enough to review for a real Club Bahia event before adding external AI or publishing connectors.

## Improvements

- Campaign brief collapses after generation so content appears sooner on mobile.
- Every campaign item can be edited and saved independently.
- Every campaign item can be regenerated independently.
- Editing or regenerating an item returns it to draft status.
- Campaign states now follow a constrained sequence:
  - draft → approved
  - approved → scheduled → published for connector-ready channels
  - approved → published for manual channels
- The old `manual` status is migrated to `approved` with `publishingMode: manual`.
- Campaign briefs now include performers, genres, attraction, doors, admission, age limit, food/drink offer, reservation URL, language, address, and objective.
- English, Spanish, and bilingual output are supported by the deterministic fixture generator.
- Internal target-audience strategy no longer appears verbatim in public copy.
- Event rows expose a direct Growth action.
- Extra bottom safe-area spacing prevents the fixed navigation from covering the final content card.

## Persistence compatibility

The browser repository normalizes older localStorage records into the new schema. Existing fixture campaigns should continue to open without manually clearing browser storage.

## Still intentionally excluded

- Real model calls
- Social OAuth
- Direct Instagram, Facebook, email, or SMS publishing
- Shared database persistence
- Asset generation
- Automatic posting without explicit approval

## Acceptance criteria

1. A campaign brief can be expanded, edited, saved, and collapsed.
2. One content item can be edited without regenerating the whole campaign.
3. One content item can be regenerated without changing other items.
4. Public-facing copy does not repeat the internal audience field.
5. Every content item exposes only the next valid workflow action.
6. The last content card remains fully visible above mobile navigation.
7. Production build, lint, and tests pass before merge.
