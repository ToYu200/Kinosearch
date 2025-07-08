export interface MovieFiltersState {
  genres: string[];
  rating: [number, number];
  year: [number, number];
  sort: 'rating' | 'year';
}
