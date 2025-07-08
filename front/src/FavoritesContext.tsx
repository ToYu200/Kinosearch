import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Movie {
  id: string;
  name: string;
  posterUrl: string;
  year?: number;
  rating?: number;
}

interface FavoritesContextType {
  favoriteIds: string[];
  favoriteMovies: Movie[];
  loading: boolean;
  error: string | null;
  fetchFavorites: () => void;
  addFavorite: (movie: Movie) => Promise<void>;
  removeFavorite: (movie: Movie) => Promise<void>;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const BACKEND_URL = '/api';
const KINOPOISK_API_KEY = '635NF04-D2G4ZTV-NZCXXP8-5SPKESZ';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setFavoriteIds([]);
      setFavoriteMovies([]);
      setError('Вы не авторизованы. Пожалуйста, войдите в систему.');
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${BACKEND_URL}/likes`, { headers: { Authorization: 'Bearer ' + token } })
      .then(res => {
        if (res.status === 401) throw new Error('Сессия истекла. Войдите заново.');
        return res.json();
      })
      .then(async data => {
        const ids = Array.isArray(data.data) ? data.data.map((like: any) => like.movie_id).filter(Boolean) : [];
        setFavoriteIds(ids);
        if (!ids.length) {
          setFavoriteMovies([]);
          setLoading(false);
          return;
        }
        const url = 'https://api.kinopoisk.dev/v1.4/movie';
        const idsLimited = ids.slice(0, 50);
        try {
          const res = await fetch(
            url + '?limit=50&' + idsLimited.map((id: string | number | boolean) => 'id=' + encodeURIComponent(id)).join('&'),
            { headers: { 'X-API-KEY': KINOPOISK_API_KEY } }
          );
          if (!res.ok) throw new Error('Ошибка загрузки фильмов');
          const result = await res.json();
          const movies = (result.docs || []).map((m: any) => ({
            id: m.id,
            name: m.name || m.alternativeName || 'Без названия',
            posterUrl: m.poster?.url || '',
            year: m.year,
            rating: m.rating?.kp || m.rating?.imdb || m.rating?.filmCritics || m.rating?.await || undefined
          }));
          setFavoriteMovies(movies.filter((m: any) => m && m.id && m.posterUrl && m.posterUrl.startsWith('http')));
        } catch (err: any) {
          setError(err.message || 'Ошибка загрузки избранного');
          setFavoriteMovies([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Ошибка загрузки избранного');
        setFavoriteIds([]);
        setFavoriteMovies([]);
        setLoading(false);
      });
  }, []);

  const addFavorite = async (movie: Movie) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Вы не авторизованы. Пожалуйста, войдите в систему.');
      return;
    }
    setFavoriteIds(prev => {
      if (prev.includes(movie.id)) return prev;
      return [...prev, movie.id];
    });
    setFavoriteMovies(prev => {
      if (prev.find(m => m.id === movie.id)) return prev;
      return [...prev, movie];
    });
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ movie_id: movie.id }),
      });
      if (res.status === 401) throw new Error('Сессия истекла. Войдите заново.');
      if (!res.ok) {
        setFavoriteIds(prev => prev.filter(id => id !== movie.id));
        setFavoriteMovies(prev => prev.filter(m => m.id !== movie.id));
        throw new Error('Ошибка добавления в избранное');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка добавления в избранное');
      setFavoriteIds(prev => prev.filter(id => id !== movie.id));
      setFavoriteMovies(prev => prev.filter(m => m.id !== movie.id));
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (movie: Movie) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Вы не авторизованы. Пожалуйста, войдите в систему.');
      return;
    }
    setFavoriteIds(prev => prev.filter(id => id !== movie.id));
    setFavoriteMovies(prev => prev.filter(m => m.id !== movie.id));
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/likes/${movie.id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.status === 401) throw new Error('Сессия истекла. Войдите заново.');
      if (!res.ok) {
        setFavoriteIds(prev => {
          if (prev.includes(movie.id)) return prev;
          return [...prev, movie.id];
        });
        setFavoriteMovies(prev => {
          if (prev.find(m => m.id === movie.id)) return prev;
          return [...prev, movie];
        });
        throw new Error('Ошибка удаления из избранного');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления из избранного');
      setFavoriteIds(prev => {
        if (prev.includes(movie.id)) return prev;
        return [...prev, movie.id];
      });
      setFavoriteMovies(prev => {
        if (prev.find(m => m.id === movie.id)) return prev;
        return [...prev, movie];
      });
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (id: string) => favoriteIds.includes(id);

  const clearFavorites = () => {
    setFavoriteIds([]);
    setFavoriteMovies([]);
    setError(null);
  };

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, favoriteMovies, loading, error, fetchFavorites, addFavorite, removeFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
