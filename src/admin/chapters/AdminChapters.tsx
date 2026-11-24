import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    Image,
    Upload,
    ExternalLink,
    Lock,
    Unlock,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileUp,
    Check,
    X
} from 'lucide-react';
import {
    adminChapterService,
    adminBookService
} from '../../services/admin/adminServices';
import { chapterService } from '../../services/chapterService';
import type { Chapter, Book, ChapterPricingModel, ChapterContentStatus } from '../../types';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    Modal,
    ConfirmDialog,
    LoadingState,
    EmptyState
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

type PageUploadItem = {
    file: File;
    previewUrl: string;
    progress: number;
    status: 'ready' | 'uploading' | 'uploaded';
};

const convertToWebp = async (file: File): Promise<{ file: File; width: number; height: number }> => {
    const bitmap = await createImageBitmap(file);
    try {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'webp') return { file, width: bitmap.width, height: bitmap.height };

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error(`Could not convert "${file.name}" to WebP.`);
        context.drawImage(bitmap, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88));
        if (!blob) throw new Error(`Could not convert "${file.name}" to WebP.`);
        const webpName = file.name.replace(/\.[^.]+$/, '.webp');
        return {
            file: new File([blob], webpName, { type: 'image/webp', lastModified: file.lastModified }),
            width: bitmap.width,
            height: bitmap.height,
        };
    } finally {
        bitmap.close();
    }
};

