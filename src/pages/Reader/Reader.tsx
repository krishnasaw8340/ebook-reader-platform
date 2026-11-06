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
  Layout,
  FileText,
  UploadCloud,
  CheckCircle2,
  Layers,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { RechargeModal } from '../../components/common/RechargeModal';
import { getChapterPdfUrl, storeChapterPdf } from '../../utils/pdfStorage';
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
  const [readingMode, setReadingMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [brightness, setBrightness] = useState<'normal' | 'oled' | 'dim' | 'sepia'>('normal');
  const [zoomLevel, setZoomLevel] = useState<'fit-width' | 'fit-screen' | 'large'>('fit-width');
  const [showHUD, setShowHUD] = useState(true);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [coinFloat, setCoinFloat] = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);

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
  const chapterPdfPageCount = chapter ? (chapter.pdfPageCount ?? chapter.pdf_page_count ?? 0) : 0;
  const [totalPdfPages, setTotalPdfPages] = useState(chapterPdfPageCount);
  const pdfFileName = chapter ? (chapter.pdfFileName ?? chapter.pdf_file_name ?? '') : '';

  const isSeriesBookmarked = series 
    ? books.filter(b => b.series_id === series.id || (b as any).seriesId === series.id).some(b => userLibrary.some(lib => lib.book_id === b.id))
    : false;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState(false);
  const [attachingPdf, setAttachingPdf] = useState(false);
  const readerPdfInputRef = useRef<HTMLInputElement>(null);

  // Prefer a locally attached PDF, then request the original PDF from storage.
  useEffect(() => {
    let cancelled = false;
    const loadPdf = async () => {
      setPdfUrl(null);
      setPdfLoadError(false);
      setTotalPdfPages(chapterPdfPageCount);
      if (!chapter) return;

      try {
        const storedUrl = await getChapterPdfUrl(chapter.id);
        if (cancelled) return;
        if (storedUrl) {
          setPdfUrl(storedUrl);
          return;
        }

        if (chapter.pdfStorageKey || chapter.pdf_storage_key) {
          const access = await chapterService.getPdfAccess(chapter.id);
          if (cancelled) return;
          setPdfUrl(access.pdfUrl);
          setTotalPdfPages(access.pageCount ?? chapterPdfPageCount);
        }
      } catch (error) {
        console.error('[Reader] Failed to load original chapter PDF:', error);
        if (!cancelled) setPdfLoadError(true);
      }
    };
    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [chapter, chapterPdfPageCount]);

  useEffect(() => {
    if (!pdfUrl?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const handleReaderPdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chapter) return;
    setAttachingPdf(true);
    try {
      await storeChapterPdf(chapter.id, file, file.name);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setPdfLoadError(false);
      setTotalPdfPages(chapterPdfPageCount);
    } catch (err) {
      console.warn('Failed to save chapter PDF:', err);
    } finally {
      setAttachingPdf(false);
      if (readerPdfInputRef.current) readerPdfInputRef.current.value = '';
    }
  };

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
    if (nextPageNo < 1 || nextPageNo > totalPdfPages) return;
    setPageNum(nextPageNo);
    const progressPercent = Math.round((nextPageNo / totalPdfPages) * 100);
    saveProgress(book.id, chapter.id, progressPercent, nextPageNo, 0);
    
    if (readingMode === 'horizontal') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

              <input
                type="file"
                ref={readerPdfInputRef}
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleReaderPdfSelect}
              />
              <div 
                className={styles.metaBadge} 
                onClick={() => readerPdfInputRef.current?.click()}
                title="Click to attach or replace chapter PDF file"
              >
                {pdfUrl ? <CheckCircle2 size={13} style={{ color: '#10b981' }} /> : <UploadCloud size={13} />}
                <span>{attachingPdf ? 'Attaching PDF...' : pdfUrl ? `${pdfFileName || 'PDF'} (Attached)` : 'Attach PDF'}</span>
              </div>

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
            {pdfUrl ? (
              // Embedded native PDF viewer for the real uploaded PDF
              <div 
                className={styles.pdfIframeWrapper}
                onClick={(e) => e.stopPropagation()}
              >
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  title={chapter.title}
                  className={styles.pdfIframe}
                />
              </div>
            ) : (
              <div className={styles.contentUnavailable} onClick={(e) => e.stopPropagation()}>
                <FileText size={32} />
                <h3>{pdfLoadError ? 'PDF unavailable' : 'NA'}</h3>
                <p>{pdfLoadError ? 'Could not load the original chapter PDF. Reload the chapter or attach the original file.' : 'Original chapter PDF is not available.'}</p>
                <button className={styles.btnNextChapterBig} onClick={() => readerPdfInputRef.current?.click()}>
                  <UploadCloud size={15} /> Attach Original PDF
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating HUD Footer Navigation Bar */}
      <AnimatePresence>
        {showHUD && !isLocked && totalPdfPages > 0 && (
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

                {readingMode === 'horizontal' ? (
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
                ) : (
                  <span className={styles.verticalPageCount} onClick={() => setShowChapterDrawer(true)}>
                    Ch. {chapter.chapter_no ?? chapter.chapterNumber} • {totalPdfPages} Pages
                  </span>
                )}

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
                <button 
                  className={styles.hudBtn} 
                  onClick={() => setReadingMode(readingMode === 'vertical' ? 'horizontal' : 'vertical')}
                  title="Toggle Webtoon Vertical Strip / Single Page Flip"
                >
                  <Layout size={17} />
                  <span className={styles.btnSubtext}>{readingMode}</span>
                </button>

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
