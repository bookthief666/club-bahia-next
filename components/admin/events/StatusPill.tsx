import type { EventStatus } from "@/lib/admin/domain";
import { STATUS_TONES } from "@/lib/admin/event-status";
export function StatusPill({ status }: { status: EventStatus }) {
  const tone = STATUS_TONES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.className}`}
      title={tone.description}
    >
      <span aria-hidden>●</span>
      {tone.label}
    </span>
  );
}
