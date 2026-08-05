import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bookmark, Coins, Play, BookOpen, Layers } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { BookCard } from '../../components/common/BookCard';
import { RechargeModal } from '../../components/common/RechargeModal';
import styles from './BookDetails.module.css';

export const BookDetails: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>(); // bookId is the series ID in route
  const navigate = useNavigate();
  const { bookSeries, books, chapters, userLibrary, toggleBookmark, readingProgress, isChapterUnlocked } = useUser();

  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'volumes' | 'chapters' | 'preview'>('chapters');
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const series = bookSeries.find(s => s.id === bookId);
  const seriesBooks = books.filter(b => b.series_id === series?.id);

  useEffect(() => {
    if (seriesBooks.length > 0 && !selectedBookId) {
      setSelectedBookId(seriesBooks[0].id);
    }
  }, [seriesBooks, selectedBookId]);

  if (!series) {
    return (
      <div className={styles.notFound}>
        <h3>Series Not Found</h3>
        <p>The series you are looking for does not exist in the database.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const currentBook = books.find(b => b.id === selectedBookId) || seriesBooks[0];
  const bookChapters = currentBook ? chapters.filter(c => c.book_id === currentBook.id).sort((a,b) => a.chapter_no - b.chapter_no) : [];

  const isBookmarked = seriesBooks.some(b => 
    userLibrary.some(lib => lib.book_id === b.id)
  );

  const handleReadNow = () => {
    if (!currentBook) return;
    const prog = readingProgress.find(p => seriesBooks.some(b => b.id === p.book_id));
    if (prog) {
      navigate(`/reader/${prog.book_id}/${prog.chapter_id}`);
    } else {
      const firstChapter = bookChapters[0];
      if (firstChapter) {
        navigate(`/reader/${currentBook.id}/${firstChapter.id}`);
      }
    }
  };

  // Find related series based on status or completion
  const relatedSeries = bookSeries
    .filter(s => s.id !== series.id && s.status === series.status)
    .slice(0, 4);

  return (
    <div className={styles.details}>
      {/* Blurred Backdrop */}
      <div className={styles.backdrop} style={{ backgroundImage: `url(${series.cover_image})` }} />

      <div className="main-container">
        <div className={styles.layout}>
          {/* Left Column: Cover and Actions */}
          <div className={styles.sidebar}>
            <div className={styles.coverWrapper}>
              <img src={series.cover_image || ''} alt={series.title} />
            </div>
            <div className={styles.sidebarActions}>
              <button className={styles.btnRead} onClick={handleReadNow} disabled={!currentBook}>
                <Play size={16} fill="currentColor" /> Read Now
              </button>
              <button 
                className={`${styles.btnBookmark} ${isBookmarked ? styles.activeAction : ''}`}
                onClick={() => toggleBookmark(series.id)}
              >
                <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                {isBookmarked ? 'Bookmarked' : 'Add to Library'}
              </button>
            </div>
          </div>

          {/* Right Column: Metadata details */}
          <div className={styles.main}>
            <div className={styles.header}>
              <h1 className={styles.title}>{series.title}</h1>
              <div className={styles.genresRow}>
                <span className={styles.genreBadge}>{series.status}</span>
                <span className={styles.genreBadge}>Catalog Series</span>
              </div>
            </div>

            {/* Statistics Row Grid */}
            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Status</span>
                <span className={styles.statVal}>{series.status}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Volumes Available</span>
                <span className={styles.statVal}>{seriesBooks.length}</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>Created At</span>
                <span className={styles.statVal}>{new Date(series.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Synopsis Description */}
            <div className={styles.descBlock}>
              <h3>Synopsis</h3>
              <p>{series.description}</p>
            </div>

            {/* Volume Picker */}
            {seriesBooks.length > 0 && (
              <div className={styles.descBlock}>
                <h3>Select Volume / Book</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {seriesBooks.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBookId(b.id);
                        setActiveTab('chapters');
                      }}
                      className={`${styles.tabBtn} ${selectedBookId === b.id ? styles.activeTab : ''}`}
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Layers size={14} />
                      {b.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs navigations */}
            <div className={styles.tabsNav}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'chapters' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('chapters')}
              >
                Chapters ({bookChapters.length})
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'preview' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                Volume Info & Preview
              </button>
            </div>

            {/* Dynamic tabs viewport */}
            <div className={styles.tabContent}>
              {activeTab === 'chapters' && currentBook && (
                <div className={styles.chaptersList}>
                  {bookChapters.length > 0 ? (
                    bookChapters.map((chapter) => {
                      const isUnlocked = isChapterUnlocked(chapter.id);

                      return (
                        <div 
                          key={chapter.id} 
                          className={styles.chapterRow}
                          onClick={() => navigate(`/reader/${currentBook.id}/${chapter.id}`)}
                        >
                          <div className={styles.chapterLeft}>
                            <span className={styles.chapterNum}>Ch {chapter.chapter_no}</span>
                            <span className={styles.chapterTitle}>{chapter.title}</span>
                          </div>
                          <div className={styles.chapterRight}>
                            {chapter.coin_cost > 0 ? (
                              isUnlocked ? (
                                <span className={`${styles.lockBadge} ${styles.unlocked}`}>
                                  <BookOpen size={11} /> Unlocked
                                </span>
                              ) : (
                                <span className={`${styles.lockBadge} ${styles.locked}`}>
                                  <Coins size={11} /> {chapter.coin_cost} Coin
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
                    <div className={styles.notFound} style={{ padding: '40px 0' }}>
                      No chapters uploaded for this volume yet.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preview' && currentBook && (
                <div className={styles.previewPane}>
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '4px' }}>{currentBook.title}</h4>
                    <p style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>{currentBook.summary}</p>
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      <strong>Price: </strong> {currentBook.coin_price > 0 ? `${currentBook.coin_price} Coins` : 'Free'}
                    </div>
                  </div>
                  <div className={styles.previewContainer}>
                    <img src={currentBook.cover_image || ''} alt="Volume Cover" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Related Recommendations shelf */}
            {relatedSeries.length > 0 && (
              <section className={styles.relatedSection}>
                <h3>Related Series</h3>
                <div className={styles.relatedShelf}>
                  {relatedSeries.map(s => (
                    <BookCard key={s.id} series={s} />
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>

      <RechargeModal isOpen={rechargeOpen} onClose={() => setRechargeOpen(false)} />
    </div>
  );
};
