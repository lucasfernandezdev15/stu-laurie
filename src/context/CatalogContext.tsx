import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '../api/errors';
import { buildPlaybackFromSeed } from '../api/playback';
import {
  getLiveEvent,
  getLiveEventPlayback,
  getVideo,
  getVideoPlayback,
  listLiveEvents,
  listVideos,
} from '../api/content';
import type { PlaybackInfo } from '../api/types';
import { useAuth } from './AuthContext';
import {
  categoriesFromEpisodes,
  mergeCatalog,
  type ContentCategory,
  type Episode,
} from '../data/catalog';

interface CatalogContextValue {
  episodes: Episode[];
  categories: ContentCategory[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getById: (id: string) => Episode | undefined;
  resolveEpisode: (id: string, kind?: Episode['kind']) => Promise<Episode>;
  resolvePlayback: (episode: Episode) => Promise<PlaybackInfo>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setEpisodes([]);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [videos, liveEvents] = await Promise.all([
        listVideos(),
        listLiveEvents(),
      ]);
      setEpisodes(mergeCatalog(videos, liveEvents));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No se pudo cargar el catálogo.';
      setError(message);
      setEpisodes([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getById = useCallback(
    (id: string) => episodes.find((item) => item.id === id),
    [episodes],
  );

  const resolveEpisode = useCallback(
    async (id: string, kind?: Episode['kind']): Promise<Episode> => {
      const cached = getById(id);
      if (cached && (!kind || cached.kind === kind)) {
        return cached;
      }

      const preferLive = kind === 'live' || cached?.kind === 'live';
      if (preferLive) {
        try {
          const event = await getLiveEvent(id);
          const mapped = mergeCatalog([], [event])[0];
          if (mapped) {
            return mapped;
          }
        } catch {
          // fall through to video
        }
      }

      const video = await getVideo(id);
      return mergeCatalog([video], [])[0]!;
    },
    [getById],
  );

  const resolvePlayback = useCallback(async (episode: Episode) => {
    try {
      if (episode.kind === 'live') {
        const event = await getLiveEvent(episode.id);
        return await getLiveEventPlayback(episode.id, event);
      }
      const video = await getVideo(episode.id);
      return await getVideoPlayback(episode.id, video);
    } catch (err) {
      const fallback = buildPlaybackFromSeed(
        {
          kind: episode.kind,
          provider: episode.provider,
          muxPlaybackId: episode.muxPlaybackId,
          playbackUrl: episode.playbackUrl,
          hlsUrl: episode.hlsUrl,
          videoUrl: episode.videoUrl,
        },
        episode.kind === 'live',
      );
      if (fallback) {
        return fallback;
      }
      throw err;
    }
  }, []);

  const categories = useMemo(
    () => categoriesFromEpisodes(episodes),
    [episodes],
  );

  const value = useMemo(
    () => ({
      episodes,
      categories,
      isLoading,
      error,
      refresh,
      getById,
      resolveEpisode,
      resolvePlayback,
    }),
    [
      episodes,
      categories,
      isLoading,
      error,
      refresh,
      getById,
      resolveEpisode,
      resolvePlayback,
    ],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return context;
}
