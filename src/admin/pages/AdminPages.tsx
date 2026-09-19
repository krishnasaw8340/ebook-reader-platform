import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    UploadCloud,
    Trash2,
    MoveLeft,
    MoveRight,
    Eye,
    RefreshCw,
    Save,
    GripVertical,
    FileImage,
    Layers,
    ArrowUpToLine,
    ArrowDownToLine,
    ListOrdered
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

export const AdminPages: React.FC = () => {
    const [searchParams] = useSearchParams();
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

    // Multi-upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const multiInputRef = useRef<HTMLInputElement>(null);

    // Drag-and-drop state
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Preview / Replace modal
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [replacePageTarget, setReplacePageTarget] = useState<Page | null>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);

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
                setErrorMessage(err.message || 'Unable to load chapters.');
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
            setErrorMessage(err.message || 'Unable to load chapter pages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedChapterId) {
            loadPages(selectedChapterId);
        }
    }, [selectedChapterId]);

    // Handle multiple file upload
    const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !selectedChapterId) return;

        setIsUploading(true);
        setUploadProgress(10);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const urls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const objectUrl = URL.createObjectURL(file);
                urls.push(objectUrl);
            }

            setUploadProgress(60);

            const created = await adminPageService.uploadPages(selectedChapterId, urls);
            setUploadProgress(100);
            setSuccessMessage(`Successfully uploaded ${created.length} new manga page(s).`);
            loadPages(selectedChapterId);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to upload pages.');
        } finally {
            setIsUploading(false);
            if (multiInputRef.current) multiInputRef.current.value = '';
        }
    };

    // Reordering: Move Left / Move Right
    const movePage = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= pages.length) return;
        const copy = [...pages];
        const [moved] = copy.splice(fromIndex, 1);
        copy.splice(toIndex, 0, moved);
        const reordered = copy.map((p, idx) => ({ ...p, page_no: idx + 1 }));
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
        const reordered = copy.map((p, idx) => ({ ...p, page_no: idx + 1 }));
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
        const reordered = copy.map((p, idx) => ({ ...p, page_no: idx + 1 }));
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
            await adminPageService.reorderPages(selectedChapterId, pageIds);
            setSuccessMessage('Page sequence successfully saved and locked to DRM catalog.');
            loadPages(selectedChapterId);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save page ordering.');
        } finally {
            setSavingOrder(false);
        }
    };

    // Replace image handler
    const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !replacePageTarget) return;

        const file = files[0];
        const newUrl = URL.createObjectURL(file);

        try {
            await adminPageService.replacePageImage(replacePageTarget.id, newUrl);
            setSuccessMessage(`Page ${replacePageTarget.page_no} replaced.`);
            setReplacePageTarget(null);
            loadPages(selectedChapterId);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to replace page.');
        }
    };

    // Delete single page
    const handleDeletePage = async () => {
        if (!deletePageTarget) return;
        try {
            await adminPageService.deletePage(deletePageTarget.id);
            setSuccessMessage(`Page ${deletePageTarget.page_no} deleted and sequence reindexed.`);
            setDeletePageTarget(null);
            loadPages(selectedChapterId);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to delete page.');
        }
    };

    const currentChapter = chapters.find((c) => c.id === selectedChapterId);

    return (
        <div>
            <PageHeader
                title="Manga Page Management & DRM Compiler"
                subtitle="Upload scans from desktop or mobile device, manage deterministic page ordering, and inspect DRM sequences."
                actions={
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => multiInputRef.current?.click()}
                            disabled={!selectedChapterId || isUploading}
                            style={{ flex: 1, minWidth: '160px' }}
                        >
                            <UploadCloud size={16} /> Batch Upload Scans
                        </button>
                        <button
                            className={styles.btnPrimary}
                            onClick={saveDeterministicOrder}
                            disabled={pages.length === 0 || savingOrder}
                            style={{ flex: 1, minWidth: '160px' }}
                        >
                            <Save size={16} /> {savingOrder ? 'Saving...' : 'Lock Page Order'}
                        </button>
                    </div>
                }
            />

            {/* Hidden file input for batch upload */}
            <input
                type="file"
                ref={multiInputRef}
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleMultiUpload}
            />

            {/* Hidden file input for single page replacement */}
            <input
                type="file"
                ref={replaceInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleReplaceFile}
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Chapter Selection Bar */}
            <div className={styles.filterBar} style={{ background: 'var(--card)', padding: '16px', borderRadius: 'var(--border-radius)', border: '1px solid var(--glass-border)' }}>
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
                            const b = books.find((book) => book.id === ch.book_id);
                            return (
                                <option key={ch.id} value={ch.id}>
                                    {b ? `[${b.title}] ` : ''}Ch. {ch.chapter_no}: {ch.title} ({ch.access_type})
                                </option>
                            );
                        })}
                    </select>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Total Pages: <strong style={{ color: 'var(--color-text-primary)' }}>{pages.length}</strong>
                        </span>
                        <span style={{ fontSize: '12px', color: currentChapter?.access_type === 'PAID' ? '#ffd700' : '#2ecc71', fontWeight: 700 }}>
                            {currentChapter?.access_type === 'PAID' ? `PAID (${currentChapter.coin_cost} Coins)` : 'FREE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Upload Progress Indicator */}
            {isUploading && (
                <div style={{ marginTop: '16px', background: 'var(--card)', padding: '16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>Optimizing & encrypting pages (WebP / DRM)...</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
                    </div>
                </div>
            )}

            {/* Pages Grid with Deterministic Ordering */}
            <div style={{ marginTop: '20px' }}>
                {loading ? (
                    <LoadingState message="Loading manga pages..." />
                ) : pages.length === 0 ? (
                    <div className={styles.tableCard}>
                        <EmptyState
                            title="No pages uploaded for this chapter"
                            description="Upload or select manga page scans to compile this chapter."
                            action={
                                <button className={styles.btnPrimary} onClick={() => multiInputRef.current?.click()}>
                                    <UploadCloud size={14} /> Upload First Pages
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
                                            PAGE {page.page_no}
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
                                        onClick={() => setPreviewUrl(page.image_url)}
                                    >
                                        <img
                                            src={page.image_url}
                                            alt={`Page ${page.page_no}`}
                                            loading="lazy"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />

                                        <div style={{
                                            position: 'absolute',
                                            top: 6,
                                            right: 6,
                                            display: 'flex',
                                            gap: '4px'
                                        }}>
                                            <button
                                                className={styles.btnIcon}
                                                style={{ width: '28px', height: '28px', background: 'rgba(0,0,0,0.7)', color: '#ffffff' }}
                                                title="Full Preview"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewUrl(page.image_url);
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
                                                    setTargetPosition(page.page_no);
                                                }}
                                            >
                                                <ListOrdered size={13} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            <button
                                                className={styles.btnIcon}
                                                style={{ width: '32px', height: '32px' }}
                                                title="Replace Image"
                                                onClick={() => {
                                                    setReplacePageTarget(page);
                                                    replaceInputRef.current?.click();
                                                }}
                                            >
                                                <RefreshCw size={13} />
                                            </button>
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
                title={`Move Page ${movePageTarget?.page_no} to Position`}
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
                message={`Are you sure you want to delete Page ${deletePageTarget?.page_no}? The remaining pages will automatically re-index in sequential order.`}
                confirmText="Delete Page"
            />
        </div>
    );
};
