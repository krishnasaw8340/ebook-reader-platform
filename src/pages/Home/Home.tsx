import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Flame, 
  Clock, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft,
  Compass, 
  Star, 
  Play, 
  Bookmark, 
  Sparkles, 
  Layers
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { getSeriesCover, getFallbackCoverUrl } from '../../utils/coverUtils';
import styles from './Home.module.css';

const FORMAT_TABS = ['All', 'Manhwa', 'Manga', 'Webtoon', 'Novel'] as const;
const GENRE_TABS = ['All Genres', 'Action', 'Fantasy', 'Romance', 'Martial Arts', 'System', 'Drama', 'Sci-Fi', 'Horror'] as const;
const STATUS_FILTERS = ['All', 'Ongoing', 'Completed'] as const;

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { bookSeries, books, chapters, readingProgress, userLibrary, toggleBookmark } = useUser();
  const [activeFormat, setActiveFormat] = useState<string>('All');
  const [activeGenre, setActiveGenre] = useState<string>('All Genres');
  const [activeStatus, setActiveStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroIndex, setHeroIndex] = useState(0);

  // Spotlight series for Hero Carousel
  const spotlightSeries = bookSeries.slice(0, 5);

  // Auto slide hero every 6 seconds
  useEffect(() => {
    if (spotlightSeries.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % spotlightSeries.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [spotlightSeries.length]);

  const currentHero = spotlightSeries[heroIndex] || bookSeries[0];
  const currentHeroBooks = currentHero ? books.filter(b => b.series_id === currentHero.id || (b as any).seriesId === currentHero.id) : [];
  const currentHeroBookIds = currentHeroBooks.map(b => b.id);
  const currentHeroChapters = chapters.filter(c => currentHeroBookIds.includes(c.book_id || (c as any).bookId)).sort((a,b) => (a.chapter_no ?? a.chapterNumber ?? 0) - (b.chapter_no ?? b.chapterNumber ?? 0));
  const isHeroBookmarked = currentHeroBooks.some(b => userLibrary.some(lib => lib.book_id === b.id));

  // Continue reading filter
  const continueReadingList = bookSeries.filter(series => 
    readingProgress.some(prog => 
      books.some(b => (b.series_id === series.id || (b as any).seriesId === series.id) && b.id === prog.book_id)
    )
  );

  const getProgressPercent = (seriesId: string) => {
    const seriesBooks = books.filter(b => b.series_id === seriesId || (b as any).seriesId === seriesId);
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

  // Catalog filtered by genre and status
  const catalogFilteredSeries = bookSeries.filter(s => {
    const matchesStatus = activeStatus === 'All' || s.status === activeStatus.toUpperCase();
    const matchesGenre = activeGenre === 'All Genres' || 
      (s.title && s.title.toLowerCase().includes(activeGenre.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(activeGenre.toLowerCase()));
    return matchesStatus && matchesGenre;
  });

  // MythToons Top Rankings = first 5
  const topRankedSeries = bookSeries.slice(0, 5);
  // Latest chapter updates
  const latestUpdatesSeries = [...bookSeries].reverse().slice(0, 6);
  // Trending shelf
  const trendingShelf = bookSeries.slice(0, 8);

  const handleHeroRead = () => {
    if (!currentHero) return;
    const prog = readingProgress.find(p => currentHeroBooks.some(b => b.id === p.book_id));
    if (prog) {
      navigate(`/reader/${prog.book_id}/${prog.chapter_id}`);
    } else if (currentHeroBooks[0] && currentHeroChapters[0]) {
      navigate(`/reader/${currentHeroBooks[0].id}/${currentHeroChapters[0].id}`);
    } else {
      navigate(`/book/${currentHero.id}`);
    }
  };

  return (
    <div className={styles.home}>
      {/* Search Header Bar (Sticky / Compact Top) */}
      <div className="main-container">
        <div className={styles.topSearchWrapper}>
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search manhwa, manga, webtoons, creators..."
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

          {/* Quick Format Filter Tabs */}
          <div className={`${styles.formatTabs} no-scrollbar`}>
            {FORMAT_TABS.map(tab => (
              <button
                key={tab}
                className={`${styles.formatTab} ${activeFormat === tab ? styles.formatTabActive : ''}`}
                onClick={() => setActiveFormat(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* If Search is active, show search results */}
      {searchFilteredSeries ? (
        <div className="main-container">
          <section className={styles.section}>
            <Breadcrumbs 
              items={[
                { label: 'Home', path: '/' },
                { label: `Search: "${searchQuery}"` }
              ]} 
            />
            <div className={styles.sectionHeader}>
              <h2>Search Results</h2>
              <span className={styles.count}>{searchFilteredSeries.length} titles found</span>
            </div>
            {searchFilteredSeries.length > 0 ? (
              <div className={styles.bookGrid}>
                {searchFilteredSeries.map(series => (
                  <BookCard key={series.id} series={series} showChapters />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Compass size={32} />
                <p>No titles found matching "{searchQuery}"</p>
                <button className={styles.btnClear} onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              </div>
            )}
          </section>
        </div>
      ) : (
        <>
          {/* Hero Spotlight Carousel */}
          {currentHero && (
            <div className={styles.heroContainer}>
              <div className={styles.heroSlide}>
                {/* Blurred backdrop image */}
                <div 
                  className={styles.heroBackdrop}
                  style={{ backgroundImage: `url(${getSeriesCover(currentHero, books)})` }}
                />
                <div className={styles.heroOverlay} />

                {/* Hero Content */}
                <div className={`main-container ${styles.heroInner}`}>
                  <div className={styles.heroPosterWrapper} onClick={() => navigate(`/book/${currentHero.id}`)}>
                    <img 
                      src={getSeriesCover(currentHero, books)} 
                      alt={currentHero.title} 
                      className={styles.heroPoster}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackCoverUrl(currentHero.title, 'Spotlight');
                      }}
                    />
                    <span className={styles.heroRatingTag}>
                      <Star size={12} fill="#fbbf24" stroke="#fbbf24" /> 4.9
                    </span>
                  </div>

                  <div className={styles.heroInfo}>
                    <div className={styles.heroBadges}>
                      <span className={styles.badgeHot}><Flame size={12} /> SPOTLIGHT</span>
                      <span className={styles.badgeGenre}>MANHWA</span>
                      <span className={styles.badgeStatus}>{currentHero.status}</span>
                    </div>

                    <h1 className={styles.heroTitle} onClick={() => navigate(`/book/${currentHero.id}`)}>
                      {currentHero.title}
                    </h1>

                    <p className={styles.heroSynopsis}>
                      {currentHero.description || 'Dive into this epic trending series with high quality vertical chapters and instant reading.'}
                    </p>

                    <div className={styles.heroMetaStats}>
                      <span><Layers size={13} /> {currentHeroChapters.length || 8} Chapters</span>
                      <span>•</span>
                      <span><Sparkles size={13} /> High Definition</span>
                      <span>•</span>
                      <span><Clock size={13} /> Updated Today</span>
                    </div>

                    <div className={styles.heroActions}>
                      <button className={styles.heroBtnRead} onClick={handleHeroRead}>
                        <Play size={15} fill="currentColor" /> Read Chapter 1
                      </button>

                      <button 
                        className={`${styles.heroBtnBookmark} ${isHeroBookmarked ? styles.heroBtnBookmarked : ''}`}
                        onClick={() => toggleBookmark(currentHero.id)}
                      >
                        <Bookmark size={15} fill={isHeroBookmarked ? "currentColor" : "none"} />
                        {isHeroBookmarked ? 'Bookmarked' : 'Add to Library'}
                      </button>

                      <button className={styles.heroBtnDetails} onClick={() => navigate(`/book/${currentHero.id}`)}>
                        Overview
                      </button>
                    </div>
                  </div>
                </div>

                {/* Carousel Controls */}
                <div className={styles.heroControls}>
                  <button 
                    className={styles.heroNavBtn} 
                    onClick={() => setHeroIndex((prev) => (prev === 0 ? spotlightSeries.length - 1 : prev - 1))}
                    aria-label="Previous Spotlight"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className={styles.heroDots}>
                    {spotlightSeries.map((s, idx) => (
                      <span 
                        key={s.id} 
                        className={`${styles.heroDot} ${heroIndex === idx ? styles.heroDotActive : ''}`}
                        onClick={() => setHeroIndex(idx)}
                      />
                    ))}
                  </div>
                  <button 
                    className={styles.heroNavBtn} 
                    onClick={() => setHeroIndex((prev) => (prev + 1) % spotlightSeries.length)}
                    aria-label="Next Spotlight"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="main-container">
            {/* Genre Pill Carousel */}
            <section className={styles.genreShelfSection}>
              <div className={`${styles.genrePillsRow} no-scrollbar`}>
                {GENRE_TABS.map(genre => (
                  <button
                    key={genre}
                    className={`${styles.genrePill} ${activeGenre === genre ? styles.genrePillActive : ''}`}
                    onClick={() => setActiveGenre(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </section>

            {/* Continue Reading Shelf (If user has progress) */}
            {continueReadingList.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2><BookOpen size={18} className={styles.sectionIcon} /> Continue Reading</h2>
                  <button className={styles.viewAll} onClick={() => navigate('/library')}>
                    My Library <ChevronRight size={14} />
                  </button>
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

            {/* MythToons Signature Top Weekly Rankings */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleBlock}>
                  <h2><Flame size={18} className={styles.rankingFlameIcon} /> Weekly Top Rankings</h2>
                  <span className={styles.sectionSubtitle}>Most read manhwa & novels this week</span>
                </div>
                <button className={styles.viewAll} onClick={() => navigate('/browse?sort=popular')}>
                  Top 100 <ChevronRight size={14} />
                </button>
              </div>

              <div className={styles.rankingGrid}>
                {topRankedSeries.map((series, idx) => (
                  <BookCard 
                    key={series.id} 
                    series={series} 
                    rankingNumber={idx + 1}
                    badge={idx === 0 ? 'HOT' : undefined}
                  />
                ))}
              </div>
            </section>

            {/* MythToons Signature 1-Click Latest Chapter Updates Feed */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleBlock}>
                  <h2><Clock size={18} className={styles.clockIcon} /> Latest Chapter Releases</h2>
                  <span className={styles.sectionSubtitle}>Fresh translations uploaded recently</span>
                </div>
                <button className={styles.viewAll} onClick={() => navigate('/browse?sort=latest')}>
                  View All Updates <ChevronRight size={14} />
                </button>
              </div>

              <div className={styles.latestGrid}>
                {latestUpdatesSeries.map((series) => (
                  <BookCard 
                    key={series.id} 
                    series={series} 
                    showChapters
                  />
                ))}
              </div>
            </section>

            {/* Trending Now Shelf */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2><Sparkles size={18} className={styles.sparkleIcon} /> Trending Comics & Novels</h2>
                <button className={styles.viewAll} onClick={() => navigate('/browse')}>
                  Explore <ChevronRight size={14} />
                </button>
              </div>
              <div className={`${styles.scrollShelf} no-scrollbar`}>
                {trendingShelf.map(series => (
                  <BookCard key={series.id} series={series} compact />
                ))}
              </div>
            </section>

            {/* Complete Catalog Section with Status Filter Chips */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Explore Full Catalog</h2>
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
              </div>

              {catalogFilteredSeries.length > 0 ? (
                <div className={styles.bookGrid}>
                  {catalogFilteredSeries.slice(0, 12).map(series => (
                    <BookCard key={series.id} series={series} />
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Compass size={28} />
                  <p>No series match the selected filter criteria.</p>
                  <button className={styles.btnClear} onClick={() => { setActiveGenre('All Genres'); setActiveStatus('All'); }}>
                    Reset Filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
};

