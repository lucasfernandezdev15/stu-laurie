/**
 * Parse YouTube watch / short / embed URLs into a video id.
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = parsed.searchParams.get('v');
      if (v) {
        return v;
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (
        parts[0] === 'embed' ||
        parts[0] === 'shorts' ||
        parts[0] === 'live'
      ) {
        return parts[1] || null;
      }
    }
  } catch {
    // not a URL
  }

  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  return match?.[1] ?? null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

export function youtubeEmbedUrl(
  videoId: string,
  options?: { autoplay?: boolean; muted?: boolean },
): string {
  const params = new URLSearchParams({
    autoplay: options?.autoplay === false ? '0' : '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  });
  if (options?.muted) {
    params.set('mute', '1');
  }
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
