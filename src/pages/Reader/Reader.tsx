import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Coins,
  Bookmark,
  Sun,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Lock,
  Compass,
  Layout,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { RechargeModal } from '../../components/common/RechargeModal';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import styles from './Reader.module.css';

export const Reader: React.FC = () => {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { 
    books, 
    bookSeries, 
    chapters, 
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
  const bookChapters = chapters.filter(c => (c.bookId === bookId || c.book_id === bookId)).sort((a,b) => (a.chapterNumber ?? a.chapter_no) - (b.chapterNumber ?? b.chapter_no));
  const chapterIndex = bookChapters.findIndex(c => c.id === chapterId);

  const isLocked = chapter ? !isChapterUnlocked(chapter.id) : true;
  const totalPdfPages = chapter ? (chapter.pdfPageCount ?? chapter.pdf_page_count ?? 24) : 24;
  const pdfFileName = chapter ? (chapter.pdfFileName ?? chapter.pdf_file_name ?? 'chapter.pdf') : 'chapter.pdf';

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
    if (book && chapter) {
      const prog = readingProgress.find(p => p.book_id === book.id && p.chapter_id === chapter.id);
      if (prog && prog.last_pdf_page) {
        setPageNum(Math.min(prog.last_pdf_page, totalPdfPages));
      } else {
        setPageNum(1);
      }
    }
  }, [bookId, chapterId, totalPdfPages]);

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
      saveProgress(book.id, chapter.id, 0, 1, 0);
    } else {
      setRechargeOpen(true);
    }
  };

  const handlePageChange = (nextPageNo: number) => {
    if (nextPageNo < 1 || nextPageNo > totalPdfPages) return;
    setPageNum(nextPageNo);
    const progressPercent = Math.round((nextPageNo / totalPdfPages) * 100);
    saveProgress(book.id, chapter.id, progressPercent, nextPageNo, 0);
    
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

  // Generate continuous page slices for Chapter PDF
  const pdfPagesList = Array.from({ length: totalPdfPages }, (_, i) => i + 1);

  return (
    <div className={`${styles.readerWrapper} ${styles[brightness]}`}>
      {/* HUD Header Drawer */}
      <AnimatePresence>
        {showHUD && (
          <motion.header 
            className={styles.hudHeader}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
          >
            <div className={styles.headerLeft}>
              <button 
                className={styles.backBtn}
                onClick={() => navigate(`/book/${book.id}`)}
                title="Back to Book Overview"
              >
                <ArrowLeft size={20} />
              </button>

              <div className={styles.titleStack}>
                <Breadcrumbs 
                  items={[
                    { label: series.title, path: `/book/${book.id}` },
                    { label: book.title, path: `/book/${book.id}` },
                    { label: `Ch. ${chapter.chapterNumber ?? chapter.chapter_no}` }
                  ]} 
                />
                <h2 className={styles.chapterTitle}>{chapter.title}</h2>
              </div>
            </div>

            <div className={styles.headerRight}>
              <div className={styles.metaBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#38bdf8' }}>
                <FileText size={13} /> {pdfFileName}
              </div>

              {/* Bookmark Toggle */}
              <button 
                className={`${styles.hudBtn} ${isSeriesBookmarked ? styles.activeBookmark : ''}`}
                onClick={() => toggleBookmark(book.id)}
                title="Bookmark Series"
              >
                <Bookmark size={18} fill={isSeriesBookmarked ? 'currentColor' : 'none'} />
              </button>

              {/* Wallet quick indicator */}
              <div className={styles.walletBadge} onClick={() => setRechargeOpen(true)}>
                <Coins size={14} className={styles.coinIcon} />
                <span>{wallet?.balance || 0}</span>
              </div>
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
            <span>-{chapter.coinCost ?? chapter.coin_cost} Coins</span>
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
              className={styles.lockCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className={styles.lockIcon}><Lock size={32} /></div>
              <h3>Unlock Premium Chapter</h3>
              <p>
                This chapter requires <strong>{chapter.coinCost ?? chapter.coin_cost} Coins</strong> to unlock.
                You will have permanent access to the complete chapter PDF.
              </p>
              
              <button className={styles.btnUnlock} onClick={handleUnlock}>
                Unlock Chapter ({chapter.coinCost ?? chapter.coin_cost} Coins)
              </button>
              
              <div className={styles.lockWallet}>
                Your wallet balance: <span className={styles.lockWalletVal}><Coins size={12} /> {wallet?.balance || 0} Coins</span>
              </div>
            </motion.div>
          </div>
        ) : (
          // Render Chapter PDF Continuous Viewport
          <div className={styles.pagesContainer}>
            {readingMode === 'vertical' ? (
              // Continuous vertical scrollable reader
              pdfPagesList.map((pgNumber) => (
                <div key={pgNumber} className={styles.pageItem}>
                  <div className={styles.pageLoader}><Compass className={styles.spin} /> PDF Page {pgNumber} loading...</div>
                  <img 
                    src={book.cover_image || `https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=800`}
                    alt={`PDF Page ${pgNumber}`} 
                    onLoad={(e) => e.currentTarget.parentElement?.classList.add(styles.loaded)}
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/600x900/121212/ffffff?text=${encodeURIComponent(chapter.title)}+Page+${pgNumber}`;
                      e.currentTarget.parentElement?.classList.add(styles.loaded);
                    }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '6px' }}>
                    {pdfFileName} • Page {pgNumber} of {totalPdfPages}
                  </div>
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
                    src={book.cover_image || `https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=800`}
                    alt={`PDF Page ${pageNum}`} 
                  />
                  <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '6px' }}>
                    {pdfFileName} • Page {pageNum} of {totalPdfPages}
                  </div>
                </div>

                <ChevronRight 
                  className={`${styles.navChevron} ${pageNum >= totalPdfPages ? styles.disabledChevron : ''}`}
                  onClick={() => handlePageChange(pageNum + 1)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* HUD Footer Slider Drawer */}
      <AnimatePresence>
        {showHUD && !isLocked && totalPdfPages > 0 && (
          <motion.footer 
            className={styles.hudFooter}
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
                const targetPage = Math.round(percent * (totalPdfPages - 1)) + 1;
                handlePageChange(targetPage);
              }}
            >
              <div 
                className={styles.progressFill} 
                style={{ width: `${((pageNum - 1) / Math.max(1, totalPdfPages - 1)) * 100}%` }}
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
                      max={totalPdfPages}
                      value={pageNum}
                      onChange={(e) => handlePageChange(parseInt(e.target.value))}
                    />
                    <span>{totalPdfPages}</span>
                  </div>
                )}
                
                {readingMode === 'vertical' && (
                  <span className={styles.verticalPageCount}>Vertical PDF Scroll Mode ({totalPdfPages} Pages)</span>
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
