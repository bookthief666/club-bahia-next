import type { MediaLibraryAsset } from './library-domain';
import type { VideoEditProject } from './video-edit';

export function canonicalizeVideoEditSources(input: {
  project: VideoEditProject;
  assets: MediaLibraryAsset[];
}): VideoEditProject {
  const assetsById = new Map(input.assets.map((asset) => [asset.id, asset]));
  const activeAssets = input.assets.filter((asset) => asset.status === 'active');
  const approvedDerivatives = new Map(
    activeAssets.flatMap((asset) =>
      (asset.derivatives ?? [])
        .filter((derivative) => derivative.status === 'approved')
        .map((derivative) => [derivative.id, derivative] as const),
    ),
  );

  const clips = input.project.clips.map((clip) => {
    const source = assetsById.get(clip.sourceLibraryAssetId);
    if (!source || source.status !== 'active') {
      throw new Error(`${clip.sourceName} is no longer active in the Media Library.`);
    }
    if (source.kind !== 'video') {
      throw new Error(`${source.name} is not a video asset.`);
    }
    return {
      ...clip,
      sourceName: source.name,
      sourceUrl: source.url,
      sourceDurationSeconds: source.durationSeconds,
    };
  });

  const platformPackages = input.project.platformPackages.map((item) => {
    if (!item.coverDerivativeId) return item;
    const derivative = approvedDerivatives.get(item.coverDerivativeId);
    if (!derivative) {
      throw new Error(
        `${item.platform === 'instagram-reel' ? 'Instagram Reel' : 'TikTok'} cover is not approved or no longer exists.`,
      );
    }
    const allowedPreset =
      item.platform === 'instagram-reel'
        ? 'instagram-reel-cover'
        : 'tiktok-cover';
    if (derivative.presetId !== allowedPreset) {
      throw new Error(
        `${item.platform === 'instagram-reel' ? 'Instagram Reel' : 'TikTok'} cover uses the wrong platform format.`,
      );
    }
    return item;
  });

  return { ...input.project, clips, platformPackages };
}
