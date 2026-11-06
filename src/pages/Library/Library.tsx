import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Clock, Unlock, BookOpen, Search, Sparkles, Coins } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import styles from './Library.module.css';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { bookSeries, books, chapters, chapterUnlocks, userLibrary, readingProgress, wallet, loading } = useUser();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'unlocked'>('bookmarks');
  const [searchQuery, setSearchQuery] = useState('');

  // Series that are saved in user library
  const bookmarkedSeries = bookSeries.filter(series => {
    const seriesBooks = books.filter(b => b.series_id === series.id || b.seriesId === series.id);
    return seriesBooks.some(b => userLibrary.some(lib => lib.book_id === b.id));
  });

  // Series with reading history
  const historySeries = bookSeries.filter(series => {
    const seriesBooks = books.filter(b => b.series_id === series.id || b.seriesId === series.id);
    return seriesBooks.some(b => readingProgress.some(p => p.book_id === b.id));
  });

  // Series with explicitly purchased chapter unlocks
  const unlockedSeries = bookSeries.filter(series => {
    const seriesBooks = books.filter(b => b.series_id === series.id || b.seriesId === series.id);
    const seriesBookIds = new Set(seriesBooks.map(book => book.id));
    const seriesChapterIds = new Set(
      chapters
        .filter(chapter => seriesBookIds.has(chapter.book_id || chapter.bookId || ''))
        .map(chapter => chapter.id)
    );
    return chapterUnlocks.some(unlock => seriesChapterIds.has(unlock.chapter_id));
  });

  const getActiveList = () => {
    let list = bookmarkedSeries;
    if (activeTab === 'history') list = historySeries;
    if (activeTab === 'unlocked') list = unlockedSeries;
    
    if (searchQuery.trim()) {
      return list.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return list;
  };

  const currentDisplayList = getActiveList();
  const emptyState = searchQuery
    ? {
        title: 'No Matching Titles',
        description: `No ${activeTab === 'bookmarks' ? 'bookmarked' : activeTab === 'history' ? 'reading history' : 'unlocked'} titles match "${searchQuery}".`
      }
    : activeTab === 'bookmarks'
      ? {
          title: 'Your Library is Empty',
          description: "You haven't bookmarked any titles yet. Browse the catalog to save a series here."
        }
      : activeTab === 'history'
        ? {
            title: 'No Reading History Yet',
            description: 'Titles will appear here after you start reading.'
          }
        : {
            title: 'No Unlocked Chapters Yet',
            description: 'Chapters you unlock will be collected here.'
          };

  const getProgressPercent = (seriesId: string) => {
    const seriesBooks = books.filter(b => b.series_id === seriesId || b.seriesId === seriesId);
    const prog = readingProgress.find(p => seriesBooks.some(b => b.id === p.book_id));
    if (!prog) return undefined;
    return prog.progress_percent ?? 0;
  };

  return (
    <div className={styles.library}>
      <div className="main-container">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'My Library' }]} />
        
        {/* Library Header */}
        <div className={styles.headerSection}>
          <div className={styles.titleInfo}>
            <div className={styles.headerBadge}>
              <Sparkles size={13} />
              <span>Personal Collection</span>
            </div>
            <h1>My Library</h1>
            <p className={styles.subtitle}>Your saved titles, reading history, and unlocked chapters.</p>
          </div>

          {/* Quick Stats Strip */}
          <div className={styles.statsStrip}>
            <div className={styles.statBox}>
              <span className={styles.statVal}>{bookmarkedSeries.length}</span>
              <span className={styles.statLabel}>Bookmarks</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statVal}>{historySeries.length}</span>
              <span className={styles.statLabel}>In Progress</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={`${styles.statVal} ${styles.coinColor}`}>
                <Coins size={14} className={styles.statCoinIcon} />
                {wallet?.balance || 0}
              </span>
              <span className={styles.statLabel}>Coins Available</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.tabs} role="tablist" aria-label="Library collections">
            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === 'bookmarks'}
              className={`${styles.tabBtn} ${activeTab === 'bookmarks' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              <Bookmark size={15} /> Bookmarks <span className={styles.tabCount}>{bookmarkedSeries.length}</span>
            </button>
            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={15} /> History <span className={styles.tabCount}>{historySeries.length}</span>
            </button>
            <button 
              type="button"
              role="tab"
              aria-selected={activeTab === 'unlocked'}
              className={`${styles.tabBtn} ${activeTab === 'unlocked' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('unlocked')}
            >
              <Unlock size={15} /> Unlocked <span className={styles.tabCount}>{unlockedSeries.length}</span>
            </button>
          </div>

          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className={styles.emptyCard} role="status">
            <p>Loading your collection…</p>
          </div>
        ) : currentDisplayList.length > 0 ? (
          <div className={styles.grid}>
            {currentDisplayList.map(series => (
              <BookCard 
                key={series.id} 
                series={series} 
                progressPercent={getProgressPercent(series.id)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconCircle}>
              <BookOpen size={36} className={styles.emptyIcon} />
            </div>
            <h2>{emptyState.title}</h2>
            <p>{emptyState.description}</p>
            {!searchQuery && (
              <button className={styles.btnBrowse} onClick={() => navigate('/browse')}>
                <Compass size={16} /> Explore Catalog
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
