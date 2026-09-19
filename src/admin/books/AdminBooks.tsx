import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Edit2,
    Trash2,
    ExternalLink,
    BookOpen,
    FileText,
    FileImage,
    Archive,
    CheckCircle2,
    Clock,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    Sparkles
} from 'lucide-react';
import {
    adminBookService,
    adminSeriesService,
    adminVolumeService,
    adminChapterService
} from '../../services/admin/adminServices';
import type { Book, BookSeries, Volume } from '../../types';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    ConfirmDialog,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import { AddBookChoiceModal } from './AddBookChoiceModal';
import styles from '../components/AdminUI.module.css';

export const AdminBooks: React.FC = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [seriesList, setSeriesList] = useState<BookSeries[]>([]);
    const [volumesList, setVolumesList] = useState<Volume[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [seriesFilter, setSeriesFilter] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');
    const [pricingFilter, setPricingFilter] = useState('');
    const [sortBy, setSortBy] = useState<'updated_at' | 'title' | 'chapter_count'>('updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    // Feedback states
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Add Book choice modal
    const [choiceModalOpen, setChoiceModalOpen] = useState(false);

    // Delete / Archive confirmation
    const [confirmAction, setConfirmAction] = useState<{
        type: 'delete' | 'archive';
        book: Book;
    } | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [bList, sList, vList] = await Promise.all([
                adminBookService.getAll({
                    search: searchQuery,
                    status: statusFilter,
                    seriesId: seriesFilter,
                    language: languageFilter,
                    pricingModel: pricingFilter,
                    sortBy,
                    sortOrder
                }),
                adminSeriesService.getAll(),
                adminVolumeService.getAll()
            ]);
            setBooks(bList);
            setSeriesList(sList);
            setVolumesList(vList);
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load books catalog.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchQuery, statusFilter, seriesFilter, languageFilter, pricingFilter, sortBy, sortOrder]);

    const handleTogglePublish = async (book: Book) => {
        try {
            const updated = await adminBookService.togglePublish(book.id);
            setSuccessMessage(`Book "${updated.title}" status changed to ${updated.status}.`);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update publishing status.');
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;
        try {
            if (confirmAction.type === 'archive') {
                await adminBookService.archive(confirmAction.book.id);
                setSuccessMessage(`Book "${confirmAction.book.title}" archived.`);
            } else {
                await adminBookService.delete(confirmAction.book.id);
                setSuccessMessage(`Book "${confirmAction.book.title}" deleted.`);
            }
            setConfirmAction(null);
            loadData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Action failed.');
        }
    };

    const getSeriesTitle = (seriesId: string) => {
        const s = seriesList.find((item) => item.id === seriesId);
        return s ? s.title : 'Direct Catalog';
    };

    const getVolumeTitle = (volumeId?: string | null) => {
        if (!volumeId) return 'Direct Book (No Volume)';
        const v = volumesList.find((item) => item.id === volumeId);
        return v ? `Vol. ${v.volume_no}: ${v.title}` : 'Volume Release';
    };

    // Pagination slice
    const totalPages = Math.ceil(books.length / pageSize) || 1;
    const paginatedBooks = books.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div>
            <PageHeader
                title="Book Catalog Management"
                subtitle="Primary workspace for manga books, multi-chapter releases, volume hierarchy, and publishing lifecycle."
                actions={
                    <button
                        className={styles.btnPrimary}
                        onClick={() => setChoiceModalOpen(true)}
                    >
                        <Plus size={16} /> + Add Book
                    </button>
                }
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            {/* Filter and Search Bar */}
            <div className={styles.filterBar}>
                <SearchBar
                    value={searchQuery}
                    onChange={(val) => {
                        setSearchQuery(val);
                        setCurrentPage(1);
                    }}
                    placeholder="Search books by title, author, or synopsis..."
                />

                <div className={styles.filterGroup}>
                    {/* Series Filter */}
                    <select
                        className={styles.selectInput}
                        value={seriesFilter}
                        onChange={(e) => {
                            setSeriesFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Series ({seriesList.length})</option>
                        {seriesList.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.title}
                            </option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        className={styles.selectInput}
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Statuses</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="READY">READY</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                    </select>

                    {/* Language Filter */}
                    <select
                        className={styles.selectInput}
                        value={languageFilter}
                        onChange={(e) => {
                            setLanguageFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Languages</option>
                        <option value="English">English</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                    </select>

                    {/* Pricing Filter */}
                    <select
                        className={styles.selectInput}
                        value={pricingFilter}
                        onChange={(e) => {
                            setPricingFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Pricing</option>
                        <option value="FREE">FREE</option>
                        <option value="PER_CHAPTER">PER_CHAPTER</option>
                        <option value="PER_PAGE">PER_PAGE</option>
                        <option value="PER_BOOK">PER_BOOK</option>
                        <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    </select>

                    {/* Sort */}
                    <select
                        className={styles.selectInput}
                        value={`${sortBy}:${sortOrder}`}
                        onChange={(e) => {
                            const [by, order] = e.target.value.split(':');
                            setSortBy(by as any);
                            setSortOrder(order as any);
                        }}
                    >
                        <option value="updated_at:desc">Recently Updated</option>
                        <option value="title:asc">Title (A-Z)</option>
                        <option value="chapter_count:desc">Most Chapters</option>
                    </select>
                </div>
            </div>

            {/* Books Listing Table */}
            <div className={styles.tableCard}>
                {loading ? (
                    <LoadingState message="Loading manga books..." />
                ) : paginatedBooks.length === 0 ? (
                    <EmptyState
                        title="No books found"
                        description={searchQuery || statusFilter || seriesFilter ? 'No books match the filter criteria.' : 'Create your first manga book using our manual wizard or package uploader.'}
                        action={
                            <button className={styles.btnPrimary} onClick={() => setChoiceModalOpen(true)}>
                                <Plus size={14} /> + Add Book
                            </button>
                        }
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Cover</th>
                                    <th>Title & Metadata</th>
                                    <th>Parent Series / Volume</th>
                                    <th>Pricing Model</th>
                                    <th>Chapters & Pages</th>
                                    <th>Status</th>
                                    <th>Updated</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedBooks.map((b) => (
                                    <tr key={b.id}>
                                        <td>
                                            <img
                                                src={b.cover_image || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=100'}
                                                alt={b.title}
                                                className={styles.tableCoverThumb}
                                                style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }}
                                            />
                                        </td>
                                        <td>
                                            <div
                                                style={{ fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}
                                                onClick={() => navigate(`/admin/books/${b.id}`)}
                                            >
                                                {b.title}
                                            </div>
                                            {b.japanese_title && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.japanese_title}</div>
                                            )}
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {b.language || 'English'} • {b.author || 'Manga Author'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>
                                                {getSeriesTitle(b.series_id)}
                                            </div>
                                            <div style={{ fontSize: '11px', color: b.volume_id ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                {getVolumeTitle(b.volume_id)}
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge
                                                status={b.pricing_model || (b.coin_price > 0 ? 'PER_BOOK' : 'FREE')}
                                                type={b.pricing_model === 'FREE' ? 'info' : 'coin'}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>
                                                {b.chapter_count || 0} Ch.
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                {b.page_count || 0} pages
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(b.updated_at || b.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="Manage Book Workspace"
                                                    onClick={() => navigate(`/admin/books/${b.id}`)}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="View Reader"
                                                    onClick={() => navigate(`/book/${b.series_id}`)}
                                                >
                                                    <ExternalLink size={13} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    title={b.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                                    onClick={() => handleTogglePublish(b)}
                                                >
                                                    <CheckCircle2 size={13} color={b.status === 'PUBLISHED' ? '#10b981' : 'var(--text-muted)'} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="Archive Book"
                                                    onClick={() => setConfirmAction({ type: 'archive', book: b })}
                                                >
                                                    <Archive size={13} />
                                                </button>
                                                <button
                                                    className={styles.btnIcon}
                                                    style={{ color: '#ef4444' }}
                                                    title="Delete Book"
                                                    onClick={() => setConfirmAction({ type: 'delete', book: b })}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {books.length > pageSize && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, books.length)} of {books.length} books
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className={styles.btnSecondary}
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className={styles.btnSecondary}
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* "+ Add Book" choice modal */}
            <AddBookChoiceModal
                isOpen={choiceModalOpen}
                onClose={() => setChoiceModalOpen(false)}
            />

            {/* Delete / Archive Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirmAction}
                title={confirmAction?.type === 'archive' ? 'Archive Book' : 'Delete Book'}
                message={
                    confirmAction?.type === 'archive'
                        ? `Are you sure you want to archive "${confirmAction?.book.title}"? This will hide the book from readers but preserve its contents.`
                        : `Are you sure you want to permanently delete "${confirmAction?.book.title}"? This action cannot be undone.`
                }
                danger={confirmAction?.type === 'delete'}
                confirmText={confirmAction?.type === 'archive' ? 'Archive Book' : 'Delete Permanently'}
            />
        </div>
    );
};
