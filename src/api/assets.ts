import type { VideoAsset, VideoRecord } from './types';

/** Prefer a ready Mux/Bunny asset; otherwise first asset. */
export function pickPrimaryAsset(
  video: VideoRecord | null | undefined,
): VideoAsset | null {
  const assets = video?.assets;
  if (!Array.isArray(assets) || assets.length === 0) {
    return null;
  }
  const ready = assets.find((asset) => {
    const status = (asset.status ?? '').toLowerCase();
    return (
      (status === 'ready' || status === 'published') &&
      Boolean(asset.playbackUrl || asset.providerPlaybackId)
    );
  });
  return ready ?? assets[0] ?? null;
}

export function enrichVideoFromAssets(video: VideoRecord): VideoRecord {
  const asset = pickPrimaryAsset(video);
  if (!asset) {
    return video;
  }

  const providerName = asset.providerName?.toLowerCase() ?? null;
  const durationSeconds =
    typeof video.durationSeconds === 'number'
      ? video.durationSeconds
      : asset.durationSeconds ?? null;

  return {
    ...video,
    provider: video.provider ?? asset.providerName ?? null,
    streamingProvider: video.streamingProvider ?? asset.providerName ?? null,
    muxPlaybackId:
      video.muxPlaybackId ??
      (providerName === 'mux' ? asset.providerPlaybackId : null) ??
      null,
    playbackId: video.playbackId ?? asset.providerPlaybackId ?? null,
    playbackUrl: video.playbackUrl ?? asset.playbackUrl ?? null,
    durationSeconds,
    // Use the stricter/more specific status for playability.
    status: video.status ?? asset.status ?? null,
  };
}
