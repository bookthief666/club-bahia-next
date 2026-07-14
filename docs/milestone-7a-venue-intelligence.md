# Milestone 7A — Venue intelligence and structured promotion foundation

This checkpoint begins the transition from a campaign-copy workspace into the Club Bahia Growth Copilot.

## Venue intelligence

The application now has a typed Club Bahia venue profile that separates:

- verified venue facts
- event-specific policies that must be confirmed for each event
- brand-voice guidance
- preferred calls to action
- prohibited claims
- campaign guardrails

The AI generation request receives this profile as factual and brand guidance. Event-specific details still override venue defaults, and missing facts must be omitted rather than invented.

## Structured promotion data

Campaign items can now retain structured, channel-native material in addition to the existing editable body copy:

- primary and alternative hooks
- short, standard, and long captions
- branded, local-discovery, and music-community hashtag groups
- Story frames and interaction suggestions
- Reel shots, timestamps, voiceover, and thumbnail text
- email subject alternatives and preheader
- SMS variants
- accessibility alt text

Existing campaign records remain compatible because structured content is optional and validated during migration.

## Deterministic fallback

The fixture generator now produces structured promotion data for all seven existing channels. Real AI copy continues to replace the public body while the deterministic structure provides a safe migration foundation. A later checkpoint will ask the AI provider to generate richer structured variants directly.

## Manager-facing language

The primary workflow now uses clearer language:

1. Event details
2. Create promotion
3. Choose media
4. Review posts
5. Promote event

Admin navigation now uses Guests and Schedule, and stale prototype language was removed from the event form.

## Scope boundary

This checkpoint does not add:

- the AI Event Idea Studio
- conversational rewrite controls
- a unified structured-content review screen
- automatic social publishing
- post-event outcomes and learning recommendations

Those remain the next Milestone 7 checkpoints.
