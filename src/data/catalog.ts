import { enrichVideoFromAssets } from '../api/assets';
import { providerDeliveryLabel } from '../api/playback';
import {
  PREMIUM_ON_HOLD,
  VIDEO_STATUS_GATE_ON_HOLD,
} from '../config/features';
import type { LiveEventRecord, VideoRecord } from '../api/types';

export type ContentCategory = string;

export type StreamFormat = 'hls' | 'mp4' | 'youtube';

export type ContentKind = 'video' | 'live';

export interface Episode {
  id: string;
  kind: ContentKind;
  title: string;
  description: string;
  category: ContentCategory;
  durationMinutes: number;
  thumbnailUrl: string;
  /** Optional until /playback is fetched. */
  videoUrl?: string;
  format: StreamFormat;
  deliveryNote: string;
  isLive?: boolean;
  isPremium: boolean;
  airedAt: string;
  guests?: string[];
  liveStatus?: string;
  /** Backend workflow status (draft, processing, published, live, …). */
  contentStatus?: string;
  /** Whether the FE should offer play (still may 404 if Bunny/Mux asset is missing). */
  canPlay: boolean;
  provider?: string | null;
  muxPlaybackId?: string | null;
  playbackUrl?: string | null;
  hlsUrl?: string | null;
}

export const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';

export const DEFAULT_CATEGORIES = [
  'Live Tonight',
  'After Dark',
  'Stars & Stripes',
  'Highlights',
  'Exclusives',
] as const;

const PLACEHOLDER_FORMAT: StreamFormat = 'hls';

/** Swagger has no premium field yet — default free unless BE sends one explicitly. */
function resolveIsPremium(record: {
  isPremium?: boolean;
  premium?: boolean;
  requiresSubscription?: boolean;
  accessTier?: string | null;
}): boolean {
  if (typeof record.isPremium === 'boolean') {
    return record.isPremium;
  }
  if (typeof record.premium === 'boolean') {
    return record.premium;
  }
  if (typeof record.requiresSubscription === 'boolean') {
    return record.requiresSubscription;
  }
  if (record.accessTier) {
    const tier = record.accessTier.toLowerCase();
    return tier !== 'free' && tier !== 'public';
  }
  return false;
}

const VIDEO_PLAYABLE = new Set(['published', 'ready']);
const LIVE_PLAYABLE = new Set(['live', 'ready', 'ended']);
const LIVE_SCHEDULED = new Set(['draft', 'scheduled']);

function resolveContentProvider(
  record: {
    provider?: string | null;
    streamingProvider?: string | null;
    muxPlaybackId?: string | null;
    playbackUrl?: string | null;
    hlsUrl?: string | null;
    sourceKind?: string | null;
    assets?: VideoRecord['assets'];
  },
): string | null {
  const assetProvider = record.assets?.[0]?.providerName;
  if (assetProvider) {
    return assetProvider;
  }
  if (record.muxPlaybackId) {
    return 'mux';
  }
  const hint =
    record.provider ??
    record.streamingProvider ??
    null;
  if (hint) {
    return hint;
  }
  // sourceKind like "direct-upload" is not a provider
  const direct = record.playbackUrl ?? record.hlsUrl;
  if (direct?.includes('stream.mux.com')) {
    return 'mux';
  }
  if (direct && /bunny|b-cdn\.net/i.test(direct)) {
    return 'bunny';
  }
  if (direct && /youtube\.com|youtu\.be/i.test(direct)) {
    return 'youtube';
  }
  return null;
}

function videoPlayability(
  status?: string | null,
  provider?: string | null,
): {
  contentStatus: string;
  canPlay: boolean;
  deliveryNote: string;
} {
  const normalized = (status ?? 'unknown').toLowerCase();
  const deliveryBase = providerDeliveryLabel(provider);

  // BE status is unreliable for now — always allow play attempts.
  if (VIDEO_STATUS_GATE_ON_HOLD) {
    return {
      contentStatus: normalized,
      canPlay: true,
      deliveryNote: deliveryBase,
    };
  }

  if (VIDEO_PLAYABLE.has(normalized)) {
    return {
      contentStatus: normalized,
      canPlay: true,
      deliveryNote: deliveryBase,
    };
  }
  if (normalized === 'failed') {
    return {
      contentStatus: normalized,
      canPlay: false,
      deliveryNote: 'VOD · processing failed',
    };
  }
  return {
    contentStatus: normalized,
    canPlay: false,
    deliveryNote: `VOD · ${normalized}`,
  };
}

function livePlayability(status?: string | null): {
  contentStatus: string;
  canPlay: boolean;
  deliveryNote: string;
  isLive: boolean;
} {
  const normalized = (status ?? 'unknown').toLowerCase();
  const isLive = normalized === 'live';
  if (LIVE_PLAYABLE.has(normalized)) {
    return {
      contentStatus: normalized,
      canPlay: true,
      deliveryNote: `Live · ${normalized}`,
      isLive,
    };
  }
  if (LIVE_SCHEDULED.has(normalized) || normalized === 'cancelled') {
    return {
      contentStatus: normalized,
      canPlay: false,
      deliveryNote: `Live · ${normalized}`,
      isLive: false,
    };
  }
  return {
    contentStatus: normalized,
    canPlay: false,
    deliveryNote: `Live · ${normalized}`,
    isLive,
  };
}

