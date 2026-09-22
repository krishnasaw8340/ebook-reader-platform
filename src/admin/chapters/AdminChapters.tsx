import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    FileImage,
    ExternalLink,
    Lock,
    Unlock,
    ChevronUp,
    ChevronDown,
    Eye,
    EyeOff
} from 'lucide-react';
import {
    adminChapterService,
    adminBookService
} from '../../services/admin/adminServices';
import type { Chapter, Book, ChapterPricingModel } from '../../types';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    Modal,
    ConfirmDialog,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

export const AdminChapters: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialBookId = searchParams.get('bookId') || '';

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [pagesMap, setPagesMap] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [selectedBookId, setSelectedBookId] = useState(initialBookId);
    const [searchQuery, setSearchQuery] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [formBookId, setFormBookId] = useState('');
    const [formChapterNo, setFormChapterNo] = useState(1);
    const [formSortOrder, setFormSortOrder] = useState(10);
    const [formTitle, setFormTitle] = useState('');
    const [formPricingModel, setFormPricingModel] = useState<ChapterPricingModel>('FREE');
    const [formCoinCost, setFormCoinCost] = useState(0);
    const [formFreePages, setFormFreePages] = useState(0);
    const [formPublished, setFormPublished] = useState(true);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);

    // Load books list once on mount (used for filter dropdown + modal form)
    const loadBooks = async () => {
        try {
            const bList = await adminBookService.getAll();
            setBooks(bList);
        } catch {
            // Non-critical for dropdowns
        }
    };

    // Load chapters reactively when book filter or search changes
    const loadChapters = async () => {
        setLoading(true);
        try {
            const cList = await adminChapterService.getAll({
                bookId: selectedBookId || undefined,
                search: searchQuery || undefined,
            });
            setChapters(cList);

            // Build page count map from the chapters' own pageCount field (no extra API calls)
            const pCounts: Record<string, number> = {};
            cList.forEach((c) => {
                pCounts[c.id] = c.pageCount ?? c.page_count ?? 0;
            });
            setPagesMap(pCounts);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Unable to load chapters.';
            setErrorMessage(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setLoading(false);
        }
    };

    // Alias for post-mutation refresh (chapters only)
    const loadData = loadChapters;

    // Fetch books once on mount
    useEffect(() => {
        loadBooks();
    }, []);

    // Fetch chapters when filter/search changes
    useEffect(() => {
        loadChapters();
    }, [selectedBookId, searchQuery]);

    // Keep URL search query in sync when selected book changes
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
        setFormFreePages(0);
        setFormPublished(true);
        setModalOpen(true);
    };

    const openEditModal = (ch: Chapter) => {
        setEditingChapter(ch);
        setFormBookId(ch.bookId || ch.book_id);
        setFormChapterNo(ch.chapterNumber ?? ch.chapter_no);
        setFormSortOrder(ch.sortOrder ?? ch.sort_order ?? (ch.chapter_no * 10));
        setFormTitle(ch.title);
        const pricing = (ch.pricingModel || ch.pricing_model || ch.access_type || 'FREE') as ChapterPricingModel;
        setFormPricingModel(pricing);
        setFormCoinCost(ch.coinCost ?? ch.coin_cost ?? 0);
        setFormFreePages(ch.freePageCount ?? ch.free_pages ?? 0);
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
                    freePageCount: formPricingModel === 'PARTIAL_FREE' ? Number(formFreePages) : 0,
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
                    freePageCount: formPricingModel === 'PARTIAL_FREE' ? Number(formFreePages) : 0,
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
            setSuccessMessage(`Chapter sequence updated.`);
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

    const currentBook = books.find(b => b.id === selectedBookId);

    return (
        <div>
            <PageHeader
                title="Chapter & Content Management"
                subtitle="Configure chapter pricing models (Free, Paid, Partial-Free), DRM pages, publication status, and sequence ordering."
                breadcrumbs={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    ...(selectedBookId ? [
                        { label: 'Books', path: '/admin/books' },
                        { label: currentBook?.title || 'Selected Book', path: `/admin/books/${selectedBookId}` },
                    ] : [
                        { label: 'Books', path: '/admin/books' },
                    ]),
                    { label: 'Chapters' }
                ]}
                actions={
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={16} /> New Chapter
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            <div className={styles.filterBar}>
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search chapters by title or keyword..."
                />

                <div className={styles.filterGroup}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Book:</label>
                    <select
                        className={styles.selectInput}
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
                                    <th>Pages</th>
                                    <th>Pricing Model</th>
                                    <th>Unlock Price</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {chapters.map((ch) => {
                                    const pageCount = pagesMap[ch.id] ?? ch.pageCount ?? ch.page_count ?? 0;
                                    const pricing = (ch.pricingModel || ch.pricing_model || ch.access_type || 'FREE') as ChapterPricingModel;
                                    const isPaid = pricing === 'PAID';
                                    const isPartial = pricing === 'PARTIAL_FREE' || pricing === 'PARTIAL';
                                    const isPublished = ch.published !== undefined ? ch.published : true;

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
                                                <span style={{ fontWeight: 600, color: pageCount > 0 ? 'var(--color-text-primary)' : 'var(--text-muted)' }}>
                                                    {pageCount} scan(s)
                                                </span>
                                            </td>
                                            <td>
                                                {isPaid ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ffd700', fontSize: '12px', fontWeight: 700 }}>
                                                        <Lock size={12} /> PAID
                                                    </span>
                                                ) : isPartial ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>
                                                        <Unlock size={12} /> PARTIAL FREE ({ch.freePageCount ?? ch.free_pages ?? 0} pgs)
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
                                            <td style={{ fontSize: '12px' }}>
                                                {new Date(ch.createdAt || ch.created_at).toLocaleDateString()}
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
                                                        title="Manage Manga Pages"
                                                        onClick={() => navigate(`/admin/pages?chapterId=${ch.id}`)}
                                                    >
                                                        <FileImage size={12} /> Pages ({pageCount})
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
                                                        title="Read in Reader"
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

            {/* Create / Edit Modal */}
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
                            placeholder="e.g. Chapter 1: The Awakening"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Pricing & Access Model *</label>
                        <select
                            className={styles.formSelect}
                            value={formPricingModel}
                            onChange={(e) => {
                                const val = e.target.value as ChapterPricingModel;
                                setFormPricingModel(val);
                                if (val === 'FREE') {
                                    setFormCoinCost(0);
                                    setFormFreePages(0);
                                } else if (val === 'PARTIAL_FREE') {
                                    if (formCoinCost === 0) setFormCoinCost(5);
                                    if (formFreePages === 0) setFormFreePages(3);
                                } else if (val === 'PAID') {
                                    if (formCoinCost === 0) setFormCoinCost(5);
                                    setFormFreePages(0);
                                }
                            }}
                        >
                            <option value="FREE">FREE — Everyone can read unrestricted</option>
                            <option value="PARTIAL_FREE">PARTIAL_FREE — Free preview pages, coin unlock for full</option>
                            <option value="PAID">PAID — Full coin unlock required</option>
                        </select>
                    </div>

                    {formPricingModel !== 'FREE' && (
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Unlock Cost (Coins) *</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={styles.formInput}
                                    value={formCoinCost}
                                    onChange={(e) => setFormCoinCost(parseInt(e.target.value) || 1)}
                                    required
                                />
                            </div>

                            {formPricingModel === 'PARTIAL_FREE' && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Free Preview Pages *</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className={styles.formInput}
                                        value={formFreePages}
                                        onChange={(e) => setFormFreePages(parseInt(e.target.value) || 1)}
                                        required
                                    />
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Number of initial pages readers can preview for free
                                    </p>
                                </div>
                            )}
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

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Chapter"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? All page scans associated with this chapter will also be removed.`}
                confirmText="Delete Chapter"
            />
        </div>
    );
};
