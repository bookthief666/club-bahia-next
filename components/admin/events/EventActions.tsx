"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OperationsEvent } from "@/lib/admin/domain";
import { eventRepository } from "@/lib/admin/event-repository";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { DuplicateEventDialog } from "./DuplicateEventDialog";

export function EventActions({ event }: { event: OperationsEvent }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<
    "archive" | "restore" | "delete" | null
  >(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function runConfirmedAction() {
    if (!confirm) return;
    setPending(true);
    try {
      if (confirm === "archive") await eventRepository.archiveEvent(event.id);
      if (confirm === "restore") await eventRepository.restoreEvent(event.id);
      if (confirm === "delete") {
        await eventRepository.deleteEvent(event.id);
        router.push("/admin/events");
        return;
      }
      setMessage(`${confirm} complete.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setPending(false);
      setConfirm(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link
          className="min-h-11 rounded-full bg-amber-300 px-4 py-3 text-sm font-bold text-black"
          href={`/admin/events/${event.id}/growth`}
        >
          Open growth workspace
        </Link>
        <Link
          className="min-h-11 rounded-full border border-white/15 px-4 py-3 text-sm"
          href={`/admin/events/${event.id}/edit`}
        >
          Edit
        </Link>
        <button
          className="min-h-11 rounded-full border border-amber-200/30 px-4 text-sm"
          onClick={() => setDuplicateOpen(true)}
        >
          Duplicate
        </button>
        {event.status === "archived" ? (
          <button
            className="min-h-11 rounded-full border border-emerald-200/30 px-4 text-sm"
            onClick={() => setConfirm("restore")}
          >
            Restore
          </button>
        ) : (
          <button
            className="min-h-11 rounded-full border border-zinc-200/30 px-4 text-sm"
            onClick={() => setConfirm("archive")}
          >
            Archive
          </button>
        )}
        <button
          className="min-h-11 rounded-full bg-red-700 px-4 text-sm font-bold"
          onClick={() => setConfirm("delete")}
        >
          Delete permanently
        </button>
      </div>
      {message ? (
        <p role="status" className="text-sm text-amber-100">
          {message}
        </p>
      ) : null}
      <DuplicateEventDialog
        event={event}
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
      />
      <ConfirmActionDialog
        open={Boolean(confirm)}
        title={`${confirm} event?`}
        description={
          confirm === "delete"
            ? "Delete permanently removes this development fixture record. This is different from archive."
            : `${confirm} will update the event through repository transition rules.`
        }
        confirmLabel={
          confirm === "delete" ? "Delete permanently" : (confirm ?? "Confirm")
        }
        destructive={confirm === "delete"}
        pending={pending}
        onConfirm={runConfirmedAction}
        onClose={() => setConfirm(null)}
      />
    </div>
  );
}
