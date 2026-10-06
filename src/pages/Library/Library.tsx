import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Clock, Unlock, BookOpen, Search, Sparkles, Coins } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import styles from './Library.module.css';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { bookSeries, books, userLibrary, readingProgress, wallet } = useUser();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'unlocked'>('bookmarks');
  const [searchQuery, setSearchQuery] = useState('');

  // Series that are saved in user library
  const bookmarkedSeries = bookSeries.filter(series => {
    const seriesBooks = books.filter(b => b.series_id === series.id);
    return seriesBooks.some(b => userLibrary.some(lib => lib.book_id === b.id));
  });

  // Series with reading history
  const historySeries = bookSeries.filter(series => {
    const seriesBooks = books.filter(b => b.series_id === series.id);
    return seriesBooks.some(b => readingProgress.some(p => p.book_id === b.id));
  });

  // Series with unlocked chapters
  const unlockedSeries = bookSeries.filter(series => {
    const seriesBooks = books.filter(b => b.series_id === series.id);
    return seriesBooks.some(b => userLibrary.some(lib => lib.book_id === b.id));
  });

  const getActiveList = () => {
    let list = bookmarkedSeries;
    if (activeTab === 'history') list = historySeries.length > 0 ? historySeries : bookmarkedSeries;
    if (activeTab === 'unlocked') list = unlockedSeries.length > 0 ? unlockedSeries : bookmarkedSeries;
    
    if (searchQuery.trim()) {
      return list.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return list;
  };

  const currentDisplayList = getActiveList();

  const getProgressPercent = (seriesId: string) => {
    const seriesBooks = books.filter(b => b.series_id === seriesId);
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
            <h2>My Library & History</h2>
            <p className={styles.subtitle}>Track your bookmarks, reading progress, and unlocked manhwa chapters.</p>
          </div>

          {/* Quick Stats Strip */}
          <div className={styles.statsStrip}>
            <div className={styles.statBox}>
              <span className={styles.statVal}>{bookmarkedSeries.length}</span>
              <span className={styles.statLabel}>Bookmarks</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statBox}>
              <span className={styles.statVal}>{readingProgress.length}</span>
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
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'bookmarks' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              <Bookmark size={15} /> Bookmarks ({bookmarkedSeries.length})
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={15} /> Reading History ({historySeries.length})
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'unlocked' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('unlocked')}
            >
              <Unlock size={15} /> Unlocked ({unlockedSeries.length})
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
        {currentDisplayList.length > 0 ? (
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
            <h4>{searchQuery ? 'No Matching Titles' : 'Your Library is Empty'}</h4>
            <p>
              {searchQuery 
                ? `No bookmarked series match "${searchQuery}".`
                : "You haven't bookmarked any manhwa or manga yet. Start browsing the catalog to build your reading updates."}
            </p>
            <button className={styles.btnBrowse} onClick={() => navigate('/browse')}>
              <Compass size={16} /> Explore Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
