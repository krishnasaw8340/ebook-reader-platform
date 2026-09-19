import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    FileImage,
    ExternalLink,
    Lock,
    Unlock
} from 'lucide-react';
import {
    adminChapterService,
    adminBookService,
    adminPageService
} from '../../services/admin/adminServices';
import type { Chapter, Book } from '../../types';
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
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [pagesMap, setPagesMap] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [selectedBookId, setSelectedBookId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
    const [formBookId, setFormBookId] = useState('');
    const [formChapterNo, setFormChapterNo] = useState(1);
    const [formTitle, setFormTitle] = useState('');
    const [formAccessType, setFormAccessType] = useState<'FREE' | 'PARTIAL' | 'PAID'>('FREE');
    const [formCoinCost, setFormCoinCost] = useState(0);
    const [formFreePages, setFormFreePages] = useState(1);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bList, cList] = await Promise.all([
                adminBookService.getAll(),
                adminChapterService.getAll(selectedBookId || undefined)
            ]);
            setBooks(bList);
            setChapters(cList);

            // Fetch page counts for all chapters
            const pCounts: Record<string, number> = {};
            await Promise.all(
                cList.map(async (c) => {
                    const pages = await adminPageService.getByChapter(c.id);
                    pCounts[c.id] = pages.length;
                })
            );
            setPagesMap(pCounts);
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load chapters.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedBookId]);

    const openCreateModal = () => {
        setEditingChapter(null);
        const bookId = selectedBookId || books[0]?.id || '';
        setFormBookId(bookId);
        const currentCount = chapters.filter(c => !selectedBookId || c.book_id === bookId).length;
        setFormChapterNo(currentCount + 1);
        setFormTitle(`Chapter ${currentCount + 1}: `);
        setFormAccessType('FREE');
        setFormCoinCost(0);
        setFormFreePages(1);
        setModalOpen(true);
    };

    const openEditModal = (ch: Chapter) => {
        setEditingChapter(ch);
        setFormBookId(ch.book_id);
        setFormChapterNo(ch.chapter_no);
        setFormTitle(ch.title);
        setFormAccessType(ch.access_type);
        setFormCoinCost(ch.coin_cost);
        setFormFreePages(ch.free_pages || 1);
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
                    book_id: formBookId,
                    chapter_no: Number(formChapterNo),
                    title: formTitle,
                    access_type: formAccessType,
                    coin_cost: formAccessType === 'FREE' ? 0 : Number(formCoinCost),
                    free_pages: Number(formFreePages)
                });
                setSuccessMessage(`Chapter "${formTitle}" updated.`);
            } else {
                await adminChapterService.create({
                    book_id: formBookId,
                    chapter_no: Number(formChapterNo),
                    title: formTitle,
                    access_type: formAccessType,
                    coin_cost: formAccessType === 'FREE' ? 0 : Number(formCoinCost),
                    free_pages: Number(formFreePages)
                });
                setSuccessMessage(`Chapter "${formTitle}" created.`);
            }
            setModalOpen(false);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save chapter.');
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
            setErrorMessage(err.message || 'Failed to delete chapter.');
        }
    };

    const filteredChapters = chapters.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getBookTitle = (bookId: string) => {
        const b = books.find((item) => item.id === bookId);
        return b ? b.title : 'Unassigned Book';
    };

    return (
        <div>
            <PageHeader
                title="Chapter & Content Management"
                subtitle="Configure chapter pricing, access models (Free / Paid / Partial), and manage DRM pages."
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
                    placeholder="Search chapters by title..."
                />

                <div className={styles.filterGroup}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Book:</label>
                    <select
                        className={styles.selectInput}
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
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
                ) : filteredChapters.length === 0 ? (
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
                                    <th>Access Model</th>
                                    <th>Coin Price</th>
                                    <th>Created Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChapters.map((ch) => {
                                    const pageCount = pagesMap[ch.id] || 0;
                                    const isPaid = ch.access_type === 'PAID' || ch.coin_cost > 0;

                                    return (
                                        <tr key={ch.id}>
                                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                                                Ch. {ch.chapter_no}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{ch.title}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {ch.id}</div>
                                            </td>
                                            <td>{getBookTitle(ch.book_id)}</td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: pageCount > 0 ? 'var(--color-text-primary)' : 'var(--text-muted)' }}>
                                                    {pageCount} page(s)
                                                </span>
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
                                                {ch.coin_cost > 0 ? (
                                                    <StatusBadge status={`${ch.coin_cost} Coins`} type="coin" />
                                                ) : (
                                                    <StatusBadge status="0 Coins" type="info" />
                                                )}
                                            </td>
                                            <td style={{ fontSize: '12px' }}>
                                                {new Date(ch.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <button
                                                        className={styles.btnSecondary}
                                                        style={{ padding: '6px 10px', fontSize: '12px' }}
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
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="Read in Reader"
                                                        onClick={() => navigate(`/reader/${ch.book_id}/${ch.id}`)}
                                                    >
                                                        <ExternalLink size={14} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        style={{ color: '#ef4444' }}
                                                        title="Delete Chapter"
                                                        onClick={() => setDeleteTarget(ch)}
                                                    >
                                                        <Trash2 size={14} />
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
                        <label className={styles.formLabel}>Parent Book / Volume *</label>
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
                                onChange={(e) => setFormChapterNo(parseInt(e.target.value) || 1)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Access Model</label>
                            <select
                                className={styles.formSelect}
                                value={formAccessType}
                                onChange={(e) => {
                                    const val = e.target.value as 'FREE' | 'PARTIAL' | 'PAID';
                                    setFormAccessType(val);
                                    if (val === 'FREE') setFormCoinCost(0);
                                    else if (formCoinCost === 0) setFormCoinCost(1);
                                }}
                            >
                                <option value="FREE">FREE (0 Coins)</option>
                                <option value="PAID">PAID (Coin Unlock Required)</option>
                                <option value="PARTIAL">PARTIAL (Preview Pages Free)</option>
                            </select>
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

                    {formAccessType !== 'FREE' && (
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Unlock Cost (Coins)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className={styles.formInput}
                                    value={formCoinCost}
                                    onChange={(e) => setFormCoinCost(parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Free Preview Pages</label>
                                <input
                                    type="number"
                                    min={0}
                                    className={styles.formInput}
                                    value={formFreePages}
                                    onChange={(e) => setFormFreePages(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                    )}
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Chapter"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? All uploaded pages in this chapter will also be removed.`}
                confirmText="Delete Chapter"
            />
        </div>
    );
};