export function mapVideoToEpisode(video: VideoRecord): Episode {
  const enriched = enrichVideoFromAssets(video);
  const assetStatus = enriched.assets?.[0]?.status;
  const effectiveStatus = enriched.status ?? assetStatus;

  const durationMinutes =
    typeof enriched.durationMinutes === 'number'
      ? Math.max(1, Math.round(enriched.durationMinutes))
      : typeof enriched.durationSeconds === 'number'
        ? Math.max(1, Math.round(enriched.durationSeconds / 60))
        : 0;

  const provider = resolveContentProvider(enriched);
  const playability = videoPlayability(effectiveStatus, provider);

  return {
    id: enriched.id,
    kind: 'video',
    title: enriched.title || 'Untitled',
    description: enriched.description?.trim() || 'No description.',
    category: (enriched.category?.trim() || 'Highlights') as ContentCategory,
    durationMinutes,
    thumbnailUrl:
      enriched.thumbnailUrl?.trim() ||
      enriched.posterUrl?.trim() ||
      FALLBACK_THUMB,
    format: PLACEHOLDER_FORMAT,
    deliveryNote:
      enriched.deliveryNote?.trim() || playability.deliveryNote,
    isLive: false,
    isPremium: PREMIUM_ON_HOLD ? false : resolveIsPremium(enriched),
    airedAt:
      enriched.airedAt ||
      enriched.publishedAt ||
      enriched.createdAt ||
      new Date().toISOString(),
    guests: enriched.guests ?? undefined,
    contentStatus: playability.contentStatus,
    canPlay: playability.canPlay,
    provider,
    muxPlaybackId: enriched.muxPlaybackId ?? enriched.playbackId ?? null,
    playbackUrl: enriched.playbackUrl ?? null,
    hlsUrl: enriched.hlsUrl ?? null,
  };
}

export function mapLiveEventToEpisode(event: LiveEventRecord): Episode {
  const provider = resolveContentProvider(event);
  const playability = livePlayability(event.status);

  return {
    id: event.id,
    kind: 'live',
    title: event.title || 'Live event',
    description: event.description?.trim() || 'Live stream.',
    category: (event.category?.trim() || 'Live Tonight') as ContentCategory,
    durationMinutes: 0,
    thumbnailUrl:
      event.thumbnailUrl?.trim() ||
      event.posterUrl?.trim() ||
      FALLBACK_THUMB,
    format: 'hls',
    deliveryNote: playability.deliveryNote,
    isLive: playability.isLive,
    isPremium: PREMIUM_ON_HOLD ? false : resolveIsPremium(event),
    airedAt:
      event.scheduledStartAt ||
      event.startsAt ||
      event.startedAt ||
      event.createdAt ||
      new Date().toISOString(),
    liveStatus: event.status,
    contentStatus: playability.contentStatus,
    canPlay: playability.canPlay,
    provider,
    muxPlaybackId: event.muxPlaybackId ?? event.playbackId ?? null,
    playbackUrl: event.playbackUrl ?? null,
    hlsUrl: event.hlsUrl ?? null,
  };
}

export { playbackUnavailableMessage as playbackUnavailableLabel } from '../api/playback';

export function mergeCatalog(
  videos: VideoRecord[],
  liveEvents: LiveEventRecord[],
): Episode[] {
  const lives = liveEvents
    .map(mapLiveEventToEpisode)
    .sort((a, b) => {
      if (a.isLive === b.isLive) {
        return b.airedAt.localeCompare(a.airedAt);
      }
      return a.isLive ? -1 : 1;
    });
  const vods = videos
    .map(mapVideoToEpisode)
    .sort((a, b) => b.airedAt.localeCompare(a.airedAt));
  return [...lives, ...vods];
}

export function categoriesFromEpisodes(episodes: Episode[]): ContentCategory[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const preferred of DEFAULT_CATEGORIES) {
    if (episodes.some((ep) => ep.category === preferred)) {
      ordered.push(preferred);
      seen.add(preferred);
    }
  }

  for (const ep of episodes) {
    if (!seen.has(ep.category)) {
      ordered.push(ep.category);
      seen.add(ep.category);
    }
  }

  return ordered;
}

export function getEpisodesByCategory(
  episodes: Episode[],
  category: ContentCategory,
): Episode[] {
  return episodes.filter((episode) => episode.category === category);
}

export const subscriptionPlans = [
  {
    id: 'monthly',
    name: 'Monthly Access',
    priceLabel: '$11.50 / month',
    description: 'Full library + live shows. Cancel anytime.',
    billingNote: 'Billed on web via WooCommerce / USIO.',
  },
] as const;
