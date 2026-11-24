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
  Layers,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { RechargeModal } from '../../components/common/RechargeModal';
import { chapterService } from '../../services/chapterService';
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
  const [brightness, setBrightness] = useState<'normal' | 'oled' | 'dim' | 'sepia'>('normal');
  const [zoomLevel, setZoomLevel] = useState<'fit-width' | 'fit-screen' | 'large'>('fit-width');
  const [showHUD, setShowHUD] = useState(true);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [coinFloat, setCoinFloat] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const pageElements = useRef<Map<number, HTMLImageElement>>(new Map());

  const book = books.find(b => b.id === bookId);
  const series = book ? bookSeries.find(s => s.id === book.series_id || s.id === (book as any).seriesId) : null;
  const chapter = chapters.find(c => c.id === chapterId);
  const bookChapters = chapters
    .filter(c => (c.bookId === bookId || c.book_id === bookId))
    .sort((a,b) => (a.chapterNumber ?? a.chapter_no ?? 0) - (b.chapterNumber ?? b.chapter_no ?? 0));
  
  const chapterIndex = bookChapters.findIndex(c => c.id === chapterId);
  const nextChapter = chapterIndex >= 0 && chapterIndex < bookChapters.length - 1 ? bookChapters[chapterIndex + 1] : null;
  const prevChapter = chapterIndex > 0 ? bookChapters[chapterIndex - 1] : null;

  const isLocked = chapter ? !isChapterUnlocked(chapter.id) : true;
  const chapterPageCount = chapter ? (chapter.pageCount ?? chapter.pages?.length ?? 0) : 0;

  const isSeriesBookmarked = series 
    ? books.filter(b => b.series_id === series.id || (b as any).seriesId === series.id).some(b => userLibrary.some(lib => lib.book_id === b.id))
    : false;

  const [chapterPages, setChapterPages] = useState<Array<{ pageNumber: number; imageUrl: string; width?: number; height?: number }>>([]);
  const [pagesLoadError, setPagesLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let hasLoadedPages = false;
    let refreshTimer: number | undefined;
    setChapterPages([]);
    setPagesLoadError(false);
    if (!chapter || isLocked || chapterPageCount === 0) {
      return () => { cancelled = true; };
    }

    const loadPages = async () => {
      try {
        const access = await chapterService.getPageAccess(chapter.id);
        if (cancelled) return;
        const pages = access.pages ?? [];
        setChapterPages(pages.sort((a, b) => a.pageNumber - b.pageNumber));
        if (pages.length === 0) setPagesLoadError(true);
        else {
          setPagesLoadError(false);
          hasLoadedPages = true;
          const refreshInSeconds = Math.max((access.expiresIn ?? 600) - 60, 60);
          refreshTimer = window.setTimeout(() => void loadPages(), refreshInSeconds * 1000);
        }
      } catch (error) {
        console.error('[Reader] Failed to load chapter pages:', error);
        if (!cancelled) {
          setPagesLoadError(true);
          if (hasLoadedPages) {
            refreshTimer = window.setTimeout(() => void loadPages(), 30_000);
          }
        }
      }
    };
    void loadPages();
    return () => {
      cancelled = true;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
    };
  }, [chapter?.id, chapterPageCount, isLocked]);

  // Load progress if exists
  useEffect(() => {
    if (book && chapter) {
      const prog = readingProgress.find(p => p.book_id === book.id && p.chapter_id === chapter.id);
      if (prog && prog.last_pdf_page) {
        setPageNum(Math.max(1, Math.min(prog.last_pdf_page, chapterPages.length || chapterPageCount)));
      } else {
        setPageNum(1);
      }
    }
  }, [bookId, chapterId, chapterPages.length, chapterPageCount]);

  useEffect(() => {
    const viewport = workspaceRef.current;
    if (!viewport || chapterPages.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      const viewportCenter = viewport.getBoundingClientRect().top + viewport.clientHeight * 0.45;
      const visiblePages = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const aDistance = Math.abs(a.boundingClientRect.top - viewportCenter);
          const bDistance = Math.abs(b.boundingClientRect.top - viewportCenter);
          return aDistance - bDistance;
        });
      const visiblePage = visiblePages[0]?.target as HTMLImageElement | undefined;
      const nextPage = visiblePage ? Number(visiblePage.dataset.pageNumber) : 0;
      if (nextPage > 0) setPageNum(nextPage);
    }, { root: viewport, rootMargin: '-15% 0px -55% 0px', threshold: 0 });

    chapterPages.forEach((page) => {
      const image = pageElements.current.get(page.pageNumber);
      if (image) observer.observe(image);
    });
    return () => observer.disconnect();
  }, [chapterPages]);

  useEffect(() => {
    if (!book || !chapter || isLocked || chapterPages.length === 0) return;
    const progressPercent = Math.round((pageNum / chapterPages.length) * 100);
    saveProgress(book.id, chapter.id, progressPercent, pageNum, 0);
  }, [pageNum, chapterPages.length, book?.id, chapter?.id, isLocked]);

  if (!book || !chapter || !series) {
    return (
      <div className={styles.notFound}>
        <h3>Chapter or Book Not Found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  const handleUnlock = async () => {
    const outcome = await unlockChapter(chapter.id);
    if (outcome === 'unlocked') {
      setCoinFloat(true);
      setTimeout(() => setCoinFloat(false), 1200);
      saveProgress(book.id, chapter.id, 0, 1, 0);
    } else if (outcome === 'insufficient') {
      setRechargeOpen(true);
    }
  };

  const handlePageChange = (nextPageNo: number) => {
    if (nextPageNo < 1 || nextPageNo > chapterPages.length) return;
    setPageNum(nextPageNo);
    pageElements.current.get(nextPageNo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNextChapter = () => {
    if (nextChapter) {
      navigate(`/reader/${book.id}/${nextChapter.id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevChapter = () => {
    if (prevChapter) {
      navigate(`/reader/${book.id}/${prevChapter.id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (brightness === 'normal') setBrightness('oled');
    else if (brightness === 'oled') setBrightness('dim');
    else if (brightness === 'dim') setBrightness('sepia');
    else setBrightness('normal');
  };

  const cycleZoom = () => {
    if (zoomLevel === 'fit-width') setZoomLevel('fit-screen');
    else if (zoomLevel === 'fit-screen') setZoomLevel('large');
    else setZoomLevel('fit-width');
  };

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
                onClick={() => navigate(`/book/${series.id}`)}
                title="Back to Series Overview"
              >
                <ArrowLeft size={20} />
              </button>

              <div className={styles.titleStack}>
                <div className={styles.seriesBreadcrumb} onClick={() => navigate(`/book/${series.id}`)}>
                  {series.title}
                </div>
                <h2 className={styles.chapterTitle}>
                  Ch. {chapter.chapter_no ?? chapter.chapterNumber}: {chapter.title}
                </h2>
              </div>
            </div>

            <div className={styles.headerRight}>
              {/* Chapter Selector Trigger */}
              <button 
                className={styles.chaptersDrawerBtn}
                onClick={() => setShowChapterDrawer(true)}
                title="All chapters list"
              >
                <Layers size={15} />
                <span>Chapters ({bookChapters.length})</span>
              </button>

              {/* Bookmark Toggle */}
              <button 
                className={`${styles.hudBtn} ${isSeriesBookmarked ? styles.activeBookmark : ''}`}
                onClick={() => toggleBookmark(series.id)}
                title={isSeriesBookmarked ? 'Bookmarked' : 'Bookmark Series'}
              >
                <Bookmark size={17} fill={isSeriesBookmarked ? 'currentColor' : 'none'} />
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

      {/* Reader Main Viewport */}
      <main 
        className={`${styles.viewport} ${styles[zoomLevel]} ${styles.vertical}`}
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
              <div className={styles.lockIcon}><Lock size={36} /></div>
              <h3>Unlock Premium Chapter</h3>
              <p>
                Chapter {chapter.chapter_no ?? chapter.chapterNumber} requires <strong>{chapter.coinCost ?? chapter.coin_cost} Coins</strong> to unlock.
                You will have permanent access to all pages of this chapter.
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
          // Render Chapter Content
          <div className={styles.pagesContainer}>
            {chapterPages.length > 0 ? (
              <div className={styles.verticalStripWrapper} onClick={(e) => e.stopPropagation()}>
                {chapterPages.map((page) => (
                  <img
                    key={page.pageNumber}
                    ref={(element) => {
                      if (element) pageElements.current.set(page.pageNumber, element);
                      else pageElements.current.delete(page.pageNumber);
                    }}
                    data-page-number={page.pageNumber}
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    loading="lazy"
                    decoding="async"
                    className={styles.chapterPageImage}
                    style={page.width && page.height ? { aspectRatio: `${page.width} / ${page.height}` } : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.contentUnavailable} onClick={(e) => e.stopPropagation()}>
                <h3>{pagesLoadError ? 'Chapter pages unavailable' : 'No pages available (N/A)'}</h3>
                {pagesLoadError && <p>Could not load the chapter pages. Please try again later.</p>}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating HUD Footer Navigation Bar */}
      <AnimatePresence>
        {showHUD && !isLocked && chapterPages.length > 0 && (
          <motion.footer 
            className={styles.hudFooter}
            initial={{ y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 70, opacity: 0 }}
          >
            {/* Progress Track */}
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
                style={{ width: `${((pageNum - 1) / Math.max(1, chapterPages.length - 1)) * 100}%` }}
              />
            </div>

            <div className={styles.footerRow}>
              {/* Left Theme & Zoom */}
              <div className={styles.footerLeft}>
                <button 
                  className={styles.hudBtn} 
                  onClick={cycleBrightness}
                  title="Cycle Reading Theme (Dark / OLED / Dim / Sepia)"
                >
                  <Sun size={17} />
                  <span className={styles.btnSubtext}>{brightness.toUpperCase()}</span>
                </button>

                <button 
                  className={styles.hudBtn} 
                  onClick={cycleZoom}
                  title="Page Zoom Fit"
                >
                  <ZoomIn size={17} />
                  <span className={styles.btnSubtext}>{zoomLevel.replace('fit-', '')}</span>
                </button>
              </div>

              {/* Center Chapter Navigation */}
              <div className={styles.footerCenter} onClick={(e) => e.stopPropagation()}>
                <button 
                  className={styles.chapterNavBtn}
                  disabled={!prevChapter}
                  onClick={handlePrevChapter}
                >
                  <ChevronLeft size={14} /> Prev Ch
                </button>

                <span className={styles.verticalPageCount} onClick={() => setShowChapterDrawer(true)}>
                  Pg. {pageNum} / {chapterPages.length}
                </span>

                <button 
                  className={styles.chapterNavBtn}
                  disabled={!nextChapter}
                  onClick={handleNextChapter}
                >
                  Next Ch <ChevronRight size={14} />
                </button>
              </div>

              {/* Right Reading Mode & Fullscreen */}
              <div className={styles.footerRight}>
                <button className={styles.hudBtn} onClick={toggleFullscreen} title="Fullscreen mode">
                  <Maximize2 size={17} />
                </button>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Chapters Quick Drawer Modal */}
      <AnimatePresence>
        {showChapterDrawer && (
          <div className={styles.drawerBackdrop} onClick={() => setShowChapterDrawer(false)}>
            <motion.div 
              className={styles.chapterDrawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <div>
                  <h3>Chapter List</h3>
                  <p>{series.title} ({bookChapters.length} Total)</p>
                </div>
                <button className={styles.drawerCloseBtn} onClick={() => setShowChapterDrawer(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className={styles.drawerChapterList}>
                {bookChapters.map((ch) => {
                  const isCurrent = ch.id === chapter.id;
                  const unlocked = isChapterUnlocked(ch.id);

                  return (
                    <div 
                      key={ch.id} 
                      className={`${styles.drawerChapterItem} ${isCurrent ? styles.drawerActiveChapter : ''}`}
                      onClick={() => {
                        setShowChapterDrawer(false);
                        navigate(`/reader/${book.id}/${ch.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <div className={styles.drawerChapterLeft}>
                        <span className={styles.drawerChNum}>Ch. {ch.chapter_no ?? ch.chapterNumber}</span>
                        <span className={styles.drawerChTitle}>{ch.title}</span>
                      </div>

                      <div className={styles.drawerChapterRight}>
                        {ch.coin_cost > 0 ? (
                          unlocked ? (
                            <span className={styles.drawerUnlockedTag}>Unlocked</span>
                          ) : (
                            <span className={styles.drawerLockedTag}><Coins size={10} /> {ch.coin_cost}</span>
                          )
                        ) : (
                          <span className={styles.drawerFreeTag}>Free</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RechargeModal isOpen={rechargeOpen} onClose={() => setRechargeOpen(false)} />
    </div>
  );
};