export const AdminChapters: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialBookId = searchParams.get('bookId') || '';

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBookId, setSelectedBookId] = useState(initialBookId);
    const [searchQuery, setSearchQuery] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Chapter Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [formBookId, setFormBookId] = useState('');
    const [formChapterNo, setFormChapterNo] = useState(1);
    const [formSortOrder, setFormSortOrder] = useState(10);
    const [formTitle, setFormTitle] = useState('');
    const [formPricingModel, setFormPricingModel] = useState<ChapterPricingModel>('FREE');
    const [formCoinCost, setFormCoinCost] = useState(0);
    const [formPublished, setFormPublished] = useState(true);

    const MAX_IMAGE_SIZE_MB = 20;
    const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const [pagesModalOpen, setPagesModalOpen] = useState(false);
    const [uploadTargetChapter, setUploadTargetChapter] = useState<Chapter | null>(null);
    const [selectedPages, setSelectedPages] = useState<PageUploadItem[]>([]);
    const [uploadStep, setUploadStep] = useState<'idle' | 'converting' | 'requesting_url' | 'uploading_s3' | 'saving' | 'success'>('idle');
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadingPages, setUploadingPages] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const draggedPageIndex = React.useRef<number | null>(null);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);

    const loadBooks = async () => {
        try {
            const bList = await adminBookService.getAll();
            setBooks(bList);
        } catch {
            // Non-critical
        }
    };

    const loadChapters = async () => {
        setLoading(true);
        try {
            const cList = await adminChapterService.getAll({
                bookId: selectedBookId || undefined,
                search: searchQuery || undefined,
            });
            setChapters(cList);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Unable to load chapters.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setLoading(false);
        }
    };

    const loadData = loadChapters;

    useEffect(() => {
        loadBooks();
    }, []);

    useEffect(() => {
        loadChapters();
    }, [selectedBookId, searchQuery]);

    const handleBookFilterChange = (bookId: string) => {
        setSelectedBookId(bookId);
        if (bookId) {
            setSearchParams({ bookId });
        } else {
            setSearchParams({});
        }
    };

    const openCreateModal = () => {
        setEditingChapter(null);
        const bookId = selectedBookId || books[0]?.id || '';
        setFormBookId(bookId);
        const bookChapters = chapters.filter(c => (c.bookId === bookId || c.book_id === bookId));
        const nextNo = bookChapters.length + 1;
        setFormChapterNo(nextNo);
        setFormSortOrder(nextNo * 10);
        setFormTitle(`Chapter ${nextNo}`);
        setFormPricingModel('FREE');
        setFormCoinCost(0);
        setFormPublished(true);
        setModalOpen(true);
    };

    const openEditModal = (ch: Chapter) => {
        setEditingChapter(ch);
        setFormBookId(ch.bookId || ch.book_id);
        setFormChapterNo(ch.chapterNumber ?? ch.chapter_no);
        setFormSortOrder(ch.sortOrder ?? ch.sort_order ?? (ch.chapter_no * 10));
        setFormTitle(ch.title);
        const pricing = (ch.pricingModel || ch.pricing_model || 'FREE') as ChapterPricingModel;
        setFormPricingModel(pricing === 'PAID' ? 'PAID' : 'FREE');
        setFormCoinCost(ch.coinCost ?? ch.coin_cost ?? 0);
        setFormPublished(ch.published !== undefined ? ch.published : true);
        setModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!formTitle.trim()) {
            setErrorMessage('Chapter title is required.');
            return;
        }

        try {
            if (editingChapter) {
                await adminChapterService.update(editingChapter.id, {
                    bookId: formBookId,
                    chapterNumber: Number(formChapterNo),
                    sortOrder: Number(formSortOrder),
                    title: formTitle,
                    pricingModel: formPricingModel,
                    coinCost: formPricingModel === 'FREE' ? 0 : Number(formCoinCost),
                    published: formPublished
                });
                setSuccessMessage(`Chapter "${formTitle}" updated.`);
            } else {
                await adminChapterService.create({
                    bookId: formBookId,
                    chapterNumber: Number(formChapterNo),
                    sortOrder: Number(formSortOrder),
                    title: formTitle,
                    pricingModel: formPricingModel,
                    coinCost: formPricingModel === 'FREE' ? 0 : Number(formCoinCost),
                    published: formPublished
                });
                setSuccessMessage(`Chapter "${formTitle}" created.`);
            }
            setModalOpen(false);
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to save chapter.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const clearSelectedPages = () => {
        selectedPages.forEach((page) => URL.revokeObjectURL(page.previewUrl));
        setSelectedPages([]);
    };

    const openPagesUploadModal = (ch: Chapter) => {
        clearSelectedPages();
        setUploadTargetChapter(ch);
        setUploadStep('idle');
        setUploadError(null);
        setIsDragOver(false);
        setPagesModalOpen(true);
    };

    const selectPageFiles = (fileList: FileList | File[]) => {
        const incomingFiles = Array.from(fileList);
        const supportedFiles = incomingFiles.every((file) => /\.(webp|jpe?g|png)$/i.test(file.name));
        if (!supportedFiles) {
            setUploadError('Only .webp, .jpg, .jpeg, and .png chapter images are supported.');
            return;
        }
        if (incomingFiles.some((file) => file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES)) {
            setUploadError(`Each image must be non-empty and no larger than ${MAX_IMAGE_SIZE_MB} MB.`);
            return;
        }
        if (selectedPages.length + incomingFiles.length > 500) {
            setUploadError('A chapter can contain up to 500 pages.');
            return;
        }

        setUploadError(null);
        setUploadStep('idle');
        setSelectedPages((current) => [
            ...current,
            ...incomingFiles.map((file) => ({
                    file,
                    previewUrl: URL.createObjectURL(file),
                    progress: 0,
                    status: 'ready' as const,
                })),
        ].sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })));
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) selectPageFiles(e.target.files);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uploadingPages) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (uploadingPages) return;
        if (e.dataTransfer.files.length) selectPageFiles(e.dataTransfer.files);
    };

    const movePage = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex || uploadingPages) return;
        setSelectedPages((current) => {
            const reordered = [...current];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);
            return reordered;
        });
    };

    const handlePageUpload = async () => {
        if (!uploadTargetChapter || selectedPages.length === 0) return;
        setUploadingPages(true);
        setUploadError(null);

        try {
            setUploadStep('converting');
            const converted = await Promise.all(selectedPages.map(({ file }) => convertToWebp(file)));
            if (converted.some(({ file }) => file.size > MAX_IMAGE_SIZE_BYTES)) {
                throw new Error(`Converted WebP pages must each be no larger than ${MAX_IMAGE_SIZE_MB} MB.`);
            }

            setUploadStep('requesting_url');
            const uploadContract = await chapterService.getPageUploadUrls(
                uploadTargetChapter.id,
                converted.map(({ file }) => ({ fileName: file.name, fileSize: file.size }))
            );
            if (uploadContract.pages.length !== converted.length) {
                throw new Error('The server returned an incomplete page upload batch.');
            }

            setUploadStep('uploading_s3');
            let nextIndex = 0;
            const uploadWorker = async () => {
                while (nextIndex < converted.length) {
                    const index = nextIndex++;
                    const contract = uploadContract.pages[index];
                    setSelectedPages((current) => current.map((page, pageIndex) =>
                        pageIndex === index ? { ...page, status: 'uploading' } : page
                    ));
                    await chapterService.uploadPageToS3(contract.uploadUrl, converted[index].file, (progress) => {
                        setSelectedPages((current) => current.map((page, pageIndex) =>
                            pageIndex === index ? { ...page, progress: progress.percentage } : page
                        ));
                    });
                    setSelectedPages((current) => current.map((page, pageIndex) =>
                        pageIndex === index ? { ...page, status: 'uploaded', progress: 100 } : page
                    ));
                }
            };
            const uploadResults = await Promise.allSettled(
                Array.from({ length: Math.min(4, converted.length) }, () => uploadWorker())
            );
            const failedUpload = uploadResults.find((result) => result.status === 'rejected');
            if (failedUpload?.status === 'rejected') throw failedUpload.reason;

            setUploadStep('saving');
            await chapterService.savePages(
                uploadTargetChapter.id,
                uploadContract.pages.map((contract, index) => ({
                    pageNumber: contract.pageNumber,
                    storageKey: contract.storageKey,
                    width: converted[index].width,
                    height: converted[index].height,
                }))
            );

            setUploadStep('success');
            setSuccessMessage(`${converted.length} chapter pages uploaded and verified successfully.`);
            setTimeout(() => {
                setPagesModalOpen(false);
                clearSelectedPages();
                loadData();
            }, 1000);
        } catch (err: unknown) {
            console.error('[handlePageUpload] Upload error:', err);
            let message = 'Page upload failed. Please check your network and try again.';
            const error = err as { response?: { data?: { message?: string | string[] } }; message?: string };
            if (error.response?.data?.message) {
                const m = error.response.data.message;
                message = Array.isArray(m) ? m.join(', ') : m;
            } else if (error.message) {
                message = error.message;
            }
            setUploadError(message);
        } finally {
            setUploadingPages(false);
        }
    };

    const handleTogglePublish = async (ch: Chapter) => {
        try {
            const updated = await adminChapterService.togglePublish(ch.id);
            setSuccessMessage(`Chapter "${ch.title}" is now ${updated.published ? 'Published' : 'Draft/Unpublished'}.`);
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to toggle publication status.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleReorder = async (ch: Chapter, direction: 'up' | 'down') => {
        const bookChaps = chapters
            .filter(c => (c.bookId === ch.book_id || c.book_id === ch.book_id))
            .sort((a, b) => (a.sortOrder ?? a.chapterNumber ?? 0) - (b.sortOrder ?? b.chapterNumber ?? 0));
        
        const currentIndex = bookChaps.findIndex(c => c.id === ch.id);
        if (currentIndex === -1) return;
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === bookChaps.length - 1) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const targetChap = bookChaps[targetIndex];

        const currentSort = ch.sortOrder ?? ch.sort_order ?? ((currentIndex + 1) * 10);
        const targetSort = targetChap.sortOrder ?? targetChap.sort_order ?? ((targetIndex + 1) * 10);

        try {
            await Promise.all([
                adminChapterService.update(ch.id, { sortOrder: targetSort }),
                adminChapterService.update(targetChap.id, { sortOrder: currentSort })
            ]);
            setSuccessMessage('Chapter sequence updated.');
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to reorder chapters.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminChapterService.delete(deleteTarget.id);
            setSuccessMessage(`Chapter "${deleteTarget.title}" deleted.`);
            setDeleteTarget(null);
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to delete chapter.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    };

    const getBookTitle = (bookId: string) => {
        const b = books.find((item) => item.id === bookId);
        return b ? b.title : 'Unassigned Book';
    };

    return (
        <div>
            <PageHeader
                title="Chapter & Content Management"
                subtitle="Manage chapter WebP pages, monetization pricing (FREE or PAID with coins), and publishing status."
                breadcrumbs={[
                    { label: 'Admin', path: '/admin' },
                    { label: 'Chapters' }
                ]}
                actions={
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={16} /> Add Chapter
                    </button>
                }
            />

            {successMessage && (
                <div className={styles.alertSuccess} style={{ marginBottom: '16px' }}>
                    {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className={styles.alertError} style={{ marginBottom: '16px' }}>
                    {errorMessage}
                </div>
            )}

            <div className={styles.filterBar}>
                <div style={{ flex: 1 }}>
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search chapters by title or sequence..."
                    />
                </div>
                <div style={{ minWidth: '220px' }}>
                    <select
                        className={styles.formSelect}
                        value={selectedBookId}
                        onChange={(e) => handleBookFilterChange(e.target.value)}
                    >
                        <option value="">All Books ({books.length})</option>
                        {books.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.tableCard}>
                {loading ? (
                    <LoadingState message="Loading chapters..." />
                ) : chapters.length === 0 ? (
                    <EmptyState
                        title="No chapters found"
                        description="No chapters match your criteria. Create your first manga chapter."
                        action={
                            <button className={styles.btnPrimary} onClick={openCreateModal}>
                                <Plus size={14} /> New Chapter
                            </button>
                        }
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Chapter Title</th>
                                    <th>Parent Book</th>
                                    <th>Chapter Pages</th>
                                    <th>Pricing</th>
                                    <th>Coin Cost</th>
                                    <th>Content Status</th>
                                    <th>Publication</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chapters.map((ch) => {
                                    const pricing = (ch.pricingModel || ch.pricing_model || 'FREE') as ChapterPricingModel;
                                    const isPaid = pricing === 'PAID';
                                    const isPublished = ch.published !== undefined ? ch.published : true;
                                    const pageCount = ch.pageCount ?? ch.pages?.length ?? 0;
                                    const contentStatus = (ch.contentStatus || ch.content_status || (pageCount ? 'READY' : 'PENDING')) as ChapterContentStatus;

                                    return (
                                        <tr key={ch.id}>
                                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                                Ch. {ch.chapterNumber ?? ch.chapter_no}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{ch.title}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    Sort Order: {ch.sortOrder ?? ch.sort_order ?? 0}
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    style={{ fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                    onClick={() => navigate(`/admin/books/${ch.bookId || ch.book_id}`)}
                                                >
                                                    {getBookTitle(ch.bookId || ch.book_id)}
                                                </span>
                                            </td>
                                            <td>
                                                {pageCount > 0 ? (
                                                    <div>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                                                            <Image size={14} /> {pageCount} WebP pages
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            Ordered vertical chapter
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <AlertCircle size={13} /> No pages available (N/A)
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {isPaid ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffd700', fontSize: '12px', fontWeight: 700 }}>
                                                        <Lock size={12} /> PAID
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2ecc71', fontSize: '12px', fontWeight: 700 }}>
                                                        <Unlock size={12} /> FREE
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {(ch.coinCost ?? ch.coin_cost ?? 0) > 0 ? (
                                                    <StatusBadge status={`${ch.coinCost ?? ch.coin_cost} Coins`} type="coin" />
                                                ) : (
                                                    <StatusBadge status="0 Coins" type="info" />
                                                )}
                                            </td>
                                            <td>
                                                {contentStatus === 'READY' ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
                                                        <CheckCircle2 size={13} /> READY
                                                    </span>
                                                ) : contentStatus === 'FAILED' ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>
                                                        <AlertCircle size={13} /> FAILED
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '12px', fontWeight: 700 }}>
                                                        <Clock size={13} /> PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() => handleTogglePublish(ch)}
                                                    title="Click to toggle publication"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: 0
                                                    }}
                                                >
                                                    <StatusBadge
                                                        status={isPublished ? 'PUBLISHED' : 'DRAFT'}
                                                        type={isPublished ? 'success' : 'warning'}
                                                    />
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '4px' }}>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Move Up"
                                                        onClick={() => handleReorder(ch, 'up')}
                                                    >
                                                        <ChevronUp size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Move Down"
                                                        onClick={() => handleReorder(ch, 'down')}
                                                    >
                                                        <ChevronDown size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnSecondary}
                                                        style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                        title={pageCount ? 'Replace Chapter Pages' : 'Upload Chapter Pages'}
                                                        onClick={() => openPagesUploadModal(ch)}
                                                    >
                                                        <Upload size={12} /> {pageCount ? 'Manage Pages' : 'Upload Pages'}
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Edit Chapter"
                                                        onClick={() => openEditModal(ch)}
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title={isPublished ? 'Unpublish' : 'Publish'}
                                                        onClick={() => handleTogglePublish(ch)}
                                                    >
                                                        {isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Preview Chapter Reader"
                                                        onClick={() => navigate(`/reader/${ch.bookId || ch.book_id}/${ch.id}`)}
                                                    >
                                                        <ExternalLink size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        style={{ color: '#ef4444' }}
                                                        title="Delete Chapter"
                                                        onClick={() => setDeleteTarget(ch)}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Chapter Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingChapter ? `Edit Chapter: ${editingChapter.title}` : 'Create New Chapter'}
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handleFormSubmit}>
                            {editingChapter ? 'Save Changes' : 'Create Chapter'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleFormSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Parent Book *</label>
                        <select
                            className={styles.formSelect}
                            value={formBookId}
                            onChange={(e) => setFormBookId(e.target.value)}
                            required
                        >
                            {books.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Chapter Number *</label>
                            <input
                                type="number"
                                min={1}
                                className={styles.formInput}
                                value={formChapterNo}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    setFormChapterNo(val);
                                    if (!editingChapter) setFormSortOrder(val * 10);
                                }}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Sort Order Sequence</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={formSortOrder}
                                onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Chapter Title *</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="e.g. Chapter 1: The Firekeeper's Mark"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Pricing Model *</label>
                        <select
                            className={styles.formSelect}
                            value={formPricingModel}
                            onChange={(e) => {
                                const val = e.target.value as ChapterPricingModel;
                                setFormPricingModel(val);
                                if (val === 'FREE') {
                                    setFormCoinCost(0);
                                } else if (val === 'PAID') {
                                    if (formCoinCost === 0) setFormCoinCost(2);
                                }
                            }}
                        >
                            <option value="FREE">FREE — All readers can access chapter</option>
                            <option value="PAID">PAID — Chapter unlocked with coins</option>
                        </select>
                    </div>

                    {formPricingModel === 'PAID' && (
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Chapter Unlock Cost (Coins) *</label>
                            <input
                                type="number"
                                min={1}
                                className={styles.formInput}
                                value={formCoinCost}
                                onChange={(e) => setFormCoinCost(parseInt(e.target.value) || 1)}
                                required
                            />
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Coins deducted when the user unlocks this chapter. Subsequent reads do not recharge.
                            </p>
                        </div>
                    )}

                    <div className={styles.formGroup} style={{ marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formPublished}
                                onChange={(e) => setFormPublished(e.target.checked)}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Published & Available in Catalog
                            </span>
                        </label>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={pagesModalOpen}
                onClose={() => {
                    if (!uploadingPages) {
                        setPagesModalOpen(false);
                        clearSelectedPages();
                    }
                }}
                title={uploadTargetChapter ? `Chapter Pages: ${uploadTargetChapter.title}` : 'Upload Chapter Pages'}
                footer={
                    <>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => {
                                setPagesModalOpen(false);
                                clearSelectedPages();
                            }}
                            disabled={uploadingPages}
                        >
                            {uploadStep === 'success' ? 'Done' : 'Cancel'}
                        </button>
                        <button
                            className={styles.btnPrimary}
                            onClick={handlePageUpload}
                            disabled={uploadingPages || selectedPages.length === 0 || uploadStep === 'success'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Upload size={14} />
                            {uploadingPages
                                ? uploadStep === 'converting'
                                    ? 'Converting to WebP...'
                                    : uploadStep === 'requesting_url'
                                        ? 'Preparing uploads...'
                                        : uploadStep === 'uploading_s3'
                                            ? 'Uploading pages...'
                                            : 'Saving page order...'
                                : uploadStep === 'success'
                                    ? 'Upload Complete'
                                    : `Upload ${selectedPages.length} Page${selectedPages.length === 1 ? '' : 's'}`}
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".webp,.jpg,.jpeg,.png,image/webp,image/jpeg,image/png"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                        disabled={uploadingPages}
                    />
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !uploadingPages && fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--color-border)'}`,
                            borderRadius: '10px',
                            padding: '24px 16px',
                            textAlign: 'center',
                            cursor: uploadingPages ? 'not-allowed' : 'pointer',
                            background: isDragOver ? 'rgba(230, 57, 70, 0.06)' : 'var(--color-bg-secondary)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <FileUp size={28} color="var(--primary)" />
                        <strong>{isDragOver ? 'Drop chapter images here' : 'Choose or drop chapter images'}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            WebP, JPEG, and PNG; files are sorted numerically by name and converted to WebP.
                        </span>
                    </div>

                    {selectedPages.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                            {selectedPages.map((page, index) => (
                                <div
                                    key={`${page.file.name}-${index}`}
                                    draggable={!uploadingPages}
                                    onDragStart={() => { draggedPageIndex.current = index; }}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        if (event.dataTransfer.files.length) {
                                            selectPageFiles(event.dataTransfer.files);
                                            return;
                                        }
                                        if (draggedPageIndex.current !== null) movePage(draggedPageIndex.current, index);
                                        draggedPageIndex.current = null;
                                    }}
                                    style={{ position: 'relative', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-surface)' }}
                                >
                                    <img src={page.previewUrl} alt={page.file.name} style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                                    <div style={{ padding: '8px', fontSize: '11px' }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
                                            {index + 1}. {page.file.name}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {page.status === 'uploaded' ? 'Uploaded' : page.status === 'uploading' ? `${page.progress}%` : `${(page.file.size / (1024 * 1024)).toFixed(1)} MB`}
                                        </div>
                                        {page.status !== 'ready' && (
                                            <div style={{ height: '4px', marginTop: '6px', background: 'rgba(255,255,255,.1)', borderRadius: '4px' }}>
                                                <div style={{ width: `${page.progress}%`, height: '100%', background: page.status === 'uploaded' ? '#10b981' : 'var(--primary)' }} />
                                            </div>
                                        )}
                                    </div>
                                    {!uploadingPages && (
                                        <button
                                            type="button"
                                            aria-label={`Remove ${page.file.name}`}
                                            onClick={() => {
                                                URL.revokeObjectURL(page.previewUrl);
                                                setSelectedPages((current) => current.filter((_, pageIndex) => pageIndex !== index));
                                            }}
                                            style={{ position: 'absolute', top: '6px', right: '6px', border: 0, borderRadius: '50%', background: 'rgba(0,0,0,.7)', color: 'white', width: '24px', height: '24px', cursor: 'pointer' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {uploadError && (
                        <div className={styles.alertError} role="alert">
                            <AlertCircle size={16} /> {uploadError}
                        </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Images upload directly to private S3 storage. Drag thumbnails to change reading order before upload.
                    </div>
                </div>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Chapter"
                message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
                confirmText="Delete Chapter"
            />
        </div>
    );
};
