import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Trash2,
    MoveLeft,
    MoveRight,
    Eye,
    RefreshCw,
    Save,
    GripVertical,
    Layers,
    ArrowUpToLine,
    ArrowDownToLine,
    ListOrdered,
    AlertTriangle,
    CloudOff,
    BookOpen,
    FileImage
} from 'lucide-react';
import {
    adminChapterService,
    adminPageService,
    adminBookService
} from '../../services/admin/adminServices';
import type { Chapter, Page, Book } from '../../types';
import {
    PageHeader,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner,
    Modal,
    ConfirmDialog
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

// ─── Deferred Upload Notice Banner ────────────────────────────────────────────
const DeferredUploadBanner: React.FC = () => (
    <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.04) 100%)',
        border: '1px solid rgba(251,191,36,0.25)',
        borderRadius: 'var(--border-radius)',
        marginBottom: '20px'
    }}>
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <CloudOff size={20} color="#fbbf24" />
        </div>
        <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#fbbf24', marginBottom: '4px' }}>
                S3 / R2 Direct Upload — Scheduled for Next Phase
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Direct manga scan uploads to cloud object storage (AWS S3 / Cloudflare R2) via presigned URLs
                are being implemented in the <strong style={{ color: 'var(--color-text-primary)' }}>next development phase</strong>.
                Page reordering, metadata management, and sequence locking are fully functional now.
                Use the <strong style={{ color: 'var(--color-text-primary)' }}>Batch Ingest</strong> upload system for complete
                chapter packages in the meantime.
            </div>
        </div>
    </div>
);

