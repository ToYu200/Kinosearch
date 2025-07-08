import React, { useState, useRef, useEffect } from 'react';
import './MovieFilters.css';

export interface MovieFiltersState {
  genres: string[];
  rating: [number, number];
  year: [number, number];
  sort: 'rating' | 'year';
}

const GENRES = [
  'драма', 'комедия', 'боевик'
];

const MIN_YEAR = 1990;
const MAX_YEAR = new Date().getFullYear();
const MIN_RATING = 0;
const MAX_RATING = 10;

interface Props {
  filters: MovieFiltersState;
  setFilters: (f: MovieFiltersState) => void;
}

const MovieFilters: React.FC<Props> = ({ filters, setFilters }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Жанры
  const toggleGenre = (genre: string) => {
    setFilters({
      ...filters,
      genres: filters.genres.includes(genre)
        ? filters.genres.filter(g => g !== genre)
        : [...filters.genres, genre],
    });
  };
  // Рейтинг
  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>, idx: 0 | 1) => {
    const val = Math.max(MIN_RATING, Math.min(MAX_RATING, Number(e.target.value)));
    const newRating: [number, number] = idx === 0 ? [val, filters.rating[1]] : [filters.rating[0], val];
    setFilters({ ...filters, rating: newRating });
  };
  // Год
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>, idx: 0 | 1) => {
    const val = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Number(e.target.value)));
    const newYear: [number, number] = idx === 0 ? [val, filters.year[1]] : [filters.year[0], val];
    setFilters({ ...filters, year: newYear });
  };

  return (
    <div className="movie-filters" ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="filter-btn" onClick={() => setOpen(o => !o)}>
        Фильтр
      </button>
      {open && (
        <div className="filter-dropdown" style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 20, minWidth: 260 }}>
          <div className="filter-group">
            <label style={{ fontWeight: 600 }}>Жанры:</label>
            <div className="genres-list">
              {GENRES.map(genre => (
                <label key={genre} className="genre-checkbox" style={{ marginRight: 12 }}>
                  <input
                    type="checkbox"
                    checked={filters.genres.includes(genre)}
                    onChange={() => toggleGenre(genre)}
                  />
                  {genre}
                </label>
              ))}
            </div>
          </div>
          <div className="filter-group" style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 600 }}>Рейтинг:</label>
            <input
              type="number"
              min={MIN_RATING}
              max={MAX_RATING}
              value={filters.rating[0]}
              onChange={e => handleRatingChange(e, 0)}
              style={{ width: 50, marginRight: 4 }}
            />
            —
            <input
              type="number"
              min={MIN_RATING}
              max={MAX_RATING}
              value={filters.rating[1]}
              onChange={e => handleRatingChange(e, 1)}
              style={{ width: 50, marginLeft: 4 }}
            />
          </div>
          <div className="filter-group" style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 600 }}>Год выпуска:</label>
            <input
              type="number"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={filters.year[0]}
              onChange={e => handleYearChange(e, 0)}
              style={{ width: 70, marginRight: 4 }}
            />
            —
            <input
              type="number"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={filters.year[1]}
              onChange={e => handleYearChange(e, 1)}
              style={{ width: 70, marginLeft: 4 }}
            />
          </div>
          <div className="filter-group" style={{ marginTop: 16 }}>
            <label style={{ fontWeight: 600 }}>Сортировка:</label>
            <select
              value={filters.sort}
              onChange={e => setFilters({ ...filters, sort: e.target.value as 'rating' | 'year' })}
              style={{ marginLeft: 8, padding: '4px 12px', borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="rating">по рейтингу</option>
              <option value="year">по году</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieFilters;
