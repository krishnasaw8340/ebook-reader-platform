import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    ExternalLink,
    RefreshCw,
    BookOpen,
    Filter
} from 'lucide-react';
import {
    adminBookService,
    adminSeriesService
} from '../../services/admin/adminServices';
import type { Book, BookSeries } from '../../types';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    Modal,
    ConfirmDialog,
    FileUploadDropzone,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

export const AdminBooks: React.FC = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [seriesFilter, setSeriesFilter] = useState('');

    // Feedback states
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Modal state for Create / Edit
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<Book | null>(null);
    const [formSeriesId, setFormSeriesId] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formSummary, setFormSummary] = useState('');
    const [formCoverImage, setFormCoverImage] = useState('');
    const [formCoinPrice, setFormCoinPrice] = useState(0);
    const [formStatus, setFormStatus] = useState<'ONGOING' | 'COMPLETED'>('ONGOING');

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bList, sList] = await Promise.all([
                adminBookService.getAll({ search: searchQuery, status: statusFilter, seriesId: seriesFilter }),
                adminSeriesService.getAll()
            ]);
            setBooks(bList);
            setSeriesList(sList);
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load books list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchQuery, statusFilter, seriesFilter]);

    const openCreateModal = () => {
        setEditingBook(null);
        setFormSeriesId(seriesList[0]?.id || '');
        setFormTitle('');
        setFormSummary('');
        setFormCoverImage('https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400');
        setFormCoinPrice(0);
        setFormStatus('ONGOING');
        setModalOpen(true);
    };

    const openEditModal = (book: Book) => {
        setEditingBook(book);
        setFormSeriesId(book.series_id);
        setFormTitle(book.title);
        setFormSummary(book.summary || '');
        setFormCoverImage(book.cover_image || '');
        setFormCoinPrice(book.coin_price || 0);
        setFormStatus(book.status || 'ONGOING');
        setModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!formTitle.trim()) {
            setErrorMessage('Book title is required.');
            return;
        }

        try {
            if (editingBook) {
                await adminBookService.update(editingBook.id, {
                    series_id: formSeriesId,
                    title: formTitle,
                    summary: formSummary,
                    cover_image: formCoverImage,
                    coin_price: Number(formCoinPrice),
                    status: formStatus
                });
                setSuccessMessage(`Book "${formTitle}" updated successfully.`);
            } else {
                await adminBookService.create({
                    series_id: formSeriesId,
                    title: formTitle,
                    summary: formSummary,
                    cover_image: formCoverImage,
                    coin_price: Number(formCoinPrice),
                    status: formStatus
                });
                setSuccessMessage(`Book "${formTitle}" created successfully.`);
            }
            setModalOpen(false);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to save book.');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminBookService.delete(deleteTarget.id);
            setSuccessMessage(`Book "${deleteTarget.title}" deleted.`);
            setDeleteTarget(null);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to delete book.');
        }
    };

    const getSeriesTitle = (seriesId: string) => {
        const s = seriesList.find((item) => item.id === seriesId);
        return s ? s.title : 'Unassigned Series';
    };

    return (
        <div>
            <PageHeader
                title="Book & Volume Management"
                subtitle="Manage manga volumes, cover artworks, pricing, and publication statuses."
                actions={
                    <button className={styles.btnPrimary} onClick={openCreateModal}>
                        <Plus size={16} /> Create Book
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Filter and Search Bar */}
            <div className={styles.filterBar}>
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search books by title or summary..."
                />

                <div className={styles.filterGroup}>
                    <select
                        className={styles.selectInput}
                        value={seriesFilter}
                        onChange={(e) => setSeriesFilter(e.target.value)}
                    >
                        <option value="">All Series</option>
                        {seriesList.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                    </select>

                    <select
                        className={styles.selectInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="ONGOING">ONGOING</option>
                        <option value="COMPLETED">COMPLETED</option>
                    </select>
                </div>
            </div>

            {/* Books Table */}
            <div className={styles.tableCard}>
                {loading ? (
                    <LoadingState message="Loading manga books..." />
                ) : books.length === 0 ? (
                    <EmptyState
                        title="No books found"
                        description={searchQuery || statusFilter || seriesFilter ? 'No books matched the filter criteria.' : 'Start by creating your first manga book volume.'}
                        action={
                            <button className={styles.btnPrimary} onClick={openCreateModal}>
                                <Plus size={14} /> Create Book
                            </button>
                        }
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Cover</th>
                                    <th>Title</th>
                                    <th>Parent Series</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map((b) => (
                                    <tr key={b.id}>
                                        <td>
                                            <img
                                                src={b.cover_image || ''}
                                                alt={b.title}
                                                className={styles.tableCoverThumb}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: '#ffffff' }}>{b.title}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {b.summary || 'No synopsis provided'}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                {getSeriesTitle(b.series_id)}
                                            </span>
                                        </td>
                                        <td>
                                            {b.coin_price > 0 ? (
                                                <StatusBadge status={`${b.coin_price} Coins`} type="coin" />
                                            ) : (
                                                <StatusBadge status="FREE" type="info" />
                                            )}
                                        </td>
                                        <td>
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td style={{ fontSize: '12px' }}>
                                            {new Date(b.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="Edit Book"
                                                    onClick={() => openEditModal(b)}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="View in Reader"
                                                    onClick={() => navigate(`/book/${b.series_id}`)}
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    style={{ color: '#ef4444' }}
                                                    title="Delete Book"
                                                    onClick={() => setDeleteTarget(b)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingBook ? `Edit Book: ${editingBook.title}` : 'Create New Book Volume'}
                footer={
                    <>
                        <button className={styles.btnSecondary} onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button className={styles.btnPrimary} onClick={handleFormSubmit}>
                            {editingBook ? 'Save Changes' : 'Create Book'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleFormSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Parent Series *</label>
                        <select
                            className={styles.formSelect}
                            value={formSeriesId}
                            onChange={(e) => setFormSeriesId(e.target.value)}
                            required
                        >
                            {seriesList.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Book Title *</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="e.g. Volume 1: Reality Cracks"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Price (Coins)</label>
                            <input
                                type="number"
                                min={0}
                                className={styles.formInput}
                                value={formCoinPrice}
                                onChange={(e) => setFormCoinPrice(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Publishing Status</label>
                            <select
                                className={styles.formSelect}
                                value={formStatus}
                                onChange={(e) => setFormStatus(e.target.value as 'ONGOING' | 'COMPLETED')}
                            >
                                <option value="ONGOING">ONGOING</option>
                                <option value="COMPLETED">COMPLETED</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Summary / Synopsis</label>
                        <textarea
                            className={styles.formTextarea}
                            rows={3}
                            placeholder="Plot summary for this volume..."
                            value={formSummary}
                            onChange={(e) => setFormSummary(e.target.value)}
                        />
                    </div>

                    <FileUploadDropzone
                        label="Book Cover Artwork"
                        currentUrl={formCoverImage}
                        onFileSelected={(url) => setFormCoverImage(url)}
                    />
                </form>
            </Modal>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Book Volume"
                message={`Are you sure you want to permanently delete "${deleteTarget?.title}"? This action cannot be undone.`}
                confirmText="Delete Book"
            />
        </div>
    );
};
