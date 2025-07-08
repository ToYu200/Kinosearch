import { useState, Suspense, lazy } from 'react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import MovieModal from './MovieModal';
import { useSearchParams } from 'react-router-dom';
import MovieFilters from './MovieFilters';
import { MovieFiltersState } from './types';
import './App.css';

interface Movie {
  id: string;
  name: string;
  posterUrl: string;
  year?: number;
  rating?: number;
}

const InfiniteMovieList = lazy(() => import('./InfiniteMovieList'));
function App() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<MovieFiltersState>(() => {
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || [];
    const rating = [
      Number(searchParams.get('rating_gte')) || 0,
      Number(searchParams.get('rating_lte')) || 10,
    ];
    const year = [
      Number(searchParams.get('year_gte')) || 1990,
      Number(searchParams.get('year_lte')) || new Date().getFullYear(),
    ];
    const sort = (searchParams.get('sort') === 'year') ? 'year' : 'rating';
    return { genres, rating: rating as [number, number], year: year as [number, number], sort };
  });

  const [tab, setTab] = useState<'all' | 'favorites'>('all');
  const [modalMovieId, setModalMovieId] = useState<string | null>(null);

  const { favoriteMovies, loading, error, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const renderMovieCard = (movie: Movie, forceFavorite?: boolean) => {
    const fav = forceFavorite !== undefined ? forceFavorite : isFavorite(movie.id);
    return (
      <div
        key={movie.id}
        className={`movie-card${removingId === movie.id ? ' removing' : ''}`}
        style={{ transition: 'opacity 0.3s, transform 0.3s', opacity: removingId === movie.id ? 0 : 1, transform: removingId === movie.id ? 'scale(0.8)' : 'scale(1)' }}
        onClick={() => setModalMovieId(movie.id)}
      >
        <img src={movie.posterUrl} alt={movie.name} className="movie-poster" />
        <div className="movie-info">
          <div className="movie-title">{movie.name}</div>
          <div className="movie-year">{movie.year ? `Год: ${movie.year}` : ''}</div>
          {movie.rating !== undefined && (
            <div className="movie-rating">Рейтинг: {movie.rating}</div>
          )}
        </div>
        <button
          type="button"
          className={fav ? 'favorite active' : 'favorite'}
          onClick={async e => {
            e.stopPropagation();
            setRemovingId(movie.id);
            if (fav) {
              await removeFavorite(movie);
            } else {
              await addFavorite(movie);
            }
            setRemovingId(null);
          }}
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
          disabled={removingId === movie.id}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill={fav ? '#e74c3c' : 'none'} stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-.9.9-.9-.9a5.5 5.5 0 0 0-7.8 7.8l.9.9L12 21.3l8.7-8.7.9-.9a5.5 5.5 0 0 0 0-7.8z"></path></svg>
        </button>
        {error && <div style={{color: 'red', fontSize: 12, marginTop: 4}}>{error}</div>}
      </div>
    );
  };

  return (
    <>
      <header className="main-header">
        <nav className="tabs">
          <button
            className={tab === 'all' ? 'tab active' : 'tab'}
            onClick={() => setTab('all')}
          >
            Все фильмы
          </button>
          <button
            className={tab === 'favorites' ? 'tab active' : 'tab'}
            onClick={() => setTab('favorites')}
          >
            Любимые фильмы
          </button>
        </nav>
      </header>
      <div className="container">
        {tab === 'all' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <MovieFilters filters={filters} setFilters={setFilters} />
            </div>
          </>
        )}
        <main>
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : tab === 'all' ? (
            <Suspense fallback={<div className="loading">Загрузка фильмов...</div>}>
              <InfiniteMovieList filters={filters} onMovieClick={setModalMovieId} />
            </Suspense>
          ) : (
            <div className="movie-list">
              {favoriteMovies.length === 0 ? (
                <div className="empty">Нет любимых фильмов</div>
              ) : (
                favoriteMovies.map((movie: Movie) => renderMovieCard(movie, true))
              )}
            </div>
          )}
          {error && <div className="error">{error}</div>}
        </main>
        <MovieModal movieId={modalMovieId} onClose={() => setModalMovieId(null)} />
      </div>
    </>
  );
}

const AppWithFavoritesProvider = () => (
  <FavoritesProvider>
    <App />
  </FavoritesProvider>
);

export default AppWithFavoritesProvider;
