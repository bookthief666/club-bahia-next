# AGENTS.md

## Mission
Build and maintain Club Bahia's public website and a secure, mobile-first operations portal without regressing the existing guest-facing experience.

## Product boundaries
- Public website routes remain guest-facing, fast, accessible, and visually polished.
- Staff tools live under `/admin` and must require authentication before exposing operational data.
- Never commit secrets, API keys, service-role keys, customer data, or real reservation records.
- Use environment variables and provide `.env.example` entries for every required variable.

## Technical direction
- Keep the existing Next.js App Router, TypeScript, Tailwind CSS, React Hook Form, Zod, and Framer Motion stack.
- Prefer Server Components by default; use Client Components only when interactivity requires them.
- Keep business logic in testable modules rather than page components.
- Validate all external input at the server boundary with Zod.
- Enforce authorization in server-side code and database policies, not only in the UI.
- Use Supabase for authentication, Postgres data, storage, and row-level security unless an approved architecture document states otherwise.
- Keep third-party integrations behind adapters so they can be replaced without rewriting the UI.

## UX requirements
- Design mobile-first for a Samsung Galaxy Z Fold 6 in both folded and unfolded layouts.
- Preserve comfortable tap targets, visible focus states, keyboard support, semantic labels, and sufficient contrast.
- Avoid generic dashboard aesthetics. The admin experience should use Club Bahia's dark tropical-noir visual language while prioritizing speed and legibility.
- Every destructive action requires a confirmation state and a clear success or error message.
- Every asynchronous screen needs loading, empty, error, and offline-aware states.

## Quality gates
Before marking work complete:
1. Run lint and production build.
2. Add or update tests for business rules and critical forms.
3. Check public routes for regressions.
4. Verify responsive behavior at narrow phone, Fold unfolded, tablet, and desktop widths.
5. Confirm no secrets or personal data appear in the diff.
6. Document schema changes, migrations, and required environment variables.

## Delivery workflow
- Work in focused branches and small pull requests.
- Include a concise implementation summary, screenshots for UI changes, test evidence, migration notes, and known limitations.
- Do not merge placeholder backends or fake success states into production without labeling them clearly.
