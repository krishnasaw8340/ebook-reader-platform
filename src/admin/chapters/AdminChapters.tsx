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
    AlertCircle
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

    // PDF Upload Modal
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [uploadTargetChapter, setUploadTargetChapter] = useState<Chapter | null>(null);
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadFileSize, setUploadFileSize] = useState(15728640); // 15MB default
    const [uploadPageCount, setUploadPageCount] = useState(32);
    const [uploadingPdf, setUploadingPdf] = useState(false);

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
        const numPadded = String(ch.chapterNumber ?? ch.chapter_no).padStart(3, '0');
        setUploadFileName(ch.pdfFileName || ch.pdf_file_name || `chapter-${numPadded}.pdf`);
        setUploadFileSize(ch.pdfFileSize || ch.pdf_file_size || 18500000);
        setUploadPageCount(ch.pdfPageCount || ch.pdf_page_count || 42);
        setPdfModalOpen(true);
    };

    const handlePdfUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadTargetChapter) return;
        setUploadingPdf(true);
        setErrorMessage(null);

        try {
            // 1. Initialize upload contract
            const initRes = await chapterService.uploadInit(uploadTargetChapter.id, {
                fileName: uploadFileName,
                fileSize: Number(uploadFileSize),
                mimeType: 'application/pdf'
            });

            // 2. Complete upload contract with metadata
            await chapterService.uploadComplete(uploadTargetChapter.id, {
                fileName: uploadFileName,
                fileSize: Number(uploadFileSize),
                pageCount: Number(uploadPageCount),
                checksum: `sha256-mock-${Date.now()}`
            });

            setSuccessMessage(`Chapter PDF "${uploadFileName}" attached successfully.`);
            setPdfModalOpen(false);
            loadData();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to attach Chapter PDF.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
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

            {/* PDF Upload / Replace Modal */}
            <Modal
                isOpen={pdfModalOpen}
                onClose={() => setPdfModalOpen(false)}
                title={uploadTargetChapter ? `Upload PDF: ${uploadTargetChapter.title}` : 'Upload Chapter PDF'}
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setPdfModalOpen(false)} disabled={uploadingPdf}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handlePdfUploadSubmit} disabled={uploadingPdf}>
                            {uploadingPdf ? 'Attaching PDF...' : 'Attach PDF to Chapter'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handlePdfUploadSubmit}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        One chapter corresponds to one PDF asset stored in object storage. Internal PDF pages are rendered continuously by the reader.
                    </p>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>PDF File Name *</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="e.g. chapter-001.pdf"
                            value={uploadFileName}
                            onChange={(e) => setUploadFileName(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>PDF Total Pages *</label>
                            <input
                                type="number"
                                min={1}
                                className={styles.formInput}
                                value={uploadPageCount}
                                onChange={(e) => setUploadPageCount(parseInt(e.target.value) || 1)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>File Size (Bytes) *</label>
                            <input
                                type="number"
                                min={1024}
                                className={styles.formInput}
                                value={uploadFileSize}
                                onChange={(e) => setUploadFileSize(parseInt(e.target.value) || 1024)}
                                required
                            />
                        </div>
                    </div>
                </form>
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
