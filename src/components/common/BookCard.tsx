import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Star, Clock, Flame } from 'lucide-react';
import type { BookSeries } from '../../types';
import { useUser } from '../../contexts/UserContext';
import { getSeriesCover, getFallbackCoverUrl } from '../../utils/coverUtils';
import styles from './BookCard.module.css';

interface BookCardProps {
  series: BookSeries;
  progressPercent?: number;
  compact?: boolean;
  rankingNumber?: number;
  showChapters?: boolean;
  badge?: string;
  format?: string;
}

export const BookCard: React.FC<BookCardProps> = ({ 
  series, 
  progressPercent, 
  compact,
  rankingNumber,
  showChapters = false,
  badge,
  format = 'MANHWA'
}) => {
  const navigate = useNavigate();
  const { books, chapters, userLibrary, toggleBookmark } = useUser();

  const seriesBooks = books.filter(b => b.series_id === series.id || (b as any).seriesId === series.id);
  const isBookmarked = seriesBooks.some(b => 
    userLibrary.some(lib => lib.book_id === b.id)
  );

  const isPremium = seriesBooks.some(b => (b.coin_price ?? b.coinPrice ?? 0) > 0);

  // Get series chapters sorted
  const seriesBookIds = seriesBooks.map(b => b.id);
  const seriesChapters = chapters
    .filter(c => seriesBookIds.includes(c.book_id || (c as any).bookId))
    .sort((a, b) => (b.chapter_no ?? b.chapterNumber ?? 0) - (a.chapter_no ?? a.chapterNumber ?? 0));

  const latestChapter = seriesChapters[0];
  const recentChapters = seriesChapters.slice(0, 2);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(series.id);
  };

  const handleChapterClick = (e: React.MouseEvent, bookId: string, chapterId: string) => {
    e.stopPropagation();
    navigate(`/reader/${bookId}/${chapterId}`);
  };

  const statusColor = series.status === 'ONGOING' ? 'var(--color-status-success)' 
    : series.status === 'COMPLETED' ? 'var(--color-status-info)' 
    : 'var(--color-text-muted)';

  const coverSrc = getSeriesCover(series, books);

  // Deterministic rating based on ID
  const rating = (4.7 + ((series.title.length % 4) * 0.08)).toFixed(1);

  return (
    <div 
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      onClick={() => navigate(`/book/${series.id}`)}
    >
      {/* Cover Container */}
      <div className={styles.coverWrapper}>
        <img 
          src={coverSrc} 
          alt={series.title} 
          className={styles.cover} 
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackCoverUrl(series.title, format);
          }}
        />

        {/* Gradient Overlay */}
        <div className={styles.coverGradient} />

        {/* Ranking Badge (MythToons Top Ranking) */}
        {rankingNumber !== undefined && (
          <div className={`${styles.rankingBadge} ${rankingNumber <= 3 ? styles.topThree : ''}`}>
            {rankingNumber <= 3 && <Flame size={12} className={styles.rankingFlame} />}
            <span>#{rankingNumber}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className={styles.badgeTopRow}>
          {badge ? (
            <span className={styles.hotBadge}>{badge}</span>
          ) : (
            <span className={styles.formatBadge}>{format}</span>
          )}

          {isPremium && (
            <span className={styles.premiumTag}>Coins</span>
          )}
        </div>
        
        {/* Bookmark button — visible on hover or if bookmarked */}
        <button 
          className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`} 
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? 'Remove from library' : 'Add to library'}
          title={isBookmarked ? 'Saved to library' : 'Bookmark series'}
        >
          <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
        </button>

        {/* Bottom Cover Info Pill */}
        <div className={styles.coverBottomInfo}>
          {latestChapter ? (
            <span className={styles.latestChapterPill}>
              Ch. {latestChapter.chapter_no ?? latestChapter.chapterNumber}
            </span>
          ) : (
            <span className={styles.latestChapterPill}>{series.status}</span>
          )}
          <span className={styles.ratingBadge}>
            <Star size={11} fill="#fbbf24" stroke="#fbbf24" /> {rating}
          </span>
        </div>

        {/* Progress bar */}
        {progressPercent !== undefined && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className={styles.info}>
        <h4 className={styles.title} title={series.title}>{series.title}</h4>
        
        <div className={styles.metaRow}>
          <span className={styles.status}>
            <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
            {series.status}
          </span>

          {progressPercent !== undefined ? (
            <span className={styles.progress}>{progressPercent}% read</span>
          ) : (
            <span className={styles.chapterCount}>
              {seriesChapters.length > 0 ? `${seriesChapters.length} Chs` : 'New'}
            </span>
          )}
        </div>

        {/* MythToons Style Direct Clickable Chapters */}
        {showChapters && recentChapters.length > 0 && (
          <div className={styles.chapterList}>
            {recentChapters.map((ch, idx) => (
              <button
                key={ch.id}
                className={styles.chapterBtn}
                onClick={(e) => handleChapterClick(e, ch.book_id || (ch as any).bookId, ch.id)}
                title={`Read ${ch.title}`}
              >
                <span className={styles.chapterBtnNum}>
                  Ch. {ch.chapter_no ?? ch.chapterNumber}
                </span>
                <span className={styles.chapterBtnTime}>
                  <Clock size={10} />
                  {idx === 0 ? 'Today' : '2d ago'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