export const AdminPages: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialChapterId = searchParams.get('chapterId') || '';

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedChapterId, setSelectedChapterId] = useState<string>(initialChapterId);
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingOrder, setSavingOrder] = useState(false);

    // Feedback
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Drag-and-drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Preview modal
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Position mover modal for mobile
    const [movePageTarget, setMovePageTarget] = useState<Page | null>(null);
    const [targetPosition, setTargetPosition] = useState<number>(1);

    // Delete dialog
    const [deletePageTarget, setDeletePageTarget] = useState<Page | null>(null);

    // Load chapters & books
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const [cList, bList] = await Promise.all([
                    adminChapterService.getAll(),
                    adminBookService.getAll()
                ]);
                setChapters(cList);
                setBooks(bList);
                if (!selectedChapterId && cList.length > 0) {
                    setSelectedChapterId(cList[0].id);
                }
            } catch (err: any) {
                const msg = err.response?.data?.message || err.message || 'Unable to load chapters.';
                setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
            }
        };
        fetchInitial();
    }, []);

    // Load pages for selected chapter
    const loadPages = async (chapId: string) => {
        if (!chapId) return;
        setLoading(true);
        try {
            const data = await adminPageService.getByChapter(chapId);
            setPages(data);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Unable to load chapter pages.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedChapterId) {
            loadPages(selectedChapterId);
        } else {
            setLoading(false);
        }
    }, [selectedChapterId]);

    // Reordering: Move Left / Move Right
    const movePage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pages.length) return;
        const copy = [...pages];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        const reordered = copy.map((p, idx) => ({ ...p, page_no: idx + 1, pageNumber: idx + 1 }));
        setPages(reordered);
    };

    // Move to specific position (ideal for mobile)
    const handleMoveToPosition = () => {
        if (!movePageTarget) return;
        const currentIndex = pages.findIndex(p => p.id === movePageTarget.id);
        if (currentIndex === -1) return;

        const newIndex = Math.max(0, Math.min(pages.length - 1, targetPosition - 1));
        const copy = [...pages];
        const [moved] = copy.splice(currentIndex, 1);
        copy.splice(newIndex, 0, moved);
        const reordered = copy.map((p, idx) => ({ ...p, page_no: idx + 1, pageNumber: idx + 1 }));
        setPages(reordered);
        setMovePageTarget(null);
        setSuccessMessage(`Page moved to position ${newIndex + 1}.`);
    };

    // Drag-and-drop Handlers (Desktop)
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const copy = [...pages];
        const draggedItem = copy[draggedIndex];
        copy.splice(draggedIndex, 1);
        copy.splice(index, 0, draggedItem);
        const reordered = copy.map((p, idx) => ({ ...p, page_no: idx + 1, pageNumber: idx + 1 }));
        setDraggedIndex(index);
        setPages(reordered);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Commit reordered sequence to backend
    const saveDeterministicOrder = async () => {
        if (!selectedChapterId) return;
        setSavingOrder(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const pageIds = pages.map((p) => p.id);
            await adminPageService.reorder(selectedChapterId, pageIds);
            setSuccessMessage('Page sequence successfully saved and locked to DRM catalog.');
            loadPages(selectedChapterId);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to save page ordering.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setSavingOrder(false);
        }
    };

    // Delete single page
    const handleDeletePage = async () => {
        if (!deletePageTarget) return;
        try {
            await adminPageService.delete(deletePageTarget.id);
            setSuccessMessage(`Page ${deletePageTarget.page_no} deleted and sequence reindexed.`);
            setDeletePageTarget(null);
            loadPages(selectedChapterId);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to delete page.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const currentChapter = chapters.find((c) => c.id === selectedChapterId);
    const currentBook = currentChapter ? books.find(b => b.id === (currentChapter.bookId || currentChapter.book_id)) : null;

    const pricingLabel = () => {
        const model = currentChapter?.pricingModel || currentChapter?.pricing_model || currentChapter?.access_type || 'FREE';
        if (model === 'PAID') return `PAID (${currentChapter?.coinCost ?? currentChapter?.coin_cost ?? 0} Coins)`;
        if (model === 'PARTIAL_FREE' || model === 'PARTIAL') return `PARTIAL (${currentChapter?.freePageCount ?? currentChapter?.free_pages ?? 0} free pgs)`;
        return 'FREE';
    };

    const pricingColor = () => {
        const model = currentChapter?.pricingModel || currentChapter?.pricing_model || currentChapter?.access_type || 'FREE';
        if (model === 'PAID') return '#ffd700';
        if (model === 'PARTIAL_FREE' || model === 'PARTIAL') return '#38bdf8';
        return '#2ecc71';
    };

    return (
        <div>
            <PageHeader
                title="Manga Page Management & DRM Compiler"
                subtitle="View and reorder chapter page scans, manage deterministic DRM sequences, and lock page ordering."
                breadcrumbs={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    { label: 'Books', path: '/admin/books' },
                    ...(currentBook ? [{ label: currentBook.title, path: `/admin/books/${currentBook.id}` }] : []),
                    { label: 'Chapters', path: currentBook ? `/admin/chapters?bookId=${currentBook.id}` : '/admin/chapters' },
                    { label: 'Pages' }
                ]}
                actions={
                    <button
                        className={styles.btnPrimary}
                        onClick={saveDeterministicOrder}
                        disabled={pages.length === 0 || savingOrder}
                        style={{ minWidth: '160px' }}
                    >
                        <Save size={16} /> {savingOrder ? 'Saving...' : 'Lock Page Order'}
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Deferred Upload Notice */}
            <DeferredUploadBanner />

            {/* Chapter Selection Bar */}
            <div className={styles.filterBar} style={{
                background: 'var(--card)',
                padding: '16px',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--glass-border)',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
                        <Layers size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '13px' }}>Target Chapter:</span>
                    </div>

                    <select
                        className={styles.selectInput}
                        style={{ minWidth: '240px', flex: 1 }}
                        value={selectedChapterId}
                        onChange={(e) => setSelectedChapterId(e.target.value)}
                    >
                        {chapters.map((ch) => {
                            const b = books.find((book) => book.id === (ch.bookId || ch.book_id));
                            return (
                                <option key={ch.id} value={ch.id}>
                                    {b ? `[${b.title}] ` : ''}Ch. {ch.chapterNumber ?? ch.chapter_no}: {ch.title}
                                </option>
                            );
                        })}
                    </select>

                    {currentChapter && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Total Pages: <strong style={{ color: 'var(--color-text-primary)' }}>{pages.length}</strong>
                            </span>
                            <span style={{ fontSize: '12px', color: pricingColor(), fontWeight: 700 }}>
                                {pricingLabel()}
                            </span>
                            {currentBook && (
                                <button
                                    className={styles.btnSecondary}
                                    style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => navigate(`/admin/chapters?bookId=${currentBook.id}`)}
                                >
                                    <BookOpen size={11} /> View All Chapters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Pages Grid with Deterministic Ordering */}
            <div>
                {loading ? (
                    <LoadingState message="Loading manga pages..." />
                ) : !selectedChapterId ? (
                    <div className={styles.tableCard}>
                        <EmptyState
                            title="No chapter selected"
                            description="Select a chapter above to view and manage its pages."
                        />
                    </div>
                ) : pages.length === 0 ? (
                    <div className={styles.tableCard}>
                        <EmptyState
                            title="No pages uploaded for this chapter"
                            description="Pages will appear here once they are uploaded via the Batch Ingest system. Direct S3/R2 upload is coming in the next phase."
                            action={
                                <button
                                    className={styles.btnSecondary}
                                    onClick={() => navigate('/admin/uploads')}
                                >
                                    <FileImage size={14} /> Go to Batch Ingest
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                💡 Use arrow buttons or drag cards to reorder. Click <strong>"Lock Page Order"</strong> when done.
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: '12px'
                        }}>
                            {pages.map((page, idx) => (
                                <div
                                    key={page.id}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        background: 'var(--card)',
                                        border: draggedIndex === idx ? '2px dashed var(--primary)' : '1px solid var(--glass-border)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        padding: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        position: 'relative',
                                        cursor: 'grab',
                                        transition: 'transform var(--transition-fast), border-color var(--transition-fast)'
                                    }}
                                >
                                    {/* Page Number & Drag Handle */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            background: 'var(--primary)',
                                            color: '#ffffff',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            letterSpacing: '0.5px'
                                        }}>
                                            PAGE {page.page_no ?? page.pageNumber}
                                        </span>
                                        <div style={{ color: 'var(--text-muted)' }}>
                                            <GripVertical size={14} />
                                        </div>
                                    </div>

                                    {/* Page Image Preview */}
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '190px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            background: '#0e0e11',
                                            border: '1px solid rgba(255,255,255,0.06)'
                                        }}
                                        onClick={() => setPreviewUrl(page.image_url || page.imageUrl || null)}
                                    >
                                        {(page.image_url || page.imageUrl) ? (
                                            <img
                                                src={page.image_url || page.imageUrl}
                                                alt={`Page ${page.page_no}`}
                                                loading="lazy"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <AlertTriangle size={24} color="var(--text-muted)" />
                                            </div>
                                        )}

                                        <div style={{ position: 'absolute', top: 6, right: 6 }}>
                                            <button
                                                className={styles.btnIcon}
                                                style={{ width: '28px', height: '28px', background: 'rgba(0,0,0,0.7)', color: '#ffffff' }}
                                                title="Full Preview"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewUrl(page.image_url || page.imageUrl || null);
                                                }}
                                            >
                                                <Eye size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Touch Reorder & Action Controls */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            <button
                                                className={styles.btnIcon}
                                                style={{ width: '32px', height: '32px' }}
                                                disabled={idx === 0}
                                                title="Move Left"
                                                onClick={() => movePage(idx, idx - 1)}
                                            >
                                                <MoveLeft size={13} />
                                            </button>
                                            <button
                                                className={styles.btnIcon}
                                                style={{ width: '32px', height: '32px' }}
                                                disabled={idx === pages.length - 1}
                                                title="Move Right"
                                                onClick={() => movePage(idx, idx + 1)}
                                            >
                                                <MoveRight size={13} />
                                            </button>
                                            <button
                                                className={styles.btnIcon}
                                                style={{ width: '32px', height: '32px' }}
                                                title="Jump to Position"
                                                onClick={() => {
                                                    setMovePageTarget(page);
                                                    setTargetPosition(page.page_no ?? page.pageNumber ?? idx + 1);
                                                }}
                                            >
                                                <ListOrdered size={13} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            <button
                                                className={styles.btnIcon}
                                                style={{ width: '32px', height: '32px', color: '#ef4444' }}
                                                title="Delete Page"
                                                onClick={() => setDeletePageTarget(page)}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Touch Position Jump Modal (Mobile-friendly) */}
            <Modal
                isOpen={!!movePageTarget}
                onClose={() => setMovePageTarget(null)}
                title={`Move Page ${movePageTarget?.page_no ?? movePageTarget?.pageNumber} to Position`}
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setMovePageTarget(null)}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handleMoveToPosition}>
                            Move Page
                        </button>
                    </>
                }
            >
                {movePageTarget && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Choose target position number between 1 and {pages.length}:
                        </p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                                type="number"
                                min={1}
                                max={pages.length}
                                value={targetPosition}
                                onChange={(e) => setTargetPosition(parseInt(e.target.value) || 1)}
                                className={styles.formInput}
                                style={{ width: '120px', textAlign: 'center', fontSize: '18px', fontWeight: 800 }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    className={styles.btnSecondary}
                                    onClick={() => setTargetPosition(1)}
                                >
                                    <ArrowUpToLine size={14} /> To First
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnSecondary}
                                    onClick={() => setTargetPosition(pages.length)}
                                >
                                    <ArrowDownToLine size={14} /> To Last
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Fullscreen Image Preview Modal */}
            <Modal
                isOpen={!!previewUrl}
                onClose={() => setPreviewUrl(null)}
                title="Manga Page High-Res Preview"
                maxWidth="720px"
                footer={
                    <button className={styles.btnSecondary} onClick={() => setPreviewUrl(null)}>
                        Close Preview
                    </button>
                }
            >
                {previewUrl && (
                    <div style={{ textAlign: 'center', background: '#000', padding: '12px', borderRadius: '8px' }}>
                        <img
                            src={previewUrl}
                            alt="Full Page"
                            style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
                        />
                    </div>
                )}
            </Modal>

            {/* Confirm Delete Page */}
            <ConfirmDialog
                isOpen={!!deletePageTarget}
                onClose={() => setDeletePageTarget(null)}
                onConfirm={handleDeletePage}
                title="Delete Manga Page"
                message={`Are you sure you want to delete Page ${deletePageTarget?.page_no ?? deletePageTarget?.pageNumber}? The remaining pages will automatically re-index in sequential order.`}
                confirmText="Delete Page"
            />
        </div>
    );
};
