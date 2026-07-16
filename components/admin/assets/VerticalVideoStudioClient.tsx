'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MediaLibraryAsset } from '@/lib/admin/assets/library-domain';
import {
  approveVideoEditProject,
  clipDurationSeconds,
  createVideoEditProject,
  prepareVideoEditDraft,
  videoEditReadiness,
  type VideoEditClip,
  type VideoEditPlatformPackage,
  type VideoEditProject,
} from '@/lib/admin/assets/video-edit';
import type { OperationsEvent } from '@/lib/admin/domain';
import { growthWorkspaceRepository } from '@/lib/admin/growth/repository';
import type { ShortVideoPlatform } from '@/lib/admin/growth/domain';

const LIBRARY_API = '/api/admin/assets/library';
const VIDEO_EDIT_API = '/api/admin/assets/video-edit';
const ACCESS_SESSION_KEY = 'club-bahia-event-assets-access';

function headers(accessCode: string): Record<string, string> {
  return accessCode ? { 'x-admin-asset-key': accessCode } : {};
}

function seconds(value: number): string {
  return `${value.toFixed(2)}s`;
}

function platformLabel(platform: ShortVideoPlatform): string {
  return platform === 'instagram-reel' ? 'Instagram Reel' : 'TikTok';
}

function SequencePreview({
  project,
  platform,
}: {
  project: VideoEditProject;
  platform: ShortVideoPlatform;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [clipIndex, setClipIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const clips = project.clips;
  const clip = clips[clipIndex];
  const platformPackage = project.platformPackages.find(
    (item) => item.platform === platform,
  );

  useEffect(() => {
    setClipIndex(0);
    setPlaying(false);
  }, [project.contentVersion, platform]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !clip) return;
    const start = () => {
      video.currentTime = clip.trimStartSeconds;
      if (playing) void video.play().catch(() => setPlaying(false));
    };
    if (video.readyState >= 1) start();
    else video.addEventListener('loadedmetadata', start, { once: true });
    return () => video.removeEventListener('loadedmetadata', start);
  }, [clip, playing]);

  function restart() {
    if (!clips.length) return;
    setClipIndex(0);
    setPlaying(true);
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !clip || video.currentTime < clip.trimEndSeconds - 0.03) return;
    video.pause();
    if (clipIndex < clips.length - 1) {
      setClipIndex((current) => current + 1);
    } else {
      setPlaying(false);
      setClipIndex(0);
    }
  }

  return (
    <div>
      <div className="relative mx-auto aspect-[9/16] max-h-[34rem] overflow-hidden rounded-[1.8rem] border border-white/12 bg-black shadow-[0_24px_70px_rgba(0,0,0,.4)]">
        {clip ? (
          <video
            key={clip.id}
            ref={videoRef}
            src={clip.sourceUrl}
            muted={clip.muted}
            playsInline
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleTimeUpdate}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/38">
            Add clips to preview the sequence.
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-black/85 to-transparent" />
        <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.16em] text-white/82">
          <span>{platformLabel(platform)}</span>
          <span>Club Bahia</span>
        </div>
        {clip ? (
          <div className="pointer-events-none absolute bottom-24 left-4 right-14">
            <p className="line-clamp-3 text-xs leading-5 text-white/86">
              {platformPackage?.caption}
            </p>
            <p className="mt-2 text-[10px] text-white/62">
              {platformPackage?.hashtags.slice(0, 4).join(' ')}
            </p>
          </div>
        ) : null}
        <div className="pointer-events-none absolute bottom-5 right-3 flex flex-col gap-3 text-center text-[9px] text-white/72">
          <span>♥</span><span>●</span><span>↗</span>
        </div>
        {clip ? (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/55 px-2 py-1 text-[9px] text-white/65">
            Clip {clipIndex + 1}/{clips.length} · {clip.sourceName}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button
          type="button"
          disabled={!clips.length}
          onClick={() => {
            if (playing) {
              videoRef.current?.pause();
              setPlaying(false);
            } else {
              setPlaying(true);
            }
          }}
          className="min-h-10 rounded-full bg-emerald-200 px-4 text-xs font-bold text-black disabled:opacity-35"
        >
          {playing ? 'Pause preview' : 'Play preview'}
        </button>
        <button
          type="button"
          disabled={!clips.length}
          onClick={restart}
          className="min-h-10 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/60 disabled:opacity-35"
        >
          Restart
        </button>
      </div>
    </div>
  );
}

export function VerticalVideoStudioClient({ event }: { event: OperationsEvent }) {
  const [videos, setVideos] = useState<MediaLibraryAsset[]>([]);
  const [project, setProject] = useState<VideoEditProject | null>(null);
  const [revision, setRevision] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const [pending, setPending] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedShotId, setSelectedShotId] = useState('');
  const [previewPlatform, setPreviewPlatform] =
    useState<ShortVideoPlatform>('instagram-reel');

  const load = useCallback(
    async (code = '') => {
      setPending(true);
      setMessage('');
      try {
        const [libraryResponse, editResponse, workspace] = await Promise.all([
          fetch(LIBRARY_API, { cache: 'no-store', headers: headers(code) }),
          fetch(`${VIDEO_EDIT_API}?eventId=${encodeURIComponent(event.id)}`, {
            cache: 'no-store',
            headers: headers(code),
          }),
          growthWorkspaceRepository.getWorkspace(event),
        ]);
        const libraryResult = (await libraryResponse.json()) as {
          assets?: MediaLibraryAsset[];
          error?: string;
        };
        const editResult = (await editResponse.json()) as {
          project?: VideoEditProject | null;
          revision?: number;
          error?: string;
        };
        if (!libraryResponse.ok || !libraryResult.assets) {
          if (libraryResponse.status === 401) setNeedsUnlock(true);
          throw new Error(libraryResult.error || 'Could not load reusable videos.');
        }
        if (!editResponse.ok) {
          if (editResponse.status === 401) setNeedsUnlock(true);
          throw new Error(editResult.error || 'Could not load the video edit.');
        }
        const reelItem = workspace.content.find((item) => item.channel === 'reel');
        if (!reelItem) {
          setProject(null);
          setMessage('Generate the promotion package before building the vertical video.');
        } else {
          const nextProject =
            editResult.project ?? createVideoEditProject({ event, item: reelItem });
          setProject(nextProject);
          setRevision(editResult.revision ?? 0);
          setSelectedShotId((current) =>
            nextProject.shots.some((shot) => shot.id === current)
              ? current
              : nextProject.shots[0]?.id ?? '',
          );
        }
        const eligible = libraryResult.assets.filter(
          (asset) => asset.status === 'active' && asset.kind === 'video',
        );
        setVideos(eligible);
        setSelectedVideoId((current) =>
          eligible.some((asset) => asset.id === current)
            ? current
            : eligible[0]?.id ?? '',
        );
        setNeedsUnlock(false);
        if (code) sessionStorage.setItem(ACCESS_SESSION_KEY, code);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not load the video studio.');
      } finally {
        setPending(false);
      }
    },
    [event],
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(ACCESS_SESSION_KEY) ?? '';
    setAccessCode(saved);
    void load(saved);
  }, [load]);

  const readiness = useMemo(
    () => (project ? videoEditReadiness(project) : null),
    [project],
  );

  function editProject(mutator: (current: VideoEditProject) => VideoEditProject) {
    setProject((current) =>
      current ? prepareVideoEditDraft(mutator(current)) : current,
    );
  }

  function addClip() {
    if (!project || !selectedVideoId || !selectedShotId) return;
    const source = videos.find((video) => video.id === selectedVideoId);
    const shot = project.shots.find((item) => item.id === selectedShotId);
    if (!source || !shot) return;
    const desired = Math.max(0.25, shot.endSecond - shot.startSecond);
    const available = source.durationSeconds ?? desired;
    const end = Math.min(available, desired);
    const clip: VideoEditClip = {
      id: `clip-${Date.now().toString(36)}`,
      sourceLibraryAssetId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      sourceDurationSeconds: source.durationSeconds,
      shotId: shot.id,
      trimStartSeconds: 0,
      trimEndSeconds: end,
      muted: true,
    };
    editProject((current) => ({ ...current, clips: [...current.clips, clip] }));
    setMessage(`${source.name} added to shot ${shot.order + 1}.`);
  }

  function updateClip(clipId: string, patch: Partial<VideoEditClip>) {
    editProject((current) => ({
      ...current,
      clips: current.clips.map((clip) =>
        clip.id === clipId ? { ...clip, ...patch } : clip,
      ),
    }));
  }

  function removeClip(clipId: string) {
    editProject((current) => ({
      ...current,
      clips: current.clips.filter((clip) => clip.id !== clipId),
    }));
  }

  function moveClip(clipId: string, direction: -1 | 1) {
    editProject((current) => {
      const clips = [...current.clips];
      const index = clips.findIndex((clip) => clip.id === clipId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= clips.length) return current;
      [clips[index], clips[target]] = [clips[target], clips[index]];
      return { ...current, clips };
    });
  }

  function fitClipToShot(clip: VideoEditClip) {
    if (!project) return;
    const shot = project.shots.find((item) => item.id === clip.shotId);
    if (!shot) return;
    const desired = shot.endSecond - shot.startSecond;
    const maximum = clip.sourceDurationSeconds ?? clip.trimStartSeconds + desired;
    updateClip(clip.id, {
      trimEndSeconds: Math.min(maximum, clip.trimStartSeconds + desired),
    });
  }

  function updatePlatformPackage(
    platform: ShortVideoPlatform,
    patch: Partial<VideoEditPlatformPackage>,
  ) {
    editProject((current) => ({
      ...current,
      platformPackages: current.platformPackages.map((item) =>
        item.platform === platform ? { ...item, ...patch } : item,
      ),
    }));
  }

  async function persist(action: 'save' | 'approve' | 'return-draft') {
    if (!project) return;
    setWorking(true);
    setMessage('');
    try {
      const response = await fetch(VIDEO_EDIT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers(accessCode),
        },
        body: JSON.stringify({
          action,
          eventId: event.id,
          expectedRevision: revision,
          project,
        }),
      });
      const result = (await response.json()) as {
        project?: VideoEditProject;
        revision?: number;
        error?: string;
      };
      if (!response.ok || !result.project || result.revision === undefined) {
        throw new Error(result.error || 'Could not save the vertical-video edit.');
      }
      setProject(result.project);
      setRevision(result.revision);
      setMessage(
        action === 'approve'
          ? 'Vertical-video edit recipe approved for this event.'
          : action === 'return-draft'
            ? 'Edit returned to draft.'
            : 'Vertical-video draft saved.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the video edit.');
    } finally {
      setWorking(false);
    }
  }

  if (needsUnlock) {
    return (
      <section className="mb-5 rounded-[1.5rem] border border-amber-200/14 bg-amber-200/[.04] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-amber-100/60">
          Vertical Video Studio
        </p>
        <h2 className="mt-1 font-serif text-3xl text-white">Unlock protected footage</h2>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(submitEvent) => {
            submitEvent.preventDefault();
            void load(accessCode.trim());
          }}
        >
          <input
            type="password"
            value={accessCode}
            onChange={(inputEvent) => setAccessCode(inputEvent.target.value)}
            placeholder="Asset access code"
            className="min-h-11 flex-1 rounded-xl border border-white/10 bg-black/25 px-3 text-white"
          />
          <button
            disabled={pending || !accessCode.trim()}
            className="min-h-11 rounded-full bg-amber-300 px-5 text-xs font-bold text-black disabled:opacity-40"
          >
            Open studio
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mb-5 overflow-hidden rounded-[1.6rem] border border-fuchsia-200/12 bg-[linear-gradient(140deg,rgba(30,10,34,.9),rgba(12,18,20,.94)_54%,rgba(38,25,8,.88))] p-4 shadow-[0_24px_75px_rgba(0,0,0,.3)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-fuchsia-200/65">
            Vertical Video Studio
          </p>
          <h2 className="mt-1 font-serif text-3xl text-white sm:text-4xl">
            Build the 15-second Reel and TikTok edit.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
            Map reusable footage to the generated shot plan, set exact trims, compare platform previews, and approve one encrypted edit recipe. Nothing publishes or renders a final MP4 here.
          </p>
        </div>
        {project && readiness ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Timeline', seconds(readiness.totalDurationSeconds)],
              ['Shots', `${readiness.coveredShotIds.length}/${project.shots.length}`],
              ['Status', project.status],
            ].map(([label, value]) => (
              <div key={label} className="min-w-20 rounded-2xl border border-white/9 bg-black/20 p-3">
                <p className="text-[9px] uppercase tracking-[.13em] text-white/32">{label}</p>
                <p className="mt-1 text-sm font-semibold text-fuchsia-100">{value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {pending ? (
        <p className="mt-5 rounded-2xl border border-white/8 bg-black/18 p-4 text-sm text-white/42">
          Loading video plan and reusable footage…
        </p>
      ) : !project ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-black/15 p-6 text-center">
          <h3 className="font-serif text-2xl text-white">Generate the campaign first</h3>
          <p className="mt-2 text-sm text-white/45">
            The studio uses the campaign’s shot plan and separate Reel and TikTok captions.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/9 bg-black/18 p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-[.13em] text-white/45">
                    Approved reusable footage
                    <select
                      value={selectedVideoId}
                      onChange={(inputEvent) => setSelectedVideoId(inputEvent.target.value)}
                      className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm normal-case tracking-normal text-white"
                    >
                      {videos.length ? null : <option value="">No reusable video yet</option>}
                      {videos.map((video) => (
                        <option key={video.id} value={video.id}>
                          {video.name}{video.durationSeconds ? ` · ${seconds(video.durationSeconds)}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="min-w-52 flex-1 text-xs font-semibold uppercase tracking-[.13em] text-white/45">
                    Shot destination
                    <select
                      value={selectedShotId}
                      onChange={(inputEvent) => setSelectedShotId(inputEvent.target.value)}
                      className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-sm normal-case tracking-normal text-white"
                    >
                      {project.shots.map((shot) => (
                        <option key={shot.id} value={shot.id}>
                          Shot {shot.order + 1} · {shot.startSecond}–{shot.endSecond}s
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={!selectedVideoId || !selectedShotId || project.clips.length >= 12}
                    onClick={addClip}
                    className="min-h-11 rounded-full bg-amber-300 px-5 text-xs font-bold text-black disabled:opacity-35"
                  >
                    Add clip
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                {project.shots.map((shot) => {
                  const assigned = project.clips.filter((clip) => clip.shotId === shot.id);
                  return (
                    <article key={shot.id} className="rounded-2xl border border-white/9 bg-black/18 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-fuchsia-100/60">
                            Shot {shot.order + 1} · {shot.startSecond}–{shot.endSecond}s
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-white">{shot.description}</h3>
                          {shot.onScreenText ? (
                            <p className="mt-1 text-xs text-amber-100/58">Text: {shot.onScreenText}</p>
                          ) : null}
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${assigned.length ? 'border-emerald-200/20 text-emerald-100' : 'border-amber-200/18 text-amber-100/70'}`}>
                          {assigned.length ? `${assigned.length} clip${assigned.length === 1 ? '' : 's'}` : 'Needs footage'}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">Timeline</h3>
                    <p className="mt-1 text-xs text-white/38">Sequence order is top to bottom.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${readiness?.ready ? 'bg-emerald-200 text-black' : 'border border-amber-200/18 text-amber-100/75'}`}>
                    {readiness?.ready ? 'Ready to approve' : `${readiness?.issues.length ?? 0} checks remaining`}
                  </span>
                </div>
                {project.clips.length ? project.clips.map((clip, index) => (
                  <article key={clip.id} className="rounded-2xl border border-white/9 bg-black/22 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{index + 1}. {clip.sourceName}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[.12em] text-white/34">
                          {seconds(clipDurationSeconds(clip))} · {project.shots.find((shot) => shot.id === clip.shotId)?.description ?? 'Unassigned'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveClip(clip.id, -1)} className="min-h-9 min-w-9 rounded-full border border-white/10 text-white/55 disabled:opacity-25">↑</button>
                        <button type="button" disabled={index === project.clips.length - 1} onClick={() => moveClip(clip.id, 1)} className="min-h-9 min-w-9 rounded-full border border-white/10 text-white/55 disabled:opacity-25">↓</button>
                        <button type="button" onClick={() => removeClip(clip.id)} className="min-h-9 rounded-full border border-red-200/14 px-3 text-xs text-red-100/65">Remove</button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <label className="text-xs text-white/48">
                        Shot
                        <select value={clip.shotId} onChange={(inputEvent) => updateClip(clip.id, { shotId: inputEvent.target.value })} className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-black/35 px-2 text-white">
                          {project.shots.map((shot) => <option key={shot.id} value={shot.id}>Shot {shot.order + 1}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-white/48">
                        Start
                        <input type="number" min="0" step="0.05" value={clip.trimStartSeconds} onChange={(inputEvent) => updateClip(clip.id, { trimStartSeconds: Number(inputEvent.target.value) })} className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-black/35 px-2 text-white" />
                      </label>
                      <label className="text-xs text-white/48">
                        End
                        <input type="number" min="0.25" step="0.05" value={clip.trimEndSeconds} onChange={(inputEvent) => updateClip(clip.id, { trimEndSeconds: Number(inputEvent.target.value) })} className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-black/35 px-2 text-white" />
                      </label>
                      <div className="flex items-end gap-2">
                        <button type="button" onClick={() => fitClipToShot(clip)} className="min-h-10 flex-1 rounded-xl border border-white/10 px-2 text-xs text-white/58">Fit shot</button>
                        <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-2 text-xs text-white/48">
                          <input type="checkbox" checked={clip.muted} onChange={(inputEvent) => updateClip(clip.id, { muted: inputEvent.target.checked })} /> Mute
                        </label>
                      </div>
                    </div>
                  </article>
                )) : (
                  <p className="rounded-2xl border border-dashed border-white/12 p-6 text-center text-sm text-white/38">Add footage to begin the timeline.</p>
                )}
              </section>
            </div>

            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                {(['instagram-reel', 'tiktok'] as ShortVideoPlatform[]).map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => setPreviewPlatform(platform)}
                    className={`min-h-10 rounded-full px-4 text-xs font-bold ${previewPlatform === platform ? 'bg-fuchsia-200 text-black' : 'border border-white/12 text-white/55'}`}
                  >
                    {platformLabel(platform)} preview
                  </button>
                ))}
              </div>
              <SequencePreview project={project} platform={previewPlatform} />

              {project.platformPackages.map((item) => (
                <details key={item.platform} open={item.platform === previewPlatform} className="rounded-2xl border border-white/9 bg-black/18 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-white">
                    {platformLabel(item.platform)} package
                  </summary>
                  <div className="mt-3 space-y-3">
                    <label className="block text-xs text-white/48">
                      Title / cover label
                      <input value={item.title} onChange={(inputEvent) => updatePlatformPackage(item.platform, { title: inputEvent.target.value })} className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white" />
                    </label>
                    <label className="block text-xs text-white/48">
                      Caption
                      <textarea rows={5} value={item.caption} onChange={(inputEvent) => updatePlatformPackage(item.platform, { caption: inputEvent.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 p-3 text-white" />
                    </label>
                    <label className="block text-xs text-white/48">
                      Hashtags
                      <input value={item.hashtags.join(' ')} onChange={(inputEvent) => updatePlatformPackage(item.platform, { hashtags: inputEvent.target.value.split(/\s+/).filter(Boolean).slice(0, 12) })} className="mt-1 min-h-10 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white" />
                    </label>
                    <label className="block text-xs text-white/48">
                      Posting notes
                      <textarea rows={2} value={item.postingNotes} onChange={(inputEvent) => updatePlatformPackage(item.platform, { postingNotes: inputEvent.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-black/35 p-3 text-white" />
                    </label>
                  </div>
                </details>
              ))}

              {readiness?.issues.length ? (
                <section className="rounded-2xl border border-amber-200/14 bg-amber-200/[.04] p-4">
                  <h3 className="text-sm font-semibold text-amber-100">Readiness checks</h3>
                  <div className="mt-2 space-y-1.5">
                    {readiness.issues.slice(0, 8).map((issue) => (
                      <p key={issue.id} className="text-xs leading-5 text-amber-100/64">△ {issue.message}</p>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>

          <div className="sticky bottom-20 z-[4] flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/12 bg-[#0d0c0c]/94 p-3 shadow-[0_20px_50px_rgba(0,0,0,.4)] backdrop-blur-xl lg:bottom-4">
            <div>
              <p className="text-xs font-semibold text-white">{project.status === 'approved' ? 'Approved edit recipe' : 'Draft edit recipe'}</p>
              <p className="mt-1 text-[11px] text-white/38">Revision {revision} · target {seconds(project.targetDurationSeconds)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={working} onClick={() => void persist('save')} className="min-h-11 rounded-full border border-white/14 px-4 text-xs font-semibold text-white/62 disabled:opacity-40">
                {working ? 'Saving…' : 'Save draft'}
              </button>
              {project.status === 'approved' ? (
                <button type="button" disabled={working} onClick={() => void persist('return-draft')} className="min-h-11 rounded-full border border-amber-200/18 px-4 text-xs font-semibold text-amber-100/70 disabled:opacity-40">Return to draft</button>
              ) : (
                <button type="button" disabled={working || !readiness?.ready} onClick={() => void persist('approve')} className="min-h-11 rounded-full bg-emerald-200 px-5 text-xs font-bold text-black disabled:opacity-35">Approve edit recipe</button>
              )}
            </div>
          </div>
        </div>
      )}
      {message ? <p role="status" className="mt-4 text-sm text-amber-100/72">{message}</p> : null}
    </section>
  );
}
