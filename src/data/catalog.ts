export type ContentCategory =
  | 'Live Tonight'
  | 'After Dark'
  | 'Stars & Stripes'
  | 'Highlights'
  | 'Exclusives';

export type StreamFormat = 'hls' | 'mp4';

export interface Episode {
  id: string;
  title: string;
  description: string;
  category: ContentCategory;
  durationMinutes: number;
  thumbnailUrl: string;
  /** Playback URL (Bunny/Mux-style HLS or progressive MP4 for demos). */
  videoUrl: string;
  format: StreamFormat;
  /** Where the demo stream comes from until real Bunny/Mux IDs exist. */
  deliveryNote: string;
  isLive?: boolean;
  isPremium: boolean;
  airedAt: string;
  guests?: string[];
}

/**
 * Public demo streams (no backend).
 * Production will swap these for Bunny Stream / Mux playback URLs from the API.
 */
const STREAMS = {
  /** Real always-on IVS demo → behaves like a Live channel */
  liveIvs:
    'https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8',
  /** Mux public HLS test (same delivery model as Mux / Bunny HLS) */
  muxHls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  muxHlsAlt: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
  appleHls:
    'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
  tearsHls:
    'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  /** Progressive MP4 — most reliable on web Chrome */
  mp4Bunny: 'https://www.w3schools.com/html/mov_bbb.mp4',
  mp4Flower:
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  mp4Sample: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
} as const;

export const episodes: Episode[] = [
  {
    id: 'live-1',
    title: 'Stu & Laurie Live — Saturday Night',
    description:
      'Transmisión en vivo (demo). Stream HLS externo tipo Bunny/Mux Live — canal IVS público de prueba.',
    category: 'Live Tonight',
    durationMinutes: 120,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    videoUrl: STREAMS.liveIvs,
    format: 'hls',
    deliveryNote: 'Live HLS demo (Amazon IVS public channel)',
    isLive: true,
    isPremium: true,
    airedAt: '2026-07-18T23:00:00Z',
    guests: ['Special Guest TBA'],
  },
  {
    id: 'live-2',
    title: 'Live Lounge · Open Stream',
    description:
      'Segundo canal live de prueba (mismo feed demo). Free preview para validar UI LIVE sin suscripción.',
    category: 'Live Tonight',
    durationMinutes: 60,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    videoUrl: STREAMS.liveIvs,
    format: 'hls',
    deliveryNote: 'Live HLS demo (Amazon IVS public channel)',
    isLive: true,
    isPremium: false,
    airedAt: '2026-07-18T20:00:00Z',
  },
  {
    id: 'ad-101',
    title: 'After Dark · Ep. 101',
    description:
      'Variety show nocturno. VOD en HLS (Mux test stream) — mismo formato que entregará Bunny/Mux.',
    category: 'After Dark',
    durationMinutes: 58,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    videoUrl: STREAMS.muxHls,
    format: 'hls',
    deliveryNote: 'VOD HLS · Mux test-streams',
    isPremium: true,
    airedAt: '2026-06-28T03:00:00Z',
    guests: ['House Band'],
  },
  {
    id: 'ad-100',
    title: 'After Dark · Ep. 100',
    description:
      'Especial del episodio 100. VOD HLS alternativo (Mux) para probar adaptive bitrate.',
    category: 'After Dark',
    durationMinutes: 72,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    videoUrl: STREAMS.muxHlsAlt,
    format: 'hls',
    deliveryNote: 'VOD HLS · Mux test-streams (alt)',
    isPremium: true,
    airedAt: '2026-06-14T03:00:00Z',
  },
  {
    id: 'ss-42',
    title: 'Stars & Stripes · Independence Special',
    description:
      'Edición temática. VOD HLS Apple bipbop (stream de referencia multi-calidad).',
    category: 'Stars & Stripes',
    durationMinutes: 65,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    videoUrl: STREAMS.appleHls,
    format: 'hls',
    deliveryNote: 'VOD HLS · Apple sample',
    isPremium: true,
    airedAt: '2026-07-04T22:00:00Z',
  },
  {
    id: 'hl-toyota',
    title: 'Santa Papa John · Toyota Giveaway Recap',
    description:
      'Highlights del sorteo. MP4 short — reproduce bien en web Chrome sin HLS.',
    category: 'Highlights',
    durationMinutes: 12,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    videoUrl: STREAMS.mp4Flower,
    format: 'mp4',
    deliveryNote: 'VOD MP4 · public sample (web-friendly)',
    isPremium: false,
    airedAt: '2026-06-01T01:00:00Z',
  },
  {
    id: 'hl-orchesta',
    title: 'Behind the Curtain · Orquesta en Vivo',
    description:
      'Backstage con la banda. MP4 Big Buck Bunny (sample público).',
    category: 'Highlights',
    durationMinutes: 18,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
    videoUrl: STREAMS.mp4Bunny,
    format: 'mp4',
    deliveryNote: 'VOD MP4 · public sample (web-friendly)',
    isPremium: false,
    airedAt: '2026-05-20T18:00:00Z',
  },
  {
    id: 'ex-bts',
    title: 'Exclusive · Dressing Room Diaries',
    description:
      'Exclusivo suscriptores. Tears of Steel en HLS (demo unified-streaming).',
    category: 'Exclusives',
    durationMinutes: 24,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    videoUrl: STREAMS.tearsHls,
    format: 'hls',
    deliveryNote: 'VOD HLS · Tears of Steel demo',
    isPremium: true,
    airedAt: '2026-06-10T12:00:00Z',
  },
  {
    id: 'ex-bloopers',
    title: 'Exclusive · Bloopers Reel',
    description:
      'Bloopers. MP4 corto premium — útil para validar gate + play en web.',
    category: 'Exclusives',
    durationMinutes: 15,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&q=80',
    videoUrl: STREAMS.mp4Sample,
    format: 'mp4',
    deliveryNote: 'VOD MP4 · public sample (web-friendly)',
    isPremium: true,
    airedAt: '2026-05-28T12:00:00Z',
  },
];

export const categories: ContentCategory[] = [
  'Live Tonight',
  'After Dark',
  'Stars & Stripes',
  'Highlights',
  'Exclusives',
];

export function getEpisodeById(id: string): Episode | undefined {
  return episodes.find((episode) => episode.id === id);
}

export function getEpisodesByCategory(category: ContentCategory): Episode[] {
  return episodes.filter((episode) => episode.category === category);
}

export const subscriptionPlans = [
  {
    id: 'monthly',
    name: 'Monthly Access',
    priceLabel: '$9.99 / month',
    description: 'Full library + live shows. Cancel anytime.',
    billingNote: 'Billed on web via USIO (MVP mock).',
  },
  {
    id: 'annual',
    name: 'Annual Access',
    priceLabel: '$99 / year',
    description: 'Best value. Same premium access, billed yearly.',
    billingNote: 'Billed on web via USIO (MVP mock).',
  },
] as const;
