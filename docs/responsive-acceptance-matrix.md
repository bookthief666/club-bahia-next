# Club Bahia Responsive Acceptance Matrix

The Club Bahia public website and Growth OS must be device-adaptive rather than optimized for one phone.

## Required viewport coverage

Test every major public and admin workflow at these representative widths:

- 320 px: small phone
- 360 px: common Android phone
- 390 px: modern iPhone / Android
- 430 px: large phone
- 600–820 px: small tablet and portrait tablet
- 1024 px: tablet landscape / small laptop
- 1280 px: laptop
- 1440–1600 px: desktop

Also test phone landscape at approximately 667–932 px wide with limited vertical height.

## Global acceptance rules

- No horizontal page scrolling.
- No clipped buttons, labels, fields, or status controls.
- Tap targets remain at least approximately 44 px high.
- Fixed navigation never covers the final actionable content.
- Long event titles, guest names, email addresses, URLs, and campaign labels wrap or truncate safely.
- Forms remain usable with the mobile keyboard open.
- Dense data expands progressively: one column on narrow phones, two columns on larger phones/tablets, and multi-column layouts on laptops.
- Sidebar navigation appears only when enough width remains for comfortable content.
- Tablet layouts use the full content width instead of forcing a narrow desktop sidebar.
- Public CTAs remain visible and understandable without relying on hover.
- Reduced-motion preferences remain respected.

## Public website routes

Verify:

- `/`
- `/events`
- `/events/[slug]`
- `/reservations`
- `/reservations?event=[slug]`

Check hero typography, event images, badges, event details, forms, confirmation state, footer, and all reservation CTAs.

## Growth OS routes

Verify:

- `/admin`
- `/admin/events`
- `/admin/events/[eventId]`
- `/admin/events/[eventId]/growth`
- `/admin/events/[eventId]/assets`
- `/admin/events/[eventId]/publishing`
- `/admin/events/[eventId]/publishing/execute`
- `/admin/reservations`
- `/admin/calendar`

Check bottom navigation on phones and tablets, sidebar navigation on laptops, sticky headers, cards, filters, exports, message templates, status actions, text areas, and long campaign copy.

## Current shell behavior

- Phones and tablets below the large breakpoint use a compact bottom navigation.
- Laptops and desktops use the sidebar.
- Mobile content includes extra safe-area padding so the bottom navigation does not cover controls.
- The long `Reservations` mobile label is shortened to `Guests` while preserving the full desktop label.
- Page headers become compact on phones and expand on larger screens.
