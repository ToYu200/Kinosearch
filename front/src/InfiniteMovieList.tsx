import { useState, useEffect, useCallback, useRef } from 'react';
import { useFavorites } from './FavoritesContext';
import { MovieFiltersState } from './types';

interface Movie {
  id: string;
  name: string;
  posterUrl: string;
  year?: number;
  rating?: number;
}

interface Props {
  filters: MovieFiltersState;
  onMovieClick?: (id: string) => void;
}

const MOVIE_API_URL = 'https://api.kinopoisk.dev/v1.4/movie';
const MOVIES_PER_PAGE = 50;
const KINOPOISK_API_KEY = '635NF04-D2G4ZTV-NZCXXP8-5SPKESZ';

const InfiniteMovieList = ({ filters, onMovieClick }: Props) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { addFavorite, removeFavorite, isFavorite, error } = useFavorites();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMovies = useCallback(async (nextPage: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = [
        `limit=${MOVIES_PER_PAGE}`,
        `page=${nextPage}`,
        'poster.url!=null',
        filters.sort === 'year' ? 'sortField=year' : 'sortField=rating.kp',
        'sortType=-1',
      ];
      if (filters.genres.length) {
        params.push(...filters.genres.map(g => `genres.name=${encodeURIComponent(g)}`));
      }
      if (filters.rating[0] > 0) params.push(`rating.kp>=${filters.rating[0]}`);
      if (filters.rating[1] < 10) params.push(`rating.kp<=${filters.rating[1]}`);
      if (filters.year[0] > 1990) params.push(`year>=${filters.year[0]}`);
      if (filters.year[1] < new Date().getFullYear()) params.push(`year<=${filters.year[1]}`);
      const url = `${MOVIE_API_URL}?${params.join('&')}`;
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': KINOPOISK_API_KEY
        }
      });
      if (!response.ok) throw new Error('Failed to fetch movies');
      const data = await response.json();
      const newMovies: Movie[] = (data.docs || []).map((m: any) => ({
        id: m.id,
        name:
          m.name ||
          m.alternativeName ||
          m.enName ||
          m.originalTitle ||
          m.title ||
          (m.names && Array.isArray(m.names) && m.names.length > 0 && (m.names[0].name || m.names[0].en || m.names[0].alternativeName)) ||
          'Без названия',
        posterUrl: m.poster?.url || '',
        year: m.year,
        rating: m.rating?.kp || m.rating?.imdb || m.rating?.filmCritics || m.rating?.await || undefined
      }));
      setMovies(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const filteredNewMovies = newMovies.filter((m: Movie) => !existingIds.has(m.id));
        return [...prev, ...filteredNewMovies];
      });
      if (newMovies.length < MOVIES_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading movies:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, loading]);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [filters]);

  useEffect(() => {
    if (page === 1) {
      loadMovies(1);
    } else if (page > 1) {
      loadMovies(page);
    }
  }, [page, filters]);

  const [removingId, setRemovingId] = useState<string | null>(null);
  const toggleFavorite = async (movie: Movie) => {
    setRemovingId(movie.id);
    if (isFavorite(movie.id)) {
      await removeFavorite(movie);
    } else {
      await addFavorite(movie);
    }
    setRemovingId(null);
  };

  useEffect(() => {
    if (!hasMore || loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => p + 1);
      }
    }, { rootMargin: '200px' });
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loading, movies]);

  return (
    <>
      <div className="movie-list" style={{ minHeight: '680px' }}>
        {movies.map(movie => (
          <div
            key={movie.id}
            className="movie-card"
            onClick={() => onMovieClick && onMovieClick(movie.id)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={movie.posterUrl}
              alt={movie.name}
              loading="lazy"
              style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: 16, background: '#eee' }}
            />
            <div className="movie-title" style={{ fontSize: '1rem', fontWeight: 500, color: '#222', margin: '8px 0 0 0', textAlign: 'center', width: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.name}</div>
            <div style={{ fontSize: '0.92rem', color: '#666', marginTop: 2 }}>{movie.year && <span>Год: {movie.year}</span>}</div>
            <div style={{ fontSize: '0.92rem', color: '#666', marginTop: 2 }}>{movie.rating !== undefined && <span>Рейтинг: {movie.rating}</span>}</div>
            <button
              type="button"
              className={isFavorite(movie.id) ? 'favorite active' : 'favorite'}
              onClick={e => {
                e.stopPropagation();
                toggleFavorite(movie);
              }}
              aria-label={isFavorite(movie.id) ? 'Убрать из избранного' : 'В избранное'}
              disabled={removingId === movie.id}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill={isFavorite(movie.id) ? '#e74c3c' : 'none'} stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.9.9-.9-.9a5.5 5.5 0 0 0-7.8 7.8l.9.9L12 21.3l8.7-8.7.9-.9a5.5 5.5 0 0 0 0-7.8z"></path>
              </svg>
            </button>
          </div>
        ))}
        {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
      {error && <div className="error">Ошибка: {error}</div>}
      {loading && hasMore && (
        <div style={{ textAlign: 'center', margin: '32px 0', color: '#888', fontSize: '1.2rem' }}>
          ... загружаем еще фильмы ...
        </div>
      )}
      {!hasMore && (
        <div className="empty">Больше фильмов нет 😢</div>
      )}
    </>
  );
};

export default InfiniteMovieList;
