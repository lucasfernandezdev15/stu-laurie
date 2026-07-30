/**
 * Per-title premium badges and playback gates are paused until the BE
 * documents a field on videos / live-events (Swagger has none today).
 */
export const PREMIUM_ON_HOLD = true;

/**
 * YouTube watch URLs often block iframe embeds ("owner disabled playback
 * on other websites"). Prefer "Open on YouTube" until BE ships HLS (Bunny/Mux).
 */
export const YOUTUBE_EMBED_ON_HOLD = true;

/**
 * BE may leave videos as `status: "processing"` even when playback works.
 * Ignore video status for play gates until the workflow is reliable.
 */
export const VIDEO_STATUS_GATE_ON_HOLD = true;
