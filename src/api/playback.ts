import { isYouTubeUrl } from '../lib/youtube';
import type { PlaybackInfo, StreamFormat, StreamProvider } from './types';

const MUX_HOST = 'stream.mux.com';
const BUNNY_HOST_HINTS = ['bunny', 'b-cdn.net', 'bunnycdn'];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function normalizeProviderHint(value: string | null): StreamProvider | undefined {
  if (!value) {
    return undefined;
  }
  const lower = value.toLowerCase();
  if (lower.includes('mux') || lower === 'wux') {
    return 'mux';
  }
  if (lower.includes('bunny')) {
    return 'bunny';
  }
  if (lower.includes('youtube') || lower === 'yt') {
    return 'youtube';
  }
  if (lower.includes('external')) {
    return 'external';
  }
  return lower;
}

function providerFromUrl(url: string): StreamProvider | undefined {
  if (isYouTubeUrl(url)) {
    return 'youtube';
  }
  const lower = url.toLowerCase();
  if (lower.includes(MUX_HOST)) {
    return 'mux';
  }
  if (BUNNY_HOST_HINTS.some((hint) => lower.includes(hint))) {
    return 'bunny';
  }
  return undefined;
}

function extractMuxPlaybackId(data: Record<string, unknown>): string | null {
  const direct = pickString(
    data.muxPlaybackId,
    data.playbackId,
    data.mux_playback_id,
  );
  if (direct && !direct.includes('/') && !direct.includes('.')) {
    return direct;
  }

  const playbackIds = data.playback_ids ?? data.playbackIds;
  if (Array.isArray(playbackIds) && playbackIds.length > 0) {
    const first = playbackIds[0];
    if (typeof first === 'string') {
      return first;
    }
    const record = asRecord(first);
    if (record) {
      return pickString(record.id, record.playbackId);
    }
  }

  return null;
}

function extractUrlFromSources(data: Record<string, unknown>): string | null {
  const sources = data.sources ?? data.playbackSources;
  if (!Array.isArray(sources)) {
    return null;
  }

  let mp4Fallback: string | null = null;
  let youtubeFallback: string | null = null;
  for (const entry of sources) {
    const source = asRecord(entry);
    if (!source) {
      continue;
    }
    const sourceUrl = pickString(source.url, source.src, source.uri);
    if (!sourceUrl) {
      continue;
    }
    const type = pickString(source.type, source.format, source.contentType) ?? '';
    if (isYouTubeUrl(sourceUrl) || /youtube/i.test(type)) {
      youtubeFallback = sourceUrl;
      continue;
    }
    if (
      /hls|m3u8/i.test(type) ||
      /\.m3u8(\?|$)/i.test(sourceUrl)
    ) {
      return sourceUrl;
    }
    if (/mp4/i.test(type) || /\.mp4(\?|$)/i.test(sourceUrl)) {
      mp4Fallback = sourceUrl;
    }
  }
  return mp4Fallback ?? youtubeFallback;
}

