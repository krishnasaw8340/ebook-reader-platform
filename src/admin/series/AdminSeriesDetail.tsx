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
    adminChapterService,
    adminPageService
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
                actions={
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className={uiStyles.btnSecondary} onClick={() => navigate('/admin/series')}>
                            <ArrowLeft size={16} /> All Series
                        </button>
                        <button className={uiStyles.btnSecondary} onClick={() => navigate(`/book/${series.id}`)}>
                            <ExternalLink size={14} /> Reader Storefront
                        </button>
                        <button className={uiStyles.btnPrimary} onClick={() => navigate('/admin/books/new')}>
                            <Plus size={14} /> + Add Book to Series
                        </button>
                    </div>
                }
            />

            {errorMessage && <ErrorBanner message={errorMessage} />}
            {successMessage && <SuccessBanner message={successMessage} />}

            {/* Franchise Header Card */}
            <div className={styles.headerCard}>
                <img
                    src={series.cover_image || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=200'}
                    alt={series.title}
                    className={styles.coverThumb}
                />

                <div className={styles.headerInfo}>
                    <div className={styles.headerTitleRow}>
                        <h1 className={styles.bookTitle}>{series.title}</h1>
                        <StatusBadge status={series.status} />
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                        {series.description || 'No franchise synopsis recorded.'}
                    </p>

                    {/* Metric Counts */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaItem}>
                            <span>Volumes:</span> <strong>{volumes.length}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Total Books:</span> <strong>{books.length}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Total Chapters:</span> <strong>{seriesChapters.length}</strong>
                        </div>
                        <div className={styles.metaItem}>
                            <span>Direct Books (No Vol):</span> <strong>{directBooksWithoutVolume.length}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Structure Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))', gap: '20px' }}>
                {/* 1. Volumes Section */}
                <div className={uiStyles.tableCard}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Volumes ({volumes.length})</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Structured book compilations</p>
                        </div>
                        <button
                            className={uiStyles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => navigate('/admin/volumes')}
                        >
                            Manage Volumes
                        </button>
                    </div>

                    <div className={uiStyles.tableWrapper}>
                        <table className={uiStyles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Vol #</th>
                                    <th>Title</th>
                                    <th>Books</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {volumes.length > 0 ? (
                                    volumes.map(v => {
                                        const booksInVol = books.filter(b => b.volume_id === v.id);
                                        return (
                                            <tr key={v.id}>
                                                <td style={{ fontWeight: 800, color: 'var(--primary)' }}>Vol. {v.volume_no}</td>
                                                <td>
                                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v.title}</span>
                                                </td>
                                                <td>{booksInVol.length} Book(s)</td>
                                                <td><StatusBadge status={v.status} /></td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No volumes created for this series.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Direct Books (Without Volume) */}
                <div className={uiStyles.tableCard}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Direct Books ({directBooksWithoutVolume.length})</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Books attached directly to series without volume</p>
                        </div>
                        <button
                            className={uiStyles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            onClick={() => navigate('/admin/books/new')}
                        >
                            + Add Direct Book
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
                                {directBooksWithoutVolume.length > 0 ? (
                                    directBooksWithoutVolume.map(b => (
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
                                            No direct standalone books. All books belong to volumes.
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
