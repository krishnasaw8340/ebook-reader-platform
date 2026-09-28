import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    FileText,
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
    RefreshCw,
    FileUp,
    Check
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

    // PDF Upload Modal & AWS S3 Flow
    const MAX_PDF_SIZE_MB = 200;
    const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [uploadTargetChapter, setUploadTargetChapter] = useState<Chapter | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStep, setUploadStep] = useState<'idle' | 'requesting_url' | 'uploading_s3' | 'verifying' | 'success' | 'error'>('idle');
    const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number; percentage: number }>({ loaded: 0, total: 0, percentage: 0 });
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

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

    const openPdfUploadModal = (ch: Chapter) => {
        setUploadTargetChapter(ch);
        setSelectedFile(null);
        setUploadStep('idle');
        setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
        setUploadError(null);
        setIsDragOver(false);
        setPdfModalOpen(true);
    };

    const validateAndSelectFile = (file: File) => {
        setUploadError(null);
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            setUploadError('Invalid file type. Please select a valid PDF file (.pdf).');
            setSelectedFile(null);
            return;
        }

        if (file.size <= 0) {
            setUploadError('The selected file is empty. Please select a valid PDF.');
            setSelectedFile(null);
            return;
        }

        if (file.size > MAX_PDF_SIZE_BYTES) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            setUploadError(`File is too large (${sizeMb} MB). Maximum allowed size is ${MAX_PDF_SIZE_MB} MB.`);
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setUploadStep('idle');
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSelectFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uploadingPdf) setIsDragOver(true);
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
        if (uploadingPdf) return;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSelectFile(e.dataTransfer.files[0]);
        }
    };

    const handlePdfUpload = async () => {
        if (!uploadTargetChapter || !selectedFile) return;
        setUploadingPdf(true);
        setUploadError(null);

        try {
            // Step 1: Request S3 presigned PUT URL from NestJS backend
            setUploadStep('requesting_url');
            const uploadContract = await chapterService.getUploadUrl(uploadTargetChapter.id, {
                fileName: selectedFile.name,
                contentType: 'application/pdf',
                fileSize: selectedFile.size,
            });

            // Step 2: Upload PDF directly to AWS S3 via presigned PUT URL
            // (PDF bytes never touch NestJS!)
            setUploadStep('uploading_s3');
            setUploadProgress({ loaded: 0, total: selectedFile.size, percentage: 0 });

            await chapterService.uploadPdfToS3(uploadContract.uploadUrl, selectedFile, (prog) => {
                setUploadProgress(prog);
            });

            // Step 3: Complete upload and verify S3 object integrity with NestJS backend
            setUploadStep('verifying');
            await chapterService.uploadComplete(uploadTargetChapter.id, {
                uploadId: uploadContract.uploadId,
                versionId: uploadContract.versionId,
                objectKey: uploadContract.objectKey,
                storageKey: uploadContract.objectKey,
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
            });

            // Step 4: Success
            setUploadStep('success');
            setSuccessMessage(`Chapter PDF "${selectedFile.name}" uploaded and verified successfully in AWS S3.`);
            setTimeout(() => {
                setPdfModalOpen(false);
                loadData();
            }, 1000);
        } catch (err: any) {
            console.error('[handlePdfUpload] Upload error:', err);
            setUploadStep('error');
            let message = 'Upload failed. Please check your network and try again.';
            if (err.response?.data?.message) {
                const m = err.response.data.message;
                message = Array.isArray(m) ? m.join(', ') : m;
            } else if (err.message) {
                message = err.message;
            }
            setUploadError(message);
        } finally {
            setUploadingPdf(false);
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
                subtitle="Manage manga chapter PDFs, monetization pricing (FREE or PAID with coins), and publishing status."
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
                                    <th>Content (PDF Asset)</th>
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
                                    const pdfName = ch.pdfFileName || ch.pdf_file_name;
                                    const pdfPages = ch.pdfPageCount ?? ch.pdf_page_count;
                                    const pdfSize = ch.pdfFileSize ?? ch.pdf_file_size;
                                    const contentStatus = (ch.contentStatus || ch.content_status || (pdfName ? 'READY' : 'PENDING')) as ChapterContentStatus;
                                    const sizeMb = pdfSize ? (pdfSize / (1024 * 1024)).toFixed(1) + ' MB' : null;

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
                                                {pdfName ? (
                                                    <div>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                                                            <FileText size={14} /> {pdfName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                            {pdfPages ? `${pdfPages} PDF pages` : 'PDF'} {sizeMb ? ` • ${sizeMb}` : ''}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <AlertCircle size={13} /> No PDF uploaded
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
                                                        title={pdfName ? 'Replace Chapter PDF' : 'Upload Chapter PDF'}
                                                        onClick={() => openPdfUploadModal(ch)}
                                                    >
                                                        <Upload size={12} /> {pdfName ? 'Replace PDF' : 'Upload PDF'}
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

            {/* PDF Upload / Replace Modal with Direct AWS S3 Flow */}
            <Modal
                isOpen={pdfModalOpen}
                onClose={() => {
                    if (!uploadingPdf) {
                        setPdfModalOpen(false);
                    }
                }}
                title={
                    uploadTargetChapter
                        ? `${uploadTargetChapter.pdfFileName || uploadTargetChapter.pdf_file_name ? 'Replace' : 'Upload'} PDF: ${uploadTargetChapter.title}`
                        : 'Upload Chapter PDF'
                }
                footer={
                    <>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => setPdfModalOpen(false)}
                            disabled={uploadingPdf}
                        >
                            {uploadStep === 'success' ? 'Done' : 'Cancel'}
                        </button>
                        {uploadStep === 'error' ? (
                            <button
                                className={styles.btnPrimary}
                                onClick={handlePdfUpload}
                                disabled={uploadingPdf || !selectedFile}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <RefreshCw size={14} className={uploadingPdf ? styles.spinner : ''} />
                                Retry Upload
                            </button>
                        ) : (
                            <button
                                className={styles.btnPrimary}
                                onClick={handlePdfUpload}
                                disabled={uploadingPdf || !selectedFile || uploadStep === 'success'}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Upload size={14} />
                                {uploadingPdf
                                    ? uploadStep === 'requesting_url'
                                        ? 'Generating S3 URL...'
                                        : uploadStep === 'uploading_s3'
                                        ? `Uploading (${uploadProgress.percentage}%)`
                                        : 'Verifying with S3...'
                                    : uploadStep === 'success'
                                    ? 'Upload Complete'
                                    : uploadTargetChapter?.pdfFileName || uploadTargetChapter?.pdf_file_name
                                    ? 'Replace PDF Asset'
                                    : 'Upload Chapter PDF'}
                            </button>
                        )}
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Existing PDF Info Banner */}
                    {(uploadTargetChapter?.pdfFileName || uploadTargetChapter?.pdf_file_name) && (
                        <div
                            style={{
                                background: 'rgba(59, 130, 246, 0.08)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Current PDF Asset
                                </span>
                                <span
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: uploadTargetChapter.contentStatus === 'READY' || uploadTargetChapter.content_status === 'READY'
                                            ? 'rgba(16, 185, 129, 0.2)'
                                            : 'rgba(245, 158, 11, 0.2)',
                                        color: uploadTargetChapter.contentStatus === 'READY' || uploadTargetChapter.content_status === 'READY'
                                            ? '#34d399'
                                            : '#fbbf24',
                                    }}
                                >
                                    {uploadTargetChapter.contentStatus || uploadTargetChapter.content_status || 'PENDING'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                <FileText size={16} color="#60a5fa" />
                                <span>{uploadTargetChapter.pdfFileName || uploadTargetChapter.pdf_file_name}</span>
                                {(uploadTargetChapter.pdfFileSize || uploadTargetChapter.pdf_file_size) && (
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                                        • {(((uploadTargetChapter.pdfFileSize ?? uploadTargetChapter.pdf_file_size) ?? 0) / (1024 * 1024)).toFixed(1)} MB
                                    </span>
                                )}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Note: Replacing will generate a new immutable version key in S3 without overwriting the previous asset.
                            </span>
                        </div>
                    )}

                    {/* Drag and drop file picker area */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                        disabled={uploadingPdf}
                    />

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => {
                            if (!uploadingPdf && fileInputRef.current) {
                                fileInputRef.current.click();
                            }
                        }}
                        style={{
                            border: isDragOver
                                ? '2px dashed var(--primary)'
                                : '2px dashed var(--color-border)',
                            borderRadius: '10px',
                            padding: '24px 16px',
                            textAlign: 'center',
                            cursor: uploadingPdf ? 'not-allowed' : 'pointer',
                            background: isDragOver
                                ? 'rgba(230, 57, 70, 0.06)'
                                : 'var(--color-bg-secondary)',
                            transition: 'var(--transition-fast)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                        }}
                    >
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'rgba(230, 57, 70, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--primary)',
                            }}
                        >
                            <FileUp size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                                {isDragOver ? 'Drop PDF file here' : 'Choose a Chapter PDF file'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Drag and drop your manga/ebook PDF here, or click to browse
                            </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Format: PDF only (application/pdf) • Maximum file size: {MAX_PDF_SIZE_MB} MB
                        </div>
                    </div>

                    {/* Selected File Details */}
                    {selectedFile && (
                        <div
                            style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '6px',
                                        background: 'rgba(230, 57, 70, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary)',
                                    }}
                                >
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                        {selectedFile.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • application/pdf
                                    </div>
                                </div>
                            </div>
                            {!uploadingPdf && uploadStep !== 'success' && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (fileInputRef.current) fileInputRef.current.click();
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        color: 'var(--text-secondary)',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        padding: '4px 10px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Change
                                </button>
                            )}
                        </div>
                    )}

                    {/* Live Upload Progress */}
                    {(uploadingPdf || uploadStep === 'success') && (
                        <div
                            style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '14px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                    {uploadStep === 'requesting_url' && 'Step 1/3: Requesting presigned S3 upload URL...'}
                                    {uploadStep === 'uploading_s3' && `Step 2/3: Uploading ${selectedFile?.name} directly to S3...`}
                                    {uploadStep === 'verifying' && 'Step 3/3: Verifying S3 object integrity with backend...'}
                                    {uploadStep === 'success' && 'Upload Complete! S3 object verified.'}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: uploadStep === 'success' ? '#10b981' : 'var(--primary)' }}>
                                    {uploadStep === 'success' ? '100%' : `${uploadProgress.percentage}%`}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div
                                style={{
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: uploadStep === 'success' ? '100%' : `${uploadProgress.percentage}%`,
                                        height: '100%',
                                        background: uploadStep === 'success'
                                            ? '#10b981'
                                            : 'linear-gradient(90deg, var(--primary), #ff758f)',
                                        transition: 'width 0.2s ease-in-out',
                                        borderRadius: '4px',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                                <span>
                                    {uploadStep === 'uploading_s3'
                                        ? `${(uploadProgress.loaded / (1024 * 1024)).toFixed(1)} MB / ${(uploadProgress.total / (1024 * 1024)).toFixed(1)} MB`
                                        : uploadStep === 'success'
                                        ? 'Verified in ap-south-1 S3 bucket'
                                        : 'Amazon S3 private PUT stream'}
                                </span>
                                <span>
                                    {uploadStep === 'uploading_s3' && 'Direct Browser → S3'}
                                    {uploadStep === 'verifying' && 'HeadObject check'}
                                    {uploadStep === 'success' && 'Metadata synced'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Banner */}
                    {uploadError && (
                        <div
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '12px 14px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                color: '#f87171',
                                fontSize: '13px',
                            }}
                        >
                            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>Upload Error</div>
                                <div>{uploadError}</div>
                            </div>
                        </div>
                    )}

                    {/* Direct S3 Architecture Notice */}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        🔒 <strong>Zero-Proxy S3 Security:</strong> The PDF binary is uploaded directly from your browser to Amazon S3 via a temporary signed PUT contract. File bytes never pass through the API server, ensuring zero buffer bottlenecks.
                    </div>
                </div>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Chapter"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? The chapter and its associated PDF asset reference will be removed.`}
                confirmText="Delete Chapter"
            />
        </div>
    );
};
