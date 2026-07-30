import { apiRequest } from './client';
import { ApiError } from './errors';
import { enrichVideoFromAssets, pickPrimaryAsset } from './assets';
import {
  buildPlaybackFromSeed,
  normalizePlayback,
} from './playback';
import type {
  LiveEventRecord,
  PlaybackInfo,
  UpdateCurrentProfileDto,
  UserProfile,
  VideoRecord,
} from './types';

function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  if (data && typeof data === 'object') {
    const root = data as Record<string, unknown>;
    for (const key of ['items', 'data', 'results', 'videos', 'liveEvents']) {
      if (Array.isArray(root[key])) {
        return root[key] as T[];
      }
    }
  }
  return [];
}

export async function listVideos(): Promise<VideoRecord[]> {
  const data = await apiRequest<unknown>('/api/videos');
  return asArray<VideoRecord>(data).map(enrichVideoFromAssets);
}

export async function getVideo(id: string): Promise<VideoRecord> {
  const video = await apiRequest<VideoRecord>(
    `/api/videos/${encodeURIComponent(id)}`,
  );
  return enrichVideoFromAssets(video);
}

export async function getVideoPlayback(
  id: string,
  seed?: VideoRecord,
): Promise<PlaybackInfo> {
  try {
    const data = await apiRequest<unknown>(
      `/api/videos/${encodeURIComponent(id)}/playback`,
    );
    return normalizePlayback(data);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && seed) {
      const fallback = buildPlaybackFromSeed(videoPlaybackSeed(seed));
      if (fallback) {
        return fallback;
      }
    }
    throw err;
  }
}

export async function listLiveEvents(): Promise<LiveEventRecord[]> {
  const data = await apiRequest<unknown>('/api/live-events');
  return asArray<LiveEventRecord>(data);
}

export async function getLiveEvent(id: string): Promise<LiveEventRecord> {
  return apiRequest<LiveEventRecord>(
    `/api/live-events/${encodeURIComponent(id)}`,
  );
}

export async function getLiveEventPlayback(
  id: string,
  seed?: LiveEventRecord,
): Promise<PlaybackInfo> {
  try {
    const data = await apiRequest<unknown>(
      `/api/live-events/${encodeURIComponent(id)}/playback`,
    );
    return normalizePlayback(data, true);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && seed) {
      const fallback = buildPlaybackFromSeed(livePlaybackSeed(seed), true);
      if (fallback) {
        return fallback;
      }
    }
    throw err;
  }
}

export async function getProfile(userId: string): Promise<UserProfile> {
  return apiRequest<UserProfile>(
    `/api/profiles/${encodeURIComponent(userId)}`,
  );
}

export async function updateMyProfile(
  dto: UpdateCurrentProfileDto,
): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/profiles/me', {
    method: 'PATCH',
    body: dto,
  });
}

function videoPlaybackSeed(video: VideoRecord) {
  const enriched = enrichVideoFromAssets(video);
  const asset = pickPrimaryAsset(video);
  return {
    kind: 'video' as const,
    provider:
      enriched.provider ??
      enriched.streamingProvider ??
      asset?.providerName ??
      null,
    muxPlaybackId: enriched.muxPlaybackId,
    playbackId: enriched.playbackId ?? asset?.providerPlaybackId,
    playbackUrl: enriched.playbackUrl ?? asset?.playbackUrl,
    hlsUrl: enriched.hlsUrl,
    externalUrl: enriched.externalUrl,
  };
}

function livePlaybackSeed(event: LiveEventRecord) {
  return {
    kind: 'live' as const,
    provider: event.provider ?? event.streamingProvider,
    muxPlaybackId: event.muxPlaybackId,
    playbackId: event.playbackId,
    playbackUrl: event.playbackUrl,
    hlsUrl: event.hlsUrl,
  };
}
