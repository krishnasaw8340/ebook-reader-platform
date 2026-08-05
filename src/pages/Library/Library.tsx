import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import styles from './Library.module.css';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { bookSeries, books, userLibrary, readingProgress } = useUser();

  const bookmarkedSeries = bookSeries.filter(series => {
    const seriesBooks = books.filter(b => b.series_id === series.id);
    return seriesBooks.some(b => userLibrary.some(lib => lib.book_id === b.id));
  });

  const getProgressPercent = (seriesId: string) => {
    const seriesBooks = books.filter(b => b.series_id === seriesId);
    const prog = readingProgress.find(p => seriesBooks.some(b => b.id === p.book_id));
    if (!prog) return undefined;
    // Mock progress percent
    return 75;
  };

  return (
    <div className={styles.library}>
      <div className="main-container">
        <h2>My Library</h2>
        <p className={styles.subtitle}>Track your bookmarks, reading history, and unlocked chapter volumes.</p>

        {bookmarkedSeries.length > 0 ? (
          <div className={styles.grid}>
            {bookmarkedSeries.map(series => (
              <BookCard 
                key={series.id} 
                series={series} 
                progressPercent={getProgressPercent(series.id)}
              />
            ))}
          </div>
        ) : (
          <div className={`${styles.emptyCard} glass`}>
            <Bookmark size={40} className={styles.emptyIcon} />
            <h4>Your Library is Empty</h4>
            <p>You haven't bookmarked any manga yet. Start browsing to compile your private library updates.</p>
            <button className={styles.btnBrowse} onClick={() => navigate('/browse')}>
              <Compass size={14} /> Browse Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
