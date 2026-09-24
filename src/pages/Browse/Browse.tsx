import React, { useState } from 'react';
import { Search, Compass, SlidersHorizontal } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import styles from './Browse.module.css';

const GENRES = ['All', 'Action', 'Adventure', 'Fantasy', 'Romance', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Mystery', 'Slice of Life'] as const;
const STATUS_OPTIONS = ['All', 'Ongoing', 'Completed'] as const;
const SORT_OPTIONS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Latest', value: 'latest' },
  { label: 'A–Z', value: 'alpha' },
] as const;

export const Browse: React.FC = () => {
  const { bookSeries } = useUser();
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('popular');

  let filteredSeries = bookSeries.filter(series => {
    const matchesSearch = series.title.toLowerCase().includes(query.toLowerCase()) ||
      (series.description && series.description.toLowerCase().includes(query.toLowerCase()));

    const matchesStatus = selectedStatus === 'All' || series.status === selectedStatus.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // Sort
  if (sortBy === 'latest') {
    filteredSeries = [...filteredSeries].reverse();
  } else if (sortBy === 'alpha') {
    filteredSeries = [...filteredSeries].sort((a, b) => a.title.localeCompare(b.title));
  }

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    ...(selectedGenre !== 'All'
      ? [{ label: 'Browse', path: '/browse' }, { label: selectedGenre }]
      : [{ label: 'Browse Manga' }])
  ];

  return (
    <div className={styles.browse}>
      <div className="main-container">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Page header */}
        <div className={styles.pageHeader}>
          <h1>Browse Manga</h1>
          <p className={styles.subtitle}>
            Explore our complete catalog of manga series.
          </p>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by title, description, or creator..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          {query && (
            <button className={styles.searchClear} onClick={() => setQuery('')}>×</button>
          )}
        </div>

        {/* Genre Tabs */}
        <div className={`${styles.genresRow} no-scrollbar`}>
          {GENRES.map(genre => (
            <button 
              key={genre}
              className={`${styles.genreTab} ${selectedGenre === genre ? styles.genreActive : ''}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Filter & Sort Row */}
        <div className={styles.controlsRow}>
          <div className={styles.statusFilters}>
            {STATUS_OPTIONS.map(status => (
              <button
                key={status}
                className={`${styles.statusChip} ${selectedStatus === status ? styles.statusActive : ''}`}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className={styles.sortWrapper}>
            <SlidersHorizontal size={13} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className={styles.resultsInfo}>
          <span>{filteredSeries.length} series found</span>
        </div>

        {filteredSeries.length > 0 ? (
          <div className={styles.grid}>
            {filteredSeries.map(series => (
              <BookCard key={series.id} series={series} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <Compass size={28} className={styles.emptyIcon} />
            <h4>No Series Found</h4>
            <p>Try modifying your filters or search query.</p>
            <button className={styles.btnClear} onClick={() => { setQuery(''); setSelectedStatus('All'); setSelectedGenre('All'); }}>
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
