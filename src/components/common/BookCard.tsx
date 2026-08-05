import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import type { BookSeries } from '../../types';
import { useUser } from '../../contexts/UserContext';
import styles from './BookCard.module.css';

interface BookCardProps {
  series: BookSeries;
  progressPercent?: number;
}

export const BookCard: React.FC<BookCardProps> = ({ series, progressPercent }) => {
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

  return (
    <motion.div 
      className={styles.card}
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => navigate(`/book/${series.id}`)}
    >
      {/* Cover Image Wrapper */}
      <div className={styles.coverWrapper}>
        <img 
          src={series.cover_image || ''} 
          alt={series.title} 
          className={styles.cover} 
          loading="lazy" 
        />
        
        {/* Overlay Gradients */}
        <div className={styles.overlay} />

        {/* Dynamic Coins badge */}
        {isPremium && (
          <div className={styles.premiumBadge}>
            <Coins size={11} className={styles.coinIcon} />
            <span>Coins</span>
          </div>
        )}

        {/* Action icons */}
        <div className={styles.actionsOverlay}>
          <button 
            className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`} 
            onClick={handleBookmarkClick}
            aria-label="Bookmark Book"
          >
            <Bookmark size={16} fill={isBookmarked ? "var(--primary)" : "none"} />
          </button>
        </div>

        {/* Status overlay at bottom */}
        <div className={styles.statsOverlay}>
          <div className={styles.stat}>
            <span className={styles.statusBadgeText}>{series.status}</span>
          </div>
        </div>

        {/* Progress bar overlay if active */}
        {progressPercent !== undefined && (
          <div className={styles.progressBarWrapper}>
            <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
            <span className={styles.progressPercent}>{progressPercent}% read</span>
          </div>
        )}
      </div>

      {/* Info details */}
      <div className={styles.info}>
        <h4 className={styles.title}>{series.title}</h4>
        <div className={styles.meta}>
          <span className={styles.author}>{series.description?.slice(0, 50)}...</span>
        </div>
      </div>
    </motion.div>
  );
};
