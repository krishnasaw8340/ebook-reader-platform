import React, { useState, useEffect } from 'react';
import { Search, Compass, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import styles from './Browse.module.css';

const FORMAT_OPTIONS = ['All Formats', 'Manhwa', 'Manga', 'Webtoon', 'Novel'] as const;
const GENRES = ['All Genres', 'Action', 'Fantasy', 'Romance', 'Martial Arts', 'System', 'Drama', 'Comedy', 'Sci-Fi', 'Cyberpunk', 'Horror', 'Mystery'] as const;
const STATUS_OPTIONS = ['All', 'Ongoing', 'Completed'] as const;
const SORT_OPTIONS = [
  { label: '🔥 Most Popular', value: 'popular' },
  { label: '🕒 Latest Released', value: 'latest' },
  { label: '⭐ Highest Rated', value: 'rating' },
  { label: '🔤 A – Z', value: 'alpha' },
] as const;

export const Browse: React.FC = () => {
  const { bookSeries } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'All Genres';
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'popular';

  const [query, setQuery] = useState(initialQuery);
  const [selectedFormat, setSelectedFormat] = useState<string>('All Formats');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');

  useEffect(() => {
    const g = searchParams.get('genre');
    if (g && g !== selectedGenre) {
      setSelectedGenre(g);
    }
    const s = searchParams.get('sort');
    if (s && s !== sortBy) {
      setSortBy(s);
    }
  }, [searchParams]);

  let filteredSeries = bookSeries.filter(series => {
    const matchesSearch = series.title.toLowerCase().includes(query.toLowerCase()) ||
      (series.description && series.description.toLowerCase().includes(query.toLowerCase()));

    const matchesStatus = selectedStatus === 'All' || series.status === selectedStatus.toUpperCase();

    const matchesGenre = selectedGenre === 'All' || selectedGenre === 'All Genres' ||
      (series.title && series.title.toLowerCase().includes(selectedGenre.toLowerCase())) ||
      (series.description && series.description.toLowerCase().includes(selectedGenre.toLowerCase()));

    return matchesSearch && matchesStatus && matchesGenre;
  });

  // Sort
  if (sortBy === 'latest') {
    filteredSeries = [...filteredSeries].reverse();
  } else if (sortBy === 'alpha') {
    filteredSeries = [...filteredSeries].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === 'rating') {
    filteredSeries = [...filteredSeries].sort((a, b) => b.title.length - a.title.length);
  }

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    ...(selectedGenre !== 'All Genres' && selectedGenre !== 'All'
      ? [{ label: 'Browse', path: '/browse' }, { label: selectedGenre }]
      : [{ label: 'Browse Catalog' }])
  ];

  const handleResetFilters = () => {
    setQuery('');
    setSelectedFormat('All Formats');
    setSelectedGenre('All Genres');
    setSelectedStatus('All');
    setSortBy('popular');
  };

  return (
    <div className={styles.browse}>
      <div className="main-container">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Page Header */}
        <div className={styles.pageHeader}>
          <h1>Browse Manhwa & Novels</h1>
          <p className={styles.subtitle}>
            Explore thousands of vertical webtoons, Korean manhwa, Japanese manga, and light novels.
          </p>
        </div>

        {/* Search Input */}
        <div className={styles.searchBar}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search series, titles, descriptions, creators..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          {query && (
            <button className={styles.searchClear} onClick={() => setQuery('')}>×</button>
          )}
        </div>

        {/* Format Selector Tabs */}
        <div className={`${styles.formatTabsRow} no-scrollbar`}>
          {FORMAT_OPTIONS.map(format => (
            <button
              key={format}
              className={`${styles.formatTab} ${selectedFormat === format ? styles.formatTabActive : ''}`}
              onClick={() => setSelectedFormat(format)}
            >
              {format}
            </button>
          ))}
        </div>

        {/* Genre Pills */}
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

        {/* Controls Bar: Status, Sort, View Toggle */}
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

          <div className={styles.rightControls}>
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

            <div className={styles.viewToggleGroup}>
              <button 
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button 
                className={`${styles.viewBtn} ${viewMode === 'detailed' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('detailed')}
                title="Chapter feed view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className={styles.resultsInfo}>
          <span><strong>{filteredSeries.length}</strong> series found</span>
        </div>

        {/* Grid / Detailed List */}
        {filteredSeries.length > 0 ? (
          <div className={viewMode === 'detailed' ? styles.detailedGrid : styles.grid}>
            {filteredSeries.map(series => (
              <BookCard 
                key={series.id} 
                series={series} 
                showChapters={viewMode === 'detailed'}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyBox}>
            <Compass size={36} className={styles.emptyIcon} />
            <h4>No Series Found</h4>
            <p>Try modifying your genre tags, status filter, or search keywords.</p>
            <button className={styles.btnClear} onClick={handleResetFilters}>
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

