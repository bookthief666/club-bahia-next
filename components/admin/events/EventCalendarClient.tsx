"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { OperationsEvent } from "@/lib/admin/domain";
import { addDays, addMonthsClamped, eventLocalDate, formatVenueDateTime, formatVenueMonth, getVenueToday, type LocalDate } from "@/lib/admin/date";
import { eventRepository } from "@/lib/admin/event-repository";
type View = "month" | "week" | "agenda";
const dayMs = 86400000;
function daysInMonth(y:number,m:number){return new Date(Date.UTC(y,m,0)).getUTCDate();}
function monthCells(anchor: LocalDate){ const [y,m]=anchor.split('-').map(Number); const first=new Date(Date.UTC(y,m-1,1)); const startOffset=first.getUTCDay(); const start=new Date(Date.UTC(y,m-1,1-startOffset)); return Array.from({length:42},(_,i)=>{const d=new Date(start.getTime()+i*dayMs); return d.toISOString().slice(0,10) as LocalDate;}); }
function inRange(date:LocalDate, anchor:LocalDate, view:View){ if(view==='month') return date.slice(0,7)===anchor.slice(0,7); const span=view==='week'?7:30; const diff=(new Date(date).getTime()-new Date(anchor).getTime())/dayMs; return diff>=0 && diff<span; }
export function EventCalendarClient() {
  const [events, setEvents] = useState<OperationsEvent[]>([]); const [view,setView]=useState<View>("agenda"); const [anchor,setAnchor]=useState<LocalDate>(getVenueToday());
  useEffect(()=>{eventRepository.listEvents().then(setEvents);},[]);
  function move(dir:number){ if(view==='month') setAnchor(addMonthsClamped(anchor,dir)); else setAnchor(addDays(anchor,dir*(view==='week'?7:14))); }
  const eventsByDay=useMemo(()=>events.reduce<Record<string,OperationsEvent[]>>((acc,e)=>{const d=eventLocalDate(e.startsAt); (acc[d]??=[]).push(e); return acc;},{}),[events]);
  const visible=useMemo(()=>events.filter(e=>inRange(eventLocalDate(e.startsAt),anchor,view)).sort((a,b)=>a.startsAt.localeCompare(b.startsAt)),[events,anchor,view]);
  const cells=monthCells(anchor);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[.22em] text-amber-200/60">{formatVenueMonth(anchor)}</p><h1 className="font-serif text-3xl">Calendar</h1></div><div className="flex flex-wrap gap-2"><button onClick={()=>move(-1)} className="rounded-xl border border-white/15 px-3 py-2 text-sm">Previous</button><button onClick={()=>setAnchor(getVenueToday())} className="rounded-xl bg-amber-300 px-3 py-2 text-sm font-bold text-black">Today</button><button onClick={()=>move(1)} className="rounded-xl border border-white/15 px-3 py-2 text-sm">Next</button><select aria-label="Calendar view" value={view} onChange={(e)=>setView(e.target.value as View)} className="rounded-xl bg-white/10 px-3"><option className="bg-black" value="agenda">Agenda</option><option className="bg-black" value="week">Week</option><option className="bg-black" value="month">Month</option></select></div></div>
    <div className="md:hidden"><Agenda events={visible}/></div>
    {view==='month' ? <div className="hidden grid-cols-7 gap-1 md:grid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d} className="px-2 py-1 text-xs text-white/45">{d}</div>)}{cells.map(d=>{const muted=d.slice(0,7)!==anchor.slice(0,7); return <div key={d} className={`min-h-28 rounded-xl border border-white/10 p-2 ${muted?'bg-black/15 text-white/35':'bg-[#141210]/75'}`}><p className="text-xs">{Number(d.slice(8))}</p><div className="mt-2 space-y-1 overflow-hidden">{(eventsByDay[d]??[]).slice(0,3).map(e=><Link key={e.id} href={`/admin/events/${e.id}`} className="block truncate rounded-lg bg-amber-200/10 px-2 py-1 text-xs text-amber-50">{e.title}</Link>)}{(eventsByDay[d]??[]).length>3?<p className="text-xs text-white/45">+{(eventsByDay[d]??[]).length-3} more</p>:null}</div></div>})}</div> : <div className="hidden md:block"><Agenda events={visible}/></div>}
  </div>;
}
function Agenda({events}:{events:OperationsEvent[]}){ return <div className="space-y-2">{events.map(e=><Link key={e.id} href={`/admin/events/${e.id}`} className="block rounded-2xl border border-white/10 bg-[#141210]/75 p-3"><p className="text-sm font-semibold">{e.title}</p><p className="mt-1 text-xs text-white/60">{formatVenueDateTime(e.startsAt)} · {e.room}</p></Link>)}{events.length===0?<p className="rounded-2xl border border-white/10 p-4 text-sm text-white/55">No events in this window.</p>:null}</div>}
