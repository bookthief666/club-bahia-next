"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
const labels: Record<string, string> = { archive: "Archive", status: "Status", sort: "Sort", date: "Date", risk: "Risk", q: "Search" };
export function EventFilters() {
  const router = useRouter(); const params = useSearchParams(); const [open,setOpen]=useState(false);
  function update(k:string,v:string){ const p=new URLSearchParams(params); v?p.set(k,v):p.delete(k); router.push(`/admin/events?${p.toString()}`); }
  const active=Array.from(params.entries()).filter(([,v])=>v);
  return <div className="space-y-3 rounded-2xl border border-white/10 bg-[#12100e]/80 p-3">
    <div className="flex gap-2"><input aria-label="Search" placeholder="Search events" className="min-h-11 flex-1 rounded-xl border border-white/10 bg-white/10 px-3" defaultValue={params.get("q") ?? ""} onChange={(e)=>update("q",e.target.value)} /><button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} className="min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold">Filters</button></div>
    {active.length ? <div className="flex flex-wrap gap-2">{active.map(([k,v])=><button key={k} onClick={()=>update(k,"")} className="rounded-full bg-amber-200/10 px-3 py-1 text-xs text-amber-100">{labels[k] ?? k}: {v} ×</button>)}<button onClick={()=>router.push('/admin/events')} className="rounded-full px-3 py-1 text-xs text-white/60 underline">Clear all</button></div> : null}
    <div className={`${open ? 'grid' : 'hidden sm:grid'} gap-3 sm:grid-cols-3`}>
      <select aria-label="Archive filter" className="rounded-xl bg-white/10 p-3" value={params.get("archive") ?? "active"} onChange={(e)=>update("archive",e.target.value)}><option className="bg-black" value="active">Active only</option><option className="bg-black" value="archived">Archived only</option><option className="bg-black" value="all">All records</option></select>
      <select aria-label="Status" className="rounded-xl bg-white/10 p-3" value={params.get("status") ?? ""} onChange={(e)=>update("status",e.target.value)}><option className="bg-black" value="">All active statuses</option><option className="bg-black" value="cancelled">Cancelled</option><option className="bg-black" value="live">Live</option><option className="bg-black" value="final-prep">Final prep</option></select>
      <select aria-label="Sort" className="rounded-xl bg-white/10 p-3" value={params.get("sort") ?? "date"} onChange={(e)=>update("sort",e.target.value)}><option className="bg-black" value="date">Date</option><option className="bg-black" value="title">Title</option><option className="bg-black" value="risk">Risk</option></select>
    </div>
  </div>;
}
