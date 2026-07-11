import type { ClubEvent } from './domain';
import { sortByStart } from './selectors';
export function monthDays(anchor:string){const [y,m]=anchor.split('-').map(Number); const first=new Date(Date.UTC(y,m-1,1,12)); const start=new Date(first); start.setUTCDate(1-first.getUTCDay()); return Array.from({length:42},(_,i)=>{const d=new Date(start); d.setUTCDate(start.getUTCDate()+i); return d.toISOString().slice(0,10)});}
export function weekDays(anchor:string){const d=new Date(`${anchor}T12:00:00Z`); const start=new Date(d); start.setUTCDate(d.getUTCDate()-d.getUTCDay()); return Array.from({length:7},(_,i)=>{const x=new Date(start); x.setUTCDate(start.getUTCDate()+i); return x.toISOString().slice(0,10)});}
export function groupEventsByLocalDate(events:ClubEvent[]){return sortByStart(events).reduce<Record<string,ClubEvent[]>>((acc,e)=>{(acc[e.eventDate]??=[]).push(e); return acc;},{});}
export const prevMonth=(anchor:string)=>shiftMonth(anchor,-1); export const nextMonth=(anchor:string)=>shiftMonth(anchor,1);
function shiftMonth(anchor:string,delta:number){const [y,m]=anchor.split('-').map(Number); const d=new Date(Date.UTC(y,m-1+delta,1,12)); return d.toISOString().slice(0,10);}
