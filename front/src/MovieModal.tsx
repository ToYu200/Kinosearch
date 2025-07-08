import React, { useEffect, useState } from 'react';
import './MovieModal.css';

interface MovieModalProps {
  movieId: string | null;
  onClose: () => void;
}

interface MovieDetails {
  id: string;
  name: string;
  posterUrl?: string;
  description?: string;
  rating?: number;
  year?: number;
  genres?: string[];
}

const API_KEY = 'FA58WZB-00Q4E0Y-NZBZ3DN-R028QXR';
const API_URL = 'https://api.kinopoisk.dev/v1.4/movie';

const MovieModal: React.FC<MovieModalProps> = ({ movieId, onClose }) => {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}?id=${encodeURIComponent(movieId)}`, {
      headers: { 'X-API-KEY': API_KEY }
    })
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки фильма');
        return res.json();
      })
      .then(data => {
        const doc = Array.isArray(data.docs) ? data.docs[0] : null;
        if (!doc) throw new Error('Фильм не найден');
        setMovie({
          id: doc.id,
          name: doc.name || doc.alternativeName || 'Без названия',
          posterUrl: doc.poster?.url || '',
          description: doc.description || doc.shortDescription || '',
          rating: doc.rating?.kp || doc.rating?.imdb || doc.rating?.filmCritics || doc.rating?.await || undefined,
          year: doc.year,
          genres: Array.isArray(doc.genres) ? doc.genres.map((g: any) => g.name) : [],
        });
      })
      .catch(err => setError(err.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (!movieId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {loading ? (
          <div style={{ textAlign: 'center', margin: 32 }}>Загрузка...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', margin: 32 }}>{error}</div>
        ) : movie ? (
          <div className="movie-modal-details">
            {movie.posterUrl && (
              <img src={movie.posterUrl} alt={movie.name} style={{ width: 260, borderRadius: 16, marginBottom: 16, background: '#eee' }} />
            )}
            <h2 style={{ margin: '0 0 12px 0' }}>{movie.name}</h2>
            {movie.description && <div style={{ marginBottom: 12 }}>{movie.description}</div>}
            <div style={{ marginBottom: 8 }}><b>Рейтинг:</b> {movie.rating !== undefined ? movie.rating : '—'}</div>
            <div style={{ marginBottom: 8 }}><b>Год:</b> {movie.year || '—'}</div>
            <div style={{ marginBottom: 8 }}><b>Жанры:</b> {movie.genres && movie.genres.length ? movie.genres.join(', ') : '—'}</div>
          </div>
        ) : null}
      </div>
      {/* Стили теперь в MovieModal.css */}
    </div>
  );
};

export default MovieModal;
