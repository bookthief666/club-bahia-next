export const VENUE_TIME_ZONE = 'America/Los_Angeles' as const;
export type EventStatus = 'idea'|'planning'|'approved'|'marketing'|'on_sale'|'final_prep'|'live'|'completed'|'cancelled'|'archived';
export type EventCategory = 'salsa'|'bachata'|'cumbia'|'live_music'|'private'|'community'|'club_night';
export type AgePolicy = 'all_ages'|'eighteen_plus'|'twenty_one_plus';
export type VenueArea = 'main_room'|'patio'|'lounge'|'full_venue';
export type Readiness = 'not_started'|'needs_work'|'ready';
export type WarningFlag = 'promotion_late'|'staffing_gap'|'over_capacity'|'budget_risk'|'unresolved_ops'|'past_due_active';
export interface MoneyCents { cents: number; currency: 'USD' }
export interface ClubEvent { id:string; title:string; shortDescription:string; internalNotes?:string; eventDate:string; startTime:string; endTime:string; timezone:typeof VENUE_TIME_ZONE; doorsOpenTime?:string; venueArea:VenueArea; category:EventCategory; agePolicy:AgePolicy; capacity:number; expectedAttendance:number; coverCharge:MoneyCents; ticketUrl?:string; reservationPolicy?:string; status:EventStatus; createdAt:string; updatedAt:string; archivedAt?:string; cancelledReason?:string; projectedBudget:MoneyCents; promotionalReadiness:Readiness; staffingReadiness:Readiness; warningFlags?:WarningFlag[] }
export interface EventStatusDefinition { status:EventStatus; label:string; description:string; tone:string; sortOrder:number; allowedTransitions:EventStatus[]; active:boolean; publicPlanning:boolean; requiresAttention:boolean }
export const EVENT_STATUS_DEFINITIONS: Record<EventStatus, EventStatusDefinition> = {
 idea:{status:'idea',label:'Idea',description:'Concept is being captured.',tone:'slate',sortOrder:10,allowedTransitions:['planning','cancelled','archived'],active:true,publicPlanning:false,requiresAttention:false},
 planning:{status:'planning',label:'Planning',description:'Operations, budget, and date are being shaped.',tone:'amber',sortOrder:20,allowedTransitions:['idea','approved','cancelled','archived'],active:true,publicPlanning:false,requiresAttention:true},
 approved:{status:'approved',label:'Approved',description:'Approved internally; promotion can be prepared.',tone:'emerald',sortOrder:30,allowedTransitions:['marketing','final_prep','cancelled','archived'],active:true,publicPlanning:true,requiresAttention:false},
 marketing:{status:'marketing',label:'Marketing',description:'Promotion is active before sales or reservations.',tone:'cyan',sortOrder:40,allowedTransitions:['on_sale','final_prep','cancelled','archived'],active:true,publicPlanning:true,requiresAttention:false},
 on_sale:{status:'on_sale',label:'On sale',description:'Tickets or reservations are open.',tone:'green',sortOrder:50,allowedTransitions:['final_prep','cancelled','archived'],active:true,publicPlanning:true,requiresAttention:false},
 final_prep:{status:'final_prep',label:'Final prep',description:'Final staffing, door, and production checks.',tone:'red',sortOrder:60,allowedTransitions:['live','cancelled','archived'],active:true,publicPlanning:true,requiresAttention:true},
 live:{status:'live',label:'Live',description:'Event is happening today.',tone:'pink',sortOrder:70,allowedTransitions:['completed','cancelled'],active:true,publicPlanning:true,requiresAttention:true},
 completed:{status:'completed',label:'Completed',description:'Event has ended and awaits review.',tone:'violet',sortOrder:80,allowedTransitions:['archived'],active:false,publicPlanning:false,requiresAttention:false},
 cancelled:{status:'cancelled',label:'Cancelled',description:'Event will not happen; reason is required.',tone:'zinc',sortOrder:90,allowedTransitions:['planning','archived'],active:false,publicPlanning:false,requiresAttention:true},
 archived:{status:'archived',label:'Archived',description:'Hidden from active operational views.',tone:'neutral',sortOrder:100,allowedTransitions:['planning'],active:false,publicPlanning:false,requiresAttention:false},
};
export const isActiveStatus=(s:EventStatus)=>EVENT_STATUS_DEFINITIONS[s].active;
export const isValidTransition=(from:EventStatus,to:EventStatus,eventDate?:string,now=new Date())=>{ if(!EVENT_STATUS_DEFINITIONS[from].allowedTransitions.includes(to)) return false; if(to==='live'&&eventDate){ const la=new Intl.DateTimeFormat('en-CA',{timeZone:VENUE_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(now); return eventDate===la;} return true; };
export const requiresCancellationReason=(s:EventStatus)=>s==='cancelled';
