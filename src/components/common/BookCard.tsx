import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import type { BookSeries } from '../../types';
import { useUser } from '../../contexts/UserContext';
import styles from './BookCard.module.css';

interface BookCardProps {
  series: BookSeries;
  progressPercent?: number;
  compact?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ series, progressPercent, compact }) => {
  const navigate = useNavigate();
  const { books, userLibrary, toggleBookmark } = useUser();

  const seriesBooks = books.filter(b => b.series_id === series.id);
  const isBookmarked = seriesBooks.some(b => 
    userLibrary.some(lib => lib.book_id === b.id)
  );

  const isPremium = seriesBooks.some(b => b.coin_price > 0);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(series.id);
  };

  const statusColor = series.status === 'ONGOING' ? 'var(--color-status-success)' 
    : series.status === 'COMPLETED' ? 'var(--color-status-info)' 
    : 'var(--color-text-muted)';

  return (
    <div 
      className={`${styles.card} ${compact ? styles.compact : ''}`}
      onClick={() => navigate(`/book/${series.id}`)}
    >
      {/* Cover */}
      <div className={styles.coverWrapper}>
        <img 
          src={series.cover_image || ''} 
          alt={series.title} 
          className={styles.cover} 
          loading="lazy" 
        />
        
        {/* Bookmark button — visible on hover */}
        <button 
          className={`${styles.bookmarkBtn} ${isBookmarked ? styles.bookmarked : ''}`} 
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? 'Remove from library' : 'Add to library'}
        >
          <Bookmark size={14} fill={isBookmarked ? "currentColor" : "none"} />
        </button>

        {/* Premium indicator */}
        {isPremium && (
          <span className={styles.premiumTag}>Premium</span>
        )}

        {/* Progress bar */}
        {progressPercent !== undefined && (
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className={styles.info}>
        <h4 className={styles.title}>{series.title}</h4>
        <div className={styles.meta}>
          <span className={styles.status}>
            <span className={styles.statusDot} style={{ backgroundColor: statusColor }} />
            {series.status}
          </span>
          {progressPercent !== undefined && (
            <span className={styles.progress}>{progressPercent}%</span>
          )}
        </div>
      </div>
    </div>
  );
};
