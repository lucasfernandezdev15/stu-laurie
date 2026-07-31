export type UserStatus = 'active' | 'disabled' | 'pending' | string;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  status?: UserStatus;
  displayName?: string | null;
  roles?: string[];
  profile?: UserProfile | null;
  hasActiveSubscription?: boolean;
  planId?: string | null;
  subscription?: {
    status?: string;
    planId?: string | null;
    active?: boolean;
  } | null;
  billing?: {
    subscriptionStatus?: string;
    planId?: string | null;
  } | null;
  entitlements?: {
    streaming?: boolean;
  } | null;
}

export interface UserProfile {
  userId?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface UpdateCurrentProfileDto {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export type StreamFormat = 'hls' | 'mp4' | 'youtube';

export type StreamProvider =
  | 'bunny'
  | 'mux'
  | 'youtube'
  | 'external'
  | string;

/** Provider asset nested under GET /api/videos (Mux / Bunny). */
export interface VideoAsset {
  id: string;
  providerName?: string | null;
  providerAssetId?: string | null;
  providerPlaybackId?: string | null;
  uploadUrl?: string | null;
  playbackUrl?: string | null;
  status?: string | null;
  durationSeconds?: number | null;
  lastSyncedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VideoRecord {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  durationSeconds?: number | null;
  durationMinutes?: number | null;
  /** e.g. "free" | "premium" */
  accessLevel?: string | null;
  isPremium?: boolean;
  premium?: boolean;
  requiresSubscription?: boolean;
  accessTier?: string | null;
  sourceKind?: string | null;
  provider?: string | null;
  streamingProvider?: string | null;
  muxPlaybackId?: string | null;
  playbackId?: string | null;
  bunnyVideoId?: string | null;
  playbackUrl?: string | null;
  hlsUrl?: string | null;
  externalUrl?: string | null;
  assets?: VideoAsset[] | null;
  status?: string | null;
  publishedAt?: string | null;
  airedAt?: string | null;
  createdAt?: string | null;
  guests?: string[] | null;
  tags?: string[] | null;
  deliveryNote?: string | null;
}

export type LiveEventStatus =
  | 'scheduled'
  | 'live'
  | 'ended'
  | 'archived'
  | string;

export interface LiveEventRecord {
  id: string;
  title: string;
  description?: string | null;
  status?: LiveEventStatus;
  scheduledStartAt?: string | null;
  startsAt?: string | null;
  startedAt?: string | null;
  endsAt?: string | null;
  endedAt?: string | null;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  /** e.g. "free" | "premium" */
  accessLevel?: string | null;
  isPremium?: boolean;
  premium?: boolean;
  requiresSubscription?: boolean;
  accessTier?: string | null;
  category?: string | null;
  provider?: string | null;
  streamingProvider?: string | null;
  muxPlaybackId?: string | null;
  playbackId?: string | null;
  playbackUrl?: string | null;
  hlsUrl?: string | null;
  createdAt?: string | null;
}

export interface PlaybackInfo {
  url: string;
  format: StreamFormat;
  provider?: StreamProvider;
  expiresAt?: string | null;
  isLive?: boolean;
}

export interface ApiErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
