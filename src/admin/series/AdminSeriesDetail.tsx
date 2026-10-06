import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Layers,
    FolderKanban,
    BookOpen,
    FileText,
    FileImage,
    Plus,
    ExternalLink,
    Edit2,
    Archive
} from 'lucide-react';
import {
    adminSeriesService,
    adminVolumeService,
    adminBookService,
    adminChapterService
} from '../../services/admin/adminServices';
import type { BookSeries, Volume, Book, Chapter } from '../../types';
import {
    PageHeader,
    StatusBadge,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from '../books/AdminBookDetail.module.css';
import uiStyles from '../components/AdminUI.module.css';

export const AdminSeriesDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [series, setSeries] = useState<BookSeries | null>(null);
    const [volumes, setVolumes] = useState<Volume[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadSeriesData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [s, vList, bList, cList] = await Promise.all([
                adminSeriesService.getById(id),
                adminVolumeService.getAll(id),
                adminBookService.getAll({ seriesId: id }),
                adminChapterService.getAll()
            ]);
            setSeries(s || null);
            setVolumes(vList);
            setBooks(bList);
            setChapters(cList);
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to load series details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSeriesData();
    }, [id]);

    if (loading) {
        return <LoadingState message="Loading franchise series..." />;
    }

    if (!series) {
        return (
            <EmptyState
                title="Series Not Found"
                description="The requested franchise series does not exist."
                action={
                    <button className={uiStyles.btnPrimary} onClick={() => navigate('/admin/series')}>
                        Return to Series Catalog
                    </button>
                }
            />
        );
    }

    const seriesBookIds = books.map(b => b.id);
    const seriesChapters = chapters.filter(c => seriesBookIds.includes(c.book_id));
    const directBooksWithoutVolume = books.filter(b => !b.volume_id);

    return (
        <div className={styles.container}>
            <PageHeader
                title={`Franchise: ${series.title}`}
                subtitle="Franchise breakdown showing official volumes and direct standalone releases."
                breadcrumbs={[
                    { label: 'Admin', path: '/admin/dashboard' },
                    { label: 'Series', path: '/admin/series' },
                    { label: series.title }
                ]}
                actions={
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className={uiStyles.btnSecondary} onClick={() => navigate('/admin/series')}>
                            <ArrowLeft size={16} /> All Series
                        </button>
                        <button className={uiStyles.btnSecondary} onClick={() => navigate(`/book/${series.id}`)}>
                            <ExternalLink size={14} /> Reader Storefront
                        </button>
                        <button className={uiStyles.btnPrimary} onClick={() => navigate('/admin/books/new')}>
                            <Plus size={14} /> Add Book to Series
                        </button>
                    </div>
                }
            />

            {errorMessage && <ErrorBanner message={errorMessage} />}
            {successMessage && <SuccessBanner message={successMessage} />}

            {/* Franchise Header Card */}
            <div className={styles.headerCard}>
                <div style={{ width: '120px', height: '170px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                    {series.cover_image || books[0]?.coverUrl || books[0]?.cover_image ? (
                        <img
                            src={series.cover_image || books[0]?.coverUrl || books[0]?.cover_image || ''}
                            alt={series.title}
                            className={styles.coverThumb}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center' }}>No cover</div>
                    )}
                </div>

                <div className={styles.headerInfo}>
                    <div className={styles.headerTitleRow}>
                        <h1 className={styles.bookTitle}>{series.title}</h1>
                        <StatusBadge status={series.status} />
                    </div>

                    {series.slug && (
                        <div style={{ fontSize: '12px', color: 'var(--color-brand-primary)', fontFamily: 'monospace', marginBottom: '8px' }}>
                            Slug: /{series.slug}
                        </div>
                    )}

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                        {series.description || 'No franchise synopsis recorded.'}
                    </p>

                    {/* Metric Counts */}
                    {/* Metric Counts */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaItem}>
                            <span>Total Books:</span> <strong>{books.length}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Total Chapters:</span> <strong>{seriesChapters.length}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Status:</span> <strong>{series.status}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Structure Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '20px' }}>
                {/* 1. Books / Releases Section */}
                <div className={uiStyles.tableCard}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Books & Releases ({books.length})</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Manga book releases attached to this series</p>
                        </div>
                        <button
                            className={uiStyles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => navigate('/admin/books/new')}
                        >
                            + Add Book
                        </button>
                    </div>

                    <div className={uiStyles.tableWrapper}>
                        <table className={uiStyles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Book Title</th>
                                    <th>Language</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.length > 0 ? (
                                    books.map(b => (
                                        <tr key={b.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{b.title}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.chapter_count || 0} chapters</div>
                                            </td>
                                            <td>{b.language || 'English'}</td>
                                            <td><StatusBadge status={b.status} /></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className={uiStyles.btnIcon}
                                                    title="Manage Book"
                                                    onClick={() => navigate(`/admin/books/${b.id}`)}
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No books created for this series.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Chapters Section */}
                <div className={uiStyles.tableCard}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Chapters ({seriesChapters.length})</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Published and draft chapters</p>
                        </div>
                        <button
                            className={uiStyles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => navigate('/admin/chapters')}
                        >
                            Manage Chapters
                        </button>
                    </div>

                    <div className={uiStyles.tableWrapper}>
                        <table className={uiStyles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Ch #</th>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {seriesChapters.length > 0 ? (
                                    seriesChapters.slice(0, 10).map(c => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 800, color: 'var(--primary)' }}>#{c.chapter_no}</td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{c.title}</span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: c.access_type === 'FREE' ? '#10b981' : '#f59e0b' }}>
                                                    {c.access_type}
                                                </span>
                                            </td>
                                            <td>{c.access_type === 'FREE' ? '0 Coins' : `${c.coin_cost} Coins`}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No chapters found for this series.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
