# Milestone 7B — AI Event Idea Studio

This checkpoint adds the first operator-facing Growth Copilot workflow.

## Operator workflow

From Events, the manager can now choose between developing an idea with AI and entering a confirmed event manually.

The Event Idea Studio asks for a rough concept, optional date, available talent, intended audience, promotional budget, main goal, desired atmosphere, and constraints.

It returns three materially different event plans. Each plan includes an event title, a concise concept, audience, programming format, timing, cadence, promotion angle, staffing needs, operating needs, risks, a low-cost test, open questions, fit rationale, and a confidence label.

## Evidence discipline

The system does not present unsupported financial or demand claims as facts. Concepts are labeled as Strong hypothesis, Worth a small test, Needs more information, or Operationally difficult.

The OpenAI request receives the typed Club Bahia venue profile from Milestone 7A and is instructed not to invent capacity, performers, pricing, policies, dates, revenue, demand, or historical performance.

## Draft conversion

Choosing Use this plan creates a real shared event draft in the evaluating stage. The selected plan becomes editable event information, and identified risks are preserved on the event record.

The complete selected development plan is retained with the event. The event overview displays its confidence label, fit rationale, people and setup needs, risks, unanswered questions, and recommended first test.

The manager is redirected to the normal event editor to verify the title, date, room, responsible person, and public description before promotion begins.

## Reliability

When live AI is unavailable, a deterministic generator returns three practical starter approaches: a focused pilot, a programmed talent showcase, and a participatory community edition.

The API remains authenticated and can use strict provider behavior through the existing AI environment settings.

## Scope boundary

This checkpoint does not yet add saved idea history, conversational refinement, historical performance comparison, media generation, automatic publishing, or post-event learning recommendations.
