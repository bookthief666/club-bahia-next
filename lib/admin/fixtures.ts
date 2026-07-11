import type { CommandCenterData } from './domain';

export const commandCenterFixture: CommandCenterData = {
  generatedAt: '2026-08-08T14:00:00.000Z',
  user: { id: 'usr-dev-owner', name: 'Maya Rivera', role: 'owner', avatarInitials: 'MR' },
  events: [
    { id: 'evt-sabado-caliente', title: 'Sábado Caliente', concept: 'Salsa, bachata, and late-night kitchen push', startsAt: '2026-08-08T21:00:00.000Z', endsAt: '2026-08-09T05:00:00.000Z', status: 'final-prep', room: 'Main room', capacityTarget: 420, ticketsSold: 238, owner: 'Luis', marketingLaunchAt: '2026-07-29T18:00:00.000Z', riskFlags: ['Security call time unconfirmed'], revenueTarget: 18000, committedCosts: 6200 },
    { id: 'evt-domingo-live', title: 'Domingo Live Band Showcase', concept: 'Tropical live set with early table service', startsAt: '2026-08-09T20:00:00.000Z', endsAt: '2026-08-10T03:00:00.000Z', status: 'announced', room: 'Main room', capacityTarget: 280, ticketsSold: 91, owner: 'Maya', marketingLaunchAt: '2026-08-04T18:00:00.000Z', riskFlags: ['Flyer approval late', 'Ticket pace below target'], revenueTarget: 12500, committedCosts: 5400 },
    { id: 'evt-cumbia-friday', title: 'Cumbia Friday', concept: 'Guest DJ and promoter collab', startsAt: '2026-08-14T22:00:00.000Z', endsAt: '2026-08-15T05:00:00.000Z', status: 'on-sale', room: 'Main room + patio', capacityTarget: 500, ticketsSold: 226, owner: 'Nina', marketingLaunchAt: '2026-08-05T18:00:00.000Z', riskFlags: [], revenueTarget: 22000, committedCosts: 8100 },
    { id: 'evt-private-quince', title: 'Private Quinceañera Hold', concept: 'Private event hold pending deposit', startsAt: '2026-08-21T19:00:00.000Z', endsAt: '2026-08-22T02:00:00.000Z', status: 'evaluating', room: 'Full venue', capacityTarget: 240, ticketsSold: 0, owner: 'Luis', marketingLaunchAt: '2026-08-12T18:00:00.000Z', riskFlags: ['Deposit unresolved', 'Staffing estimate missing'], revenueTarget: 16000, committedCosts: 3000 },
  ],
  tasks: [
    { id: 'tsk-door-list', title: 'Lock door list and VIP booth notes', dueAt: '2026-08-08T18:00:00.000Z', priority: 'urgent', owner: 'Door lead', linkedEventId: 'evt-sabado-caliente', completed: false },
    { id: 'tsk-band-deposit', title: 'Confirm live band deposit receipt', dueAt: '2026-08-08T20:00:00.000Z', priority: 'high', owner: 'Maya', linkedEventId: 'evt-domingo-live', completed: false },
    { id: 'tsk-content-pack', title: 'Approve Cumbia Friday reels pack', dueAt: '2026-08-10T19:00:00.000Z', priority: 'normal', owner: 'Nina', linkedEventId: 'evt-cumbia-friday', completed: false },
  ],
  reservations: [
    { id: 'res-001', guestName: 'Synthetic guest A', partySize: 8, occasion: 'Birthday', requestedAt: '2026-08-08T13:20:00.000Z', eventId: 'evt-sabado-caliente', source: 'Website', status: 'new' },
    { id: 'res-002', guestName: 'Synthetic guest B', partySize: 4, occasion: 'Date night', requestedAt: '2026-08-07T23:40:00.000Z', eventId: 'evt-domingo-live', source: 'Instagram DM', status: 'pending', assignedTo: 'Door lead' },
    { id: 'res-003', guestName: 'Synthetic guest C', partySize: 12, occasion: 'After work', requestedAt: '2026-08-06T18:10:00.000Z', eventId: 'evt-cumbia-friday', source: 'Phone', status: 'waitlist', assignedTo: 'Luis' },
  ],
};