function buildMuxHlsUrl(
  playbackId: string,
  token?: string | null,
): string {
  const base = `https://stream.mux.com/${playbackId}.m3u8`;
  if (!token) {
    return base;
  }
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

function inferFormat(url: string, formatHint?: string | null): StreamFormat {
  if (isYouTubeUrl(url) || /youtube/i.test(formatHint ?? '')) {
    return 'youtube';
  }
  const hint = formatHint ?? '';
  if (/mp4/i.test(hint) || /\.mp4(\?|$)/i.test(url)) {
    return 'mp4';
  }
  return 'hls';
}

export function normalizePlayback(
  data: unknown,
  defaultLive = false,
): PlaybackInfo {
  if (!data || typeof data !== 'object') {
    throw new Error('Playback response vacía.');
  }

  const root = data as Record<string, unknown>;
  const nested =
    asRecord(root.playback) ??
    asRecord(root.data) ??
    root;

  const providerHint = normalizeProviderHint(
    pickString(
      nested.provider,
      nested.vendor,
      nested.streamingProvider,
      nested.sourceProvider,
      root.provider,
    ),
  );

  const token = pickString(
    nested.token,
    nested.playbackToken,
    nested.signedToken,
    nested.jwt,
  );

  let url =
    pickString(
      nested.url,
      nested.playbackUrl,
      nested.hlsUrl,
      nested.streamUrl,
      nested.manifestUrl,
      nested.signedUrl,
      nested.mp4Url,
    ) ?? extractUrlFromSources(nested);

  let provider = providerHint ?? (url ? providerFromUrl(url) : undefined);

  if (!url) {
    const muxPlaybackId = extractMuxPlaybackId(nested) ?? extractMuxPlaybackId(root);
    if (muxPlaybackId) {
      url = buildMuxHlsUrl(muxPlaybackId, token);
      provider = 'mux';
    }
  }

  if (!url) {
    throw new Error('Playback sin URL de stream.');
  }

  if (!provider) {
    provider = providerFromUrl(url);
  }

  const formatHint = pickString(nested.format, nested.contentType, nested.mimeType);

  return {
    url,
    format: inferFormat(url, formatHint),
    provider,
    expiresAt: pickString(nested.expiresAt, nested.expires_at),
    isLive:
      typeof nested.isLive === 'boolean' ? nested.isLive : defaultLive,
  };
}

export type EpisodePlaybackSeed = {
  kind: 'video' | 'live';
  provider?: string | null;
  muxPlaybackId?: string | null;
  playbackId?: string | null;
  playbackUrl?: string | null;
  hlsUrl?: string | null;
  externalUrl?: string | null;
  videoUrl?: string | null;
};

export function buildPlaybackFromSeed(
  seed: EpisodePlaybackSeed,
  defaultLive = false,
): PlaybackInfo | null {
  const provider = normalizeProviderHint(seed.provider ?? null);

  const directUrl = pickString(
    seed.playbackUrl,
    seed.hlsUrl,
    seed.externalUrl,
    seed.videoUrl,
  );
  if (directUrl) {
    return {
      url: directUrl,
      format: inferFormat(directUrl),
      provider: provider ?? providerFromUrl(directUrl),
      isLive: defaultLive,
    };
  }

  const muxId = pickString(
    seed.muxPlaybackId,
    provider === 'mux' ? seed.playbackId : null,
  );

  if (muxId && !muxId.includes('/') && !muxId.includes('.')) {
    return {
      url: buildMuxHlsUrl(muxId),
      format: 'hls',
      provider: 'mux',
      isLive: defaultLive,
    };
  }

  return null;
}

export function providerDeliveryLabel(provider?: StreamProvider | string | null): string {
  const normalized = normalizeProviderHint(
    typeof provider === 'string' ? provider : null,
  );
  if (normalized === 'mux') {
    return 'VOD · Mux';
  }
  if (normalized === 'bunny') {
    return 'VOD · Bunny Stream';
  }
  if (normalized === 'youtube') {
    return 'Live · YouTube (hold)';
  }
  if (normalized === 'external') {
    return 'VOD · External';
  }
  return 'VOD · Stream';
}

export function playbackUnavailableMessage(
  episode: {
    kind: 'video' | 'live';
    canPlay: boolean;
    contentStatus?: string;
    provider?: string | null;
  },
): string {
  const providerLabel =
    episode.provider === 'mux'
      ? 'Mux'
      : episode.provider === 'bunny'
        ? 'Bunny'
        : episode.provider === 'youtube'
          ? 'YouTube'
          : 'el proveedor de video';

  if (episode.canPlay) {
    return `El stream aún no está listo en ${providerLabel}. Pedile al backend que revise el asset o esperá el procesamiento.`;
  }

  const status = episode.contentStatus ?? 'unknown';
  if (episode.kind === 'live') {
    return `Este live no está disponible todavía (estado: ${status}).`;
  }
  if (status === 'processing' || status === 'draft') {
    return `El video se está procesando en ${providerLabel}. Probá más tarde.`;
  }
  if (status === 'failed') {
    return 'El procesamiento del video falló. Hay que re-subir o refrescar el asset.';
  }
  return `Playback no disponible (estado: ${status}).`;
}
