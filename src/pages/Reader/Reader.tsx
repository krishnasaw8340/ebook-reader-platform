import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Bookmark, Sun, ZoomIn, Eye, ChevronLeft, ChevronRight, Maximize2, Settings, Lock, Compass, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { RechargeModal } from '../../components/common/RechargeModal';
import styles from './Reader.module.css';

export const Reader: React.FC = () => {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { 
    books, 
    bookSeries, 
    chapters, 
    pages, 
    wallet, 
    unlockChapter, 
    isChapterUnlocked, 
    readingProgress, 
    saveProgress, 
    userLibrary, 
    toggleBookmark 
  } = useUser();

  const [pageNum, setPageNum] = useState(1);
  const [readingMode, setReadingMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [brightness, setBrightness] = useState<'normal' | 'dim' | 'dark'>('normal');
  const [zoomLevel, setZoomLevel] = useState<'fit-width' | 'fit-screen' | 'large'>('fit-width');
  const [showHUD, setShowHUD] = useState(true);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [coinFloat, setCoinFloat] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);

  const book = books.find(b => b.id === bookId);
  const series = book ? bookSeries.find(s => s.id === book.series_id) : null;
  const chapter = chapters.find(c => c.id === chapterId);
  const chapterPages = pages.filter(p => p.chapter_id === chapterId).sort((a,b) => a.page_no - b.page_no);
  const bookChapters = chapters.filter(c => c.book_id === bookId).sort((a,b) => a.chapter_no - b.chapter_no);
  const chapterIndex = bookChapters.findIndex(c => c.id === chapterId);

  const isLocked = chapter ? !isChapterUnlocked(chapter.id) : true;

  const isSeriesBookmarked = series ? books.filter(b => b.series_id === series.id).some(b => userLibrary.some(lib => lib.book_id === b.id)) : false;

  // Auto-hide HUD on scroll inside vertical mode
  useEffect(() => {
    const handleScroll = () => {
      if (readingMode === 'vertical' && window.scrollY > 100) {
        setShowHUD(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingMode]);

  // Load progress if exists
  useEffect(() => {
    if (book && chapter && chapterPages.length > 0) {
      const prog = readingProgress.find(p => p.book_id === book.id && p.chapter_id === chapter.id);
      if (prog) {
        const targetPage = chapterPages.find(pg => pg.id === prog.page_id);
        if (targetPage) {
          setPageNum(targetPage.page_no);
        } else {
          setPageNum(1);
        }
      } else {
        setPageNum(1);
      }
    }
  }, [bookId, chapterId, chapterPages.length]);

  if (!book || !chapter || !series) {
    return (
      <div className={styles.notFound}>
        <h3>Chapter or Book Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const handleUnlock = () => {
    const success = unlockChapter(chapter.id);
    if (success) {
      setCoinFloat(true);
      setTimeout(() => setCoinFloat(false), 1200);
      
      const firstPage = chapterPages[0];
      if (firstPage) {
        saveProgress(book.id, chapter.id, firstPage.id);
      }
    } else {
      setRechargeOpen(true);
    }
  };

  const handlePageChange = (nextPageNo: number) => {
    if (nextPageNo < 1 || nextPageNo > chapterPages.length) return;
    setPageNum(nextPageNo);
    const targetPage = chapterPages.find(p => p.page_no === nextPageNo);
    if (targetPage) {
      saveProgress(book.id, chapter.id, targetPage.id);
    }
    
    if (readingMode === 'horizontal') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextChapter = () => {
    if (chapterIndex < bookChapters.length - 1) {
      const nextCh = bookChapters[chapterIndex + 1];
      navigate(`/reader/${book.id}/${nextCh.id}`);
    }
  };

  const handlePrevChapter = () => {
    if (chapterIndex > 0) {
      const prevCh = bookChapters[chapterIndex - 1];
      navigate(`/reader/${book.id}/${prevCh.id}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const cycleBrightness = () => {
    if (brightness === 'normal') setBrightness('dim');
    else if (brightness === 'dim') setBrightness('dark');
    else setBrightness('normal');
  };

  const cycleZoom = () => {
    if (zoomLevel === 'fit-width') setZoomLevel('fit-screen');
    else if (zoomLevel === 'fit-screen') setZoomLevel('large');
    else setZoomLevel('fit-width');
  };

  return (
    <div className={`${styles.reader} ${styles[brightness]}`}>
      {/* HUD Header */}
      <AnimatePresence>
        {showHUD && (
          <motion.header 
            className={`${styles.hudHeader} glass`}
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
          >
            <div className={styles.hudLeft} onClick={() => navigate(`/book/${series.id}`)}>
              <ArrowLeft size={20} />
              <div className={styles.titleInfo}>
                <span className={styles.chapterNum}>Ch {chapter.chapter_no}: {chapter.title}</span>
                <span className={styles.bookTitle}>{book.title} ({series.title})</span>
              </div>
            </div>

            <div className={styles.hudRight}>
              <div className={styles.walletPill} onClick={() => setRechargeOpen(true)}>
                <Coins size={14} />
                <span>{wallet?.balance || 0} Coins</span>
              </div>
              <button 
                className={`${styles.hudBtn} ${isSeriesBookmarked ? styles.activeBtn : ''}`}
                onClick={() => toggleBookmark(series.id)}
              >
                <Bookmark size={18} fill={isSeriesBookmarked ? "currentColor" : "none"} />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Floating -Coin Pop Animation */}
      <AnimatePresence>
        {coinFloat && (
          <motion.div 
            className={styles.coinFloat}
            initial={{ scale: 0.8, opacity: 0, y: 0 }}
            animate={{ scale: 1.2, opacity: 1, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <Coins size={28} className={styles.floatIcon} />
            <span>-{chapter.coin_cost} Coin</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader Main viewport */}
      <main 
        className={`${styles.viewport} ${styles[zoomLevel]} ${styles[readingMode]}`}
        ref={workspaceRef}
        onClick={() => setShowHUD(!showHUD)}
      >
        {isLocked ? (
          // Unlock card screen
          <div className={styles.lockScreen} onClick={(e) => e.stopPropagation()}>
            <motion.div 
              className={`${styles.lockCard} glass`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className={styles.lockIcon}><Lock size={32} /></div>
              <h3>Unlock Premium Chapter</h3>
              <p>This chapter requires <strong>{chapter.coin_cost} Coin</strong> to unlock. You will have permanent access to this chapter's pages.</p>
              
              <button className={styles.btnUnlock} onClick={handleUnlock}>
                Unlock Chapter
              </button>
              
              <div className={styles.lockWallet}>
                Your wallet balance: <span className={styles.lockWalletVal}><Coins size={12} /> {wallet?.balance || 0} Coins</span>
              </div>
            </motion.div>
          </div>
        ) : (
          // Render Pages (Horizontal vs Vertical)
          <div className={styles.pagesContainer}>
            {readingMode === 'vertical' ? (
              // Vertical list of all pages
              chapterPages.map((page, idx) => (
                <div key={page.id} className={styles.pageItem}>
                  <div className={styles.pageLoader}><Compass className={styles.spin} /> Page {idx + 1} loading...</div>
                  <img 
                    src={page.image_url} 
                    alt={`Page ${idx + 1}`} 
                    onLoad={(e) => e.currentTarget.parentElement?.classList.add(styles.loaded)}
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/600x900/121212/ffffff?text=Page+${idx + 1}+Loading+Error`;
                      e.currentTarget.parentElement?.classList.add(styles.loaded);
                    }}
                  />
                </div>
              ))
            ) : (
              // Horizontal single page swipe viewport
              <div className={styles.singlePageWrapper} onClick={(e) => e.stopPropagation()}>
                <ChevronLeft 
                  className={`${styles.navChevron} ${pageNum <= 1 ? styles.disabledChevron : ''}`}
                  onClick={() => handlePageChange(pageNum - 1)}
                />
                
                <div className={styles.horizontalPageItem}>
                  <img 
                    src={chapterPages[pageNum - 1]?.image_url} 
                    alt={`Page ${pageNum}`} 
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/600x900/121212/ffffff?text=Page+${pageNum}+Loading+Error`;
                    }}
                  />
                </div>

                <ChevronRight 
                  className={`${styles.navChevron} ${pageNum >= chapterPages.length ? styles.disabledChevron : ''}`}
                  onClick={() => handlePageChange(pageNum + 1)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* HUD Footer Slider Drawer */}
      <AnimatePresence>
        {showHUD && !isLocked && chapterPages.length > 0 && (
          <motion.footer 
            className={`${styles.hudFooter} glass`}
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
          >
            {/* Nav progress track bar */}
            <div 
              className={styles.progressTrack}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = clickX / rect.width;
                const targetPage = Math.round(percent * (chapterPages.length - 1)) + 1;
                handlePageChange(targetPage);
              }}
            >
              <div 
                className={styles.progressFill} 
                style={{ width: `${((pageNum - 1) / (chapterPages.length - 1)) * 100}%` }}
              />
            </div>

            <div className={styles.footerRow}>
              {/* Adjustments left buttons */}
              <div className={styles.footerLeft}>
                <button 
                  className={styles.hudBtn} 
                  onClick={cycleBrightness}
                  title="Brightness settings"
                >
                  <Sun size={18} />
                  <span className={styles.btnSubtext}>{brightness}</span>
                </button>

                <button 
                  className={styles.hudBtn} 
                  onClick={cycleZoom}
                  title="Page Zoom"
                >
                  <ZoomIn size={18} />
                  <span className={styles.btnSubtext}>{zoomLevel.split('-')[1] || zoomLevel}</span>
                </button>
              </div>

              {/* Slider center navigation */}
              <div className={styles.footerCenter} onClick={(e) => e.stopPropagation()}>
                <button 
                  className={styles.chapterNavBtn}
                  disabled={chapterIndex <= 0}
                  onClick={handlePrevChapter}
                >
                  Prev Ch
                </button>

                {readingMode === 'horizontal' && (
                  <div className={styles.sliderControl}>
                    <span>Pg {pageNum}</span>
                    <input 
                      type="range"
                      min="1"
                      max={chapterPages.length}
                      value={pageNum}
                      onChange={(e) => handlePageChange(parseInt(e.target.value))}
                    />
                    <span>{chapterPages.length}</span>
                  </div>
                )}
                
                {readingMode === 'vertical' && (
                  <span className={styles.verticalPageCount}>Vertical Scroll Mode ({chapterPages.length} Pages)</span>
                )}

                <button 
                  className={styles.chapterNavBtn}
                  disabled={chapterIndex >= bookChapters.length - 1}
                  onClick={handleNextChapter}
                >
                  Next Ch
                </button>
              </div>

              {/* View options right buttons */}
              <div className={styles.footerRight}>
                <button 
                  className={styles.hudBtn} 
                  onClick={() => setReadingMode(readingMode === 'vertical' ? 'horizontal' : 'vertical')}
                  title="Cycle Reading Mode"
                >
                  <Layout size={18} />
                  <span className={styles.btnSubtext}>{readingMode}</span>
                </button>

                <button className={styles.hudBtn} onClick={toggleFullscreen} title="Fullscreen mode">
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      <RechargeModal isOpen={rechargeOpen} onClose={() => setRechargeOpen(false)} />
    </div>
  );
};
