"use client";
import { useRouter, useSearchParams } from "next/navigation";
export function EventFilters() {
  const router = useRouter();
  const params = useSearchParams();
  function set(k: string, v: string) {
    const p = new URLSearchParams(params);
    v ? p.set(k, v) : p.delete(k);
    router.push(`/admin/events?${p}`);
  }
  return (
    <div className="grid gap-3 rounded-3xl border border-white/10 bg-black/30 p-4 sm:grid-cols-4">
      <input
        aria-label="Search"
        placeholder="Search"
        className="rounded-xl bg-white/10 p-3"
        defaultValue={params.get("q") ?? ""}
        onChange={(e) => set("q", e.target.value)}
      />
      <select
        aria-label="Archive filter"
        className="rounded-xl bg-white/10 p-3"
        defaultValue={params.get("archive") ?? "active"}
        onChange={(e) => set("archive", e.target.value)}
      >
        <option className="bg-black" value="active">
          Active only
        </option>
        <option className="bg-black" value="archived">
          Archived only
        </option>
        <option className="bg-black" value="all">
          All records
        </option>
      </select>
      <select
        aria-label="Status"
        className="rounded-xl bg-white/10 p-3"
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => set("status", e.target.value)}
      >
        <option className="bg-black" value="">
          All active statuses
        </option>
        <option className="bg-black" value="cancelled">
          Cancelled
        </option>
        <option className="bg-black" value="live">
          Live
        </option>
        <option className="bg-black" value="final-prep">
          Final prep
        </option>
      </select>
      <select
        aria-label="Sort"
        className="rounded-xl bg-white/10 p-3"
        defaultValue={params.get("sort") ?? "date"}
        onChange={(e) => set("sort", e.target.value)}
      >
        <option className="bg-black" value="date">
          Date
        </option>
        <option className="bg-black" value="title">
          Title
        </option>
        <option className="bg-black" value="risk">
          Risk
        </option>
      </select>
    </div>
  );
}
