import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, Clock, BookOpen, ChevronRight, Compass } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import styles from './Home.module.css';

const GENRE_TABS = ['All', 'Action', 'Fantasy', 'Romance', 'Drama', 'Comedy', 'Sci-Fi', 'Horror'] as const;
const STATUS_FILTERS = ['All', 'Ongoing', 'Completed'] as const;

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { bookSeries, books, chapters, readingProgress, userLibrary } = useUser();
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Continue reading filter
  const continueReadingList = bookSeries.filter(series => 
    readingProgress.some(prog => 
      books.some(b => b.series_id === series.id && b.id === prog.book_id)
    )
  );

  const getProgressPercent = (seriesId: string) => {
    const seriesBooks = books.filter(b => b.series_id === seriesId);
    const prog = readingProgress.find(p => seriesBooks.some(b => b.id === p.book_id));
    if (!prog) return undefined;
    return prog.progress_percent ?? 50;
  };

  // Search filter
  const searchFilteredSeries = searchQuery.trim()
    ? bookSeries.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  // Status filter for catalog
  const statusFilteredSeries = activeStatus === 'All' 
    ? bookSeries 
    : bookSeries.filter(s => s.status === activeStatus.toUpperCase());

  // Trending = first few, Latest = reverse order
  const trendingSeries = bookSeries.slice(0, 6);
  const latestSeries = [...bookSeries].reverse().slice(0, 8);
  const premiumSeries = bookSeries.filter(series => 
    books.some(b => b.series_id === series.id && b.coin_price > 0)
  );

  return (
    <div className={styles.home}>
      <div className="main-container">
        {/* Discovery Header — compact, search-first */}
        <section className={styles.discoverySection}>
          <div className={styles.discoveryContent}>
            <h1 className={styles.greeting}>Discover Manga</h1>
            <p className={styles.subtitle}>
              Browse, search, and start reading from our catalog.
            </p>
          </div>
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search series, books, creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                className={styles.searchClear} 
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {/* Search Results */}
        {searchFilteredSeries && (
          <section className={styles.section}>
            <Breadcrumbs 
              items={[
                { label: 'Home', path: '/' },
                { label: `Search: "${searchQuery}"` }
              ]} 
            />
            <div className={styles.sectionHeader}>
              <h2>Search Results</h2>
              <span className={styles.count}>{searchFilteredSeries.length} found</span>
            </div>
            {searchFilteredSeries.length > 0 ? (
              <div className={styles.bookGrid}>
                {searchFilteredSeries.map(series => (
                  <BookCard key={series.id} series={series} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Compass size={24} />
                <p>No manga found matching "{searchQuery}"</p>
                <button className={styles.btnClear} onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              </div>
            )}
          </section>
        )}

        {/* Main content — hidden during search */}
        {!searchFilteredSeries && (
          <>
            {/* Category Tabs */}
            <section className={styles.section}>
              <div className={`${styles.tabsRow} no-scrollbar`}>
                {GENRE_TABS.map(genre => (
                  <button
                    key={genre}
                    className={`${styles.tab} ${activeGenre === genre ? styles.tabActive : ''}`}
                    onClick={() => setActiveGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </section>

            {/* Continue Reading */}
            {continueReadingList.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2><BookOpen size={16} /> Continue Reading</h2>
                </div>
                <div className={`${styles.scrollShelf} no-scrollbar`}>
                  {continueReadingList.map(series => (
                    <BookCard 
                      key={series.id} 
                      series={series} 
                      progressPercent={getProgressPercent(series.id)}
                      compact
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Trending */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2><Flame size={16} /> Trending Now</h2>
                <button className={styles.viewAll} onClick={() => navigate('/browse')}>
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className={`${styles.scrollShelf} no-scrollbar`}>
                {trendingSeries.map(series => (
                  <BookCard key={series.id} series={series} compact />
                ))}
              </div>
            </section>

            {/* Status Filter + Catalog */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Browse Catalog</h2>
              </div>
              <div className={styles.filterRow}>
                {STATUS_FILTERS.map(filter => (
                  <button
                    key={filter}
                    className={`${styles.filterChip} ${activeStatus === filter ? styles.filterActive : ''}`}
                    onClick={() => setActiveStatus(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {statusFilteredSeries.length > 0 ? (
                <div className={styles.bookGrid}>
                  {statusFilteredSeries.slice(0, 12).map(series => (
                    <BookCard key={series.id} series={series} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No releases matching this filter.</p>
                </div>
              )}
            </section>

            {/* Latest Updates */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2><Clock size={16} /> Latest Updates</h2>
                <button className={styles.viewAll} onClick={() => navigate('/browse')}>
                  View All <ChevronRight size={14} />
                </button>
              </div>
              <div className={styles.bookGrid}>
                {latestSeries.slice(0, 6).map(series => (
                  <BookCard key={series.id} series={series} />
                ))}
              </div>
            </section>

            {/* Premium Collections */}
            {premiumSeries.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Premium Collections</h2>
                </div>
                <div className={`${styles.scrollShelf} no-scrollbar`}>
                  {premiumSeries.map(series => (
                    <BookCard key={series.id} series={series} compact />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
