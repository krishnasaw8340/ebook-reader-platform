import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Bookmark, 
  Coins, 
  Play, 
  BookOpen, 
  Layers, 
  Star, 
  Eye, 
  Clock, 
  ArrowUpDown, 
  Search, 
  Share2, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { RechargeModal } from '../../components/common/RechargeModal';
import { getSeriesCover, getBookCover, getFallbackCoverUrl } from '../../utils/coverUtils';
import styles from './BookDetails.module.css';

export const BookDetails: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { 
    bookSeries, 
    books, 
    chapters, 
    userLibrary, 
    toggleBookmark, 
    readingProgress, 
    isChapterUnlocked 
  } = useUser();

  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chapters' | 'volumes' | 'preview'>('chapters');
  const [chapterSearch, setChapterSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const series = bookSeries.find(s => s.id === bookId || s.slug === bookId);
  const seriesBooks = books.filter(b => b.series_id === series?.id || (b as any).seriesId === series?.id);

  useEffect(() => {
    if (seriesBooks.length > 0 && !selectedBookId) {
      setSelectedBookId(seriesBooks[0].id);
    }
  }, [seriesBooks, selectedBookId]);

  if (!series) {
    return (
      <div className={styles.notFound}>
        <h3>Series Not Found</h3>
        <p>The series you are looking for does not exist.</p>
        <button className={styles.btnRead} onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const currentBook = books.find(b => b.id === selectedBookId) || seriesBooks[0];
  const allBookChapters = currentBook 
    ? chapters.filter(c => (c.book_id === currentBook.id || (c as any).bookId === currentBook.id))
    : [];

  // Filter & Sort Chapters
  const filteredChapters = allBookChapters
    .filter(c => {
      if (!chapterSearch.trim()) return true;
      const term = chapterSearch.toLowerCase();
      const num = String(c.chapter_no ?? c.chapterNumber ?? '');
      return num.includes(term) || (c.title && c.title.toLowerCase().includes(term));
    })
    .sort((a, b) => {
      const numA = a.chapter_no ?? a.chapterNumber ?? 0;
      const numB = b.chapter_no ?? b.chapterNumber ?? 0;
      return sortAsc ? numA - numB : numB - numA;
    });

  const isBookmarked = seriesBooks.some(b => 
    userLibrary.some(lib => lib.book_id === b.id)
  );

  const userProgress = readingProgress.find(p => seriesBooks.some(b => b.id === p.book_id));
  const hasReadingProgress = !!userProgress;

  const handleReadNow = () => {
    if (!currentBook) return;
    if (userProgress && userProgress.chapter_id) {
      navigate(`/reader/${userProgress.book_id}/${userProgress.chapter_id}`);
    } else {
      const firstChapter = allBookChapters.sort((a, b) => (a.chapter_no ?? a.chapterNumber ?? 0) - (b.chapter_no ?? b.chapterNumber ?? 0))[0];
      if (firstChapter) {
        navigate(`/reader/${currentBook.id}/${firstChapter.id}`);
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: series.title,
        text: `Read ${series.title} on KuroYomi Manga Platform`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const relatedSeries = bookSeries
    .filter(s => s.id !== series.id && s.status === series.status)
    .slice(0, 5);

  const statusColor = series.status === 'ONGOING' ? 'var(--color-status-success)' 
    : series.status === 'COMPLETED' ? 'var(--color-status-info)' 
    : 'var(--color-text-muted)';

  const coverSrc = getSeriesCover(series, books);

  return (
    <div className={styles.detailsPage}>
      {/* Cinematic Banner Backdrop */}
      <div className={styles.backdropContainer}>
        <div 
          className={styles.backdropImage} 
          style={{ backgroundImage: `url(${coverSrc})` }} 
        />
        <div className={styles.backdropOverlay} />
      </div>

      <div className="main-container" style={{ position: 'relative', zIndex: 2 }}>
        <Breadcrumbs 
          items={[
            { label: 'Home', path: '/' },
            { label: 'Browse', path: '/browse' },
            { label: series.title }
          ]} 
        />

        <div className={styles.heroSection}>
          {/* Cover Poster */}
          <div className={styles.coverWrapper}>
            <img 
              src={coverSrc} 
              alt={series.title}
              className={styles.coverImg}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getFallbackCoverUrl(series.title, 'Manhwa');
              }}
            />
            <span className={styles.ratingBadge}>
              <Star size={13} fill="#fbbf24" stroke="#fbbf24" /> 4.9
            </span>
          </div>

          {/* Metadata Block */}
          <div className={styles.headerInfo}>
            <div className={styles.badgesRow}>
              <span className={styles.statusBadge} style={{ color: statusColor, borderColor: statusColor }}>
                <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
                {series.status}
              </span>
              <span className={styles.formatBadge}>MANHWA</span>
              <span className={styles.badgeHD}><Sparkles size={11} /> ULTRA HD</span>
            </div>

            <h1 className={styles.title}>{series.title}</h1>

            {/* Quick Stats Strip */}
            <div className={styles.statsStrip}>
              <div className={styles.statItem}>
                <Star size={14} className={styles.statIconGold} fill="#fbbf24" />
                <span className={styles.statBold}>4.9</span>
                <span className={styles.statMuted}>Rating</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <Layers size={14} className={styles.statIcon} />
                <span className={styles.statBold}>{allBookChapters.length || 8}</span>
                <span className={styles.statMuted}>Chapters</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <Eye size={14} className={styles.statIcon} />
                <span className={styles.statBold}>128.4K</span>
                <span className={styles.statMuted}>Views</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <Bookmark size={14} className={styles.statIcon} />
                <span className={styles.statBold}>19.2K</span>
                <span className={styles.statMuted}>Bookmarks</span>
              </div>
            </div>

            {/* Synopsis */}
            <div className={styles.synopsisBlock}>
              <h3>Synopsis</h3>
              <p>{series.description || 'Dive into this action-packed manhwa filled with thrilling storylines, high-definition vertical panels, and unforgettable character arcs.'}</p>
            </div>

            {/* Primary Action Buttons */}
            <div className={styles.actionButtonsRow}>
              <button className={styles.btnReadPrimary} onClick={handleReadNow} disabled={!currentBook}>
                <Play size={16} fill="currentColor" />
                {hasReadingProgress ? 'Continue Reading' : 'Start Reading (Ch 1)'}
              </button>

              <button 
                className={`${styles.btnBookmark} ${isBookmarked ? styles.activeBookmark : ''}`}
                onClick={() => toggleBookmark(series.id)}
              >
                <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                {isBookmarked ? 'In Library' : 'Add to Library'}
              </button>

              <button className={styles.btnShare} onClick={handleShare} title="Share series">
                {copiedLink ? <Check size={16} style={{ color: '#10b981' }} /> : <Share2 size={16} />}
                {copiedLink ? 'Copied Link' : 'Share'}
              </button>
            </div>
          </div>
        </div>

        {/* Volume / Season Picker if multiple books exist */}
        {seriesBooks.length > 1 && (
          <div className={styles.volumeSelectorBlock}>
            <h3>Select Season / Volume</h3>
            <div className={styles.volumeTabs}>
              {seriesBooks.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBookId(b.id);
                    setActiveTab('chapters');
                  }}
                  className={`${styles.volumeTabBtn} ${selectedBookId === b.id ? styles.activeVolumeTab : ''}`}
                >
                  <Layers size={13} />
                  {b.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chapter List Section (MythToons UX) */}
        <section className={styles.chaptersSection}>
          <div className={styles.chaptersHeaderRow}>
            <div className={styles.chaptersTitleGroup}>
              <h2>Chapter Releases</h2>
              <span className={styles.chapterCounterBadge}>{allBookChapters.length} Total</span>
            </div>

            {/* Chapter Controls: Search & Sort */}
            <div className={styles.chapterControls}>
              <div className={styles.chapterSearchBox}>
                <Search size={14} className={styles.chapterSearchIcon} />
                <input 
                  type="text"
                  placeholder="Filter chapter number..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  className={styles.chapterSearchInput}
                />
                {chapterSearch && (
                  <button className={styles.searchClearBtn} onClick={() => setChapterSearch('')}>×</button>
                )}
              </div>

              <button 
                className={styles.sortToggleBtn}
                onClick={() => setSortAsc(!sortAsc)}
                title={sortAsc ? 'Sorting Ascending (1 → N)' : 'Sorting Descending (N → 1)'}
              >
                <ArrowUpDown size={14} />
                <span>{sortAsc ? 'Asc (1→N)' : 'Desc (N→1)'}</span>
              </button>
            </div>
          </div>

          {/* Chapter List */}
          <div className={styles.chapterListContainer}>
            {filteredChapters.length > 0 ? (
              filteredChapters.map((chapter) => {
                const isUnlocked = isChapterUnlocked(chapter.id);
                const isCurrentRead = userProgress?.chapter_id === chapter.id;

                return (
                  <div 
                    key={chapter.id} 
                    className={`${styles.chapterRowItem} ${isCurrentRead ? styles.activeReadRow : ''}`}
                    onClick={() => navigate(`/reader/${currentBook.id}/${chapter.id}`)}
                  >
                    <div className={styles.chapterRowLeft}>
                      <span className={styles.chapterNumTag}>
                        Ch. {chapter.chapter_no ?? chapter.chapterNumber}
                      </span>
                      <span className={styles.chapterTitleText}>
                        {chapter.title}
                      </span>
                    </div>

                    <div className={styles.chapterRowRight}>
                      <span className={styles.chapterReleaseTime}>
                        <Clock size={11} />
                        {new Date(chapter.created_at || (chapter as any).createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>

                      {chapter.coin_cost > 0 ? (
                        isUnlocked ? (
                          <span className={`${styles.lockBadge} ${styles.unlocked}`}>
                            <BookOpen size={11} /> Unlocked
                          </span>
                        ) : (
                          <span className={`${styles.lockBadge} ${styles.locked}`}>
                            <Coins size={11} /> {chapter.coin_cost} Coins
                          </span>
                        )
                      ) : (
                        <span className={`${styles.lockBadge} ${styles.free}`}>Free</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.noChaptersBox}>
                <p>No chapters match your search filter.</p>
                <button className={styles.btnClearFilter} onClick={() => setChapterSearch('')}>
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Related / Recommended Series Shelf */}
        {relatedSeries.length > 0 && (
          <section className={styles.relatedSection}>
            <div className={styles.relatedHeader}>
              <h2>You May Also Like</h2>
              <button className={styles.viewAllBtn} onClick={() => navigate('/browse')}>
                Browse More
              </button>
            </div>
            <div className={styles.relatedGrid}>
              {relatedSeries.map(s => (
                <BookCard key={s.id} series={s} />
              ))}
            </div>
          </section>
        )}
      </div>

      <RechargeModal isOpen={rechargeOpen} onClose={() => setRechargeOpen(false)} />
    </div>
  );
};

