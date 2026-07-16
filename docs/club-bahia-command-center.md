# Club Bahia Command Center

## Product objective
Create a secure, mobile-first operating system for Club Bahia that turns event ideas into scheduled, promoted, staffed, measured nights while also improving reservations, customer follow-up, and day-to-day accountability.

The system should reduce scattered notes, text threads, spreadsheets, and forgotten follow-ups. It should be simple enough to use from a phone during venue operations and structured enough to support repeatable growth.

## Primary users
- Owner / general manager
- Event producer
- Social media and promotions operator
- Door, reservation, and floor staff
- DJs, bands, promoters, and outside collaborators with limited access where appropriate

## Core workflows

### 1. Night and event planning
Create an event from concept through post-event review.

Required fields:
- Event title, concept, date, start/end time, room configuration, capacity target
- Genre, audience, age policy, cover, ticket links, reservation policy
- Talent, promoter, staff assignments, call times, technical needs
- Marketing launch date, content deadlines, flyer status, paid promotion budget
- Revenue targets, guaranteed costs, variable costs, actual results
- Risks, dependencies, permits, and operational notes

Required states:
`idea -> evaluating -> approved -> announced -> on sale -> final prep -> live -> completed -> reviewed -> archived`

### 2. Unified calendar
Provide month, week, agenda, and production-timeline views for:
- Public events
- Private events
- Marketing deadlines
- Staff tasks
- Talent holds and confirmations
- Venue maintenance or blackout dates

Conflict detection must warn about overlapping events, double-booked talent, missing staff, and incomplete launch requirements.

### 3. Reservations and guest management
- Receive and manage reservation requests
- Track status, party size, occasion, notes, contact method, source, and assigned staff member
- Support waitlist, confirmation, cancellation, no-show, and completed states
- Provide a nightly door list optimized for phone use
- Avoid exposing guest data to unauthorized roles

### 4. Talent, promoter, and vendor CRM
Each contact record should support:
- Contact information and preferred channel
- Role and genres
- Past and upcoming bookings
- Rates, deal structure, deposits, hospitality requirements, and documents
- Reliability notes, audience draw, social reach, and post-event evaluation
- Follow-up tasks and relationship history

### 5. Marketing command center
- Campaign calendar connected to each event
- Reusable launch checklist by event type
- Content ideas, captions, assets, approval status, posting date, and platform
- Track Instagram posts, stories, reels, email, SMS, flyers, partner posts, and paid ads
- Generate a shareable event brief and a promoter media kit
- Store performance metrics manually at first; add platform APIs only after the core workflow is stable

### 6. Task and accountability system
- Tasks linked to events, campaigns, contacts, or general operations
- Assignee, owner, due date, priority, dependencies, recurring rules, notes, and proof of completion
- Personal "Today" view and management "At Risk" view
- Automatic checklist creation from event templates

### 7. Financial planning and event review
For every event, track:
- Projected and actual ticket/cover revenue
- Food and beverage estimate and actuals when available
- Talent, promoter, staff, production, security, marketing, and miscellaneous costs
- Break-even attendance
- Net result and variance from plan
- Qualitative review: what worked, what failed, whether to repeat, and changes required

The first release is a planning and reporting tool, not an accounting system.

### 8. Dashboard
The home screen should answer:
- What needs attention today?
- What is happening in the next 14 days?
- Which events are at risk?
- Which reservations require a response?
- Which marketing deliverables are late?
- What money is committed, projected, or unresolved?
- Which contacts need follow-up?

## Initial release scope

### Milestone 1 — Operational shell
- Protected `/admin` route group
- Authentication and role model
- Responsive navigation and dashboard shell
- Seeded demo data
- Today, Upcoming Events, At Risk, and Pending Reservations cards
- Loading, empty, error, and offline-aware states

### Milestone 2 — Events and tasks
- Event CRUD
- Event status workflow
- Calendar and agenda views
- Event templates and generated checklists
- Task assignments, priorities, and deadlines
- Basic conflict warnings

### Milestone 3 — Reservations and door list
- Connect the existing public reservation form to a real backend
- Reservation inbox with filters and status actions
- Mobile door-list mode
- Confirmation templates and contact log
- Audit trail for changes

### Milestone 4 — CRM and marketing
- Talent/promoter/vendor records
- Booking history and evaluation
- Campaign calendar and content queue
- Event brief and media-kit export

### Milestone 5 — Financial review and analytics
- Event budget and break-even calculator
- Actual result entry
- Post-event review
- Repeat-event comparison and simple trend reporting

## Architecture

### Application
- Existing Next.js App Router application
- TypeScript with strict types
- Tailwind CSS and the existing Club Bahia design system
- React Hook Form and Zod for forms and validation
- Framer Motion only where motion improves comprehension

### Backend
Use Supabase for:
- Email/password or magic-link authentication
- Postgres database
- Row-level security
- File storage for contracts, flyers, and approved assets
- Realtime updates only where operationally useful

### Proposed domain tables
- `profiles`
- `roles`
- `events`
- `event_status_history`
- `event_templates`
- `tasks`
- `reservations`
- `reservation_activity`
- `contacts`
- `contact_notes`
- `bookings`
- `campaigns`
- `content_items`
- `budgets`
- `budget_items`
- `event_reviews`
- `attachments`
- `audit_log`

Database design must use migrations and row-level security policies from the first real-data release.

## Roles
- `owner`: full access
- `manager`: most operational access, no destructive account administration
- `producer`: assigned events, tasks, talent, and campaign data
- `marketing`: campaigns, content, event public information, and analytics
- `door`: reservation and door-list access for assigned nights
- `viewer`: read-only access to explicitly permitted records

## Design direction
The admin tool should feel like a serious nighttime venue operating console, not a generic SaaS template.

Visual language:
- Dark tropical noir
- Warm red, amber, and electric accent lighting used sparingly
- Clear information hierarchy and dense-but-readable operational layouts
- Photography reserved for event context rather than dashboard decoration
- Strong mobile bottom navigation and one-handed interactions
- Folded-phone layouts must not rely on horizontal tables
- Unfolded Fold layouts should use the extra width for master-detail views

## Non-negotiable security rules
- No service-role credentials in client code
- No authorization based solely on hidden UI
- Personal guest data accessible only to appropriate roles
- Audit sensitive status changes and exports
- Public reservation endpoints must be rate-limited and validated
- Uploaded files must use restricted buckets and signed URLs where appropriate
- Demo environments use synthetic data only

## Definition of done for each feature
- Functional happy path and meaningful failure handling
- Server-side validation and authorization
- Responsive phone, Fold unfolded, tablet, and desktop behavior
- Accessible labels, focus, keyboard operation, and contrast
- Tests for business-critical rules
- No public-site regression
- Documentation for schema, environment variables, and deployment

## First Codex implementation task
Build Milestone 1 as a reviewable vertical slice on the `codex/club-bahia-command-center` branch.

Deliverables:
1. Protected `/admin` route group with a development-safe mock authentication boundary that is clearly isolated for replacement by Supabase.
2. Club Bahia-styled responsive admin shell.
3. Dashboard populated from typed fixture data through a repository abstraction, not hard-coded directly into components.
4. Cards for Today, Upcoming Events, At Risk, and Pending Reservations.
5. Narrow-phone and Fold-unfolded responsive layouts.
6. Unit tests for dashboard data selectors.
7. Updated README with exact setup, test, build, and next-step instructions.
8. Screenshots or visual evidence in the pull request description.

Do not implement fake production authentication, fake successful reservation submission, or commit credentials.
