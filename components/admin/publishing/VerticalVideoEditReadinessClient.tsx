'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  isVideoEditApprovalCurrent,
  videoEditReadiness,
  type VideoEditProject,
} from '@/lib/admin/assets/video-edit';

const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';

export function VerticalVideoEditReadinessClient({ eventId }: { eventId: string }) {
  const [project, setProject] = useState<VideoEditProject | null>();
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const accessCode = sessionStorage.getItem(ACCESS_SESSION_KEY) ?? '';
    fetch(`/api/admin/assets/video-edit?eventId=${encodeURIComponent(eventId)}`, {
      cache: 'no-store',
      headers: accessCode ? { 'x-admin-asset-key': accessCode } : {},
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          project?: VideoEditProject | null;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error || 'Could not load video edit.');
        if (active) setProject(result.project ?? null);
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Could not load video edit.');
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  if (project === undefined && !message) return null;

  const readiness = project ? videoEditReadiness(project) : null;
  const approvalCurrent = project ? isVideoEditApprovalCurrent(project) : false;

  return (
    <section className="mb-4 rounded-[1.35rem] border border-fuchsia-200/12 bg-fuchsia-200/[.035] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-fuchsia-100/58">
            Vertical video handoff
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {approvalCurrent
              ? 'The 15-second edit recipe is approved'
              : project
                ? 'The vertical-video edit still needs approval'
                : 'The vertical-video sequence has not been built'}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">
            {approvalCurrent
              ? 'Shot order, trim points, and platform captions are locked. This is not yet a rendered MP4; upload or render the finished vertical video before scheduling Reel or TikTok publication.'
              : project
                ? `${readiness?.issues.length ?? 0} readiness check${readiness?.issues.length === 1 ? '' : 's'} remain. Complete the timeline before preparing the final video asset.`
                : 'Use approved reusable footage and the generated campaign shot plan to create the shared Reel and TikTok edit recipe.'}
          </p>
          {message ? <p className="mt-2 text-xs text-amber-100/65">{message}</p> : null}
        </div>
        <Link
          href={`/admin/events/${eventId}/assets`}
          className="inline-flex min-h-11 items-center rounded-full border border-fuchsia-200/18 bg-fuchsia-200/[.07] px-4 text-xs font-bold text-fuchsia-50"
        >
          {approvalCurrent ? 'Review edit recipe' : 'Open Video Studio'}
        </Link>
      </div>
    </section>
  );
}
