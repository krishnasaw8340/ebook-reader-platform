import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Layers,
    FolderKanban,
    FileText,
    FileImage,
    CheckCircle2,
    Clock,
    UploadCloud,
    AlertTriangle,
    Plus,
    ArrowUpRight,
    ExternalLink
} from 'lucide-react';
import {
    adminDashboardService,
    type DashboardStats
} from '../../services/admin/adminServices';
import {
    PageHeader,
    StatCard,
    LoadingState,
    ErrorBanner,
    StatusBadge
} from '../components/AdminUI';
import { AddBookChoiceModal } from '../books/AddBookChoiceModal';
import styles from '../components/AdminUI.module.css';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [choiceModalOpen, setChoiceModalOpen] = useState(false);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminDashboardService.getStats();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Unable to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    if (loading) {
        return <LoadingState message="Loading catalog metrics and publishing activity..." />;
    }

    return (
        <div>
            <PageHeader
                title="Admin Publishing Dashboard"
                subtitle="High-level catalog hierarchy, ingestion queue health, and digital manga publications."
                actions={
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => navigate('/admin/uploads')}
                        >
                            <UploadCloud size={14} /> Uploads Monitor
                        </button>
                        <button
                            className={styles.btnPrimary}
                            onClick={() => setChoiceModalOpen(true)}
                        >
                            <Plus size={14} /> Add Book
                        </button>
                    </div>
                }
            />

            {error && <ErrorBanner message={error} />}

            {/* 9 Content-Management Metric KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
                gap: '14px',
                marginBottom: '24px'
            }}>
                <StatCard
                    title="Total Series"
                    value={stats?.totalSeries || 0}
                    icon={<Layers size={18} />}
                    subtitle="Franchise series"
                    trendColor="#8b5cf6"
                />
                <StatCard
                    title="Total Volumes"
                    value={stats?.totalVolumes || 0}
                    icon={<FolderKanban size={18} />}
                    subtitle="Compiled volumes"
                    trendColor="#ec4899"
                />
                <StatCard
                    title="Total Books"
                    value={stats?.totalBooks || 0}
                    icon={<BookOpen size={18} />}
                    subtitle="All catalog titles"
                    trendColor="#3b82f6"
                />
                <StatCard
                    title="Total Chapters"
                    value={stats?.totalChapters || 0}
                    icon={<FileText size={18} />}
                    subtitle="Across all books"
                    trendColor="#10b981"
                />
                <StatCard
                    title="Total Pages"
                    value={stats?.totalPages || 0}
                    icon={<FileImage size={18} />}
                    subtitle="DRM-optimized pages"
                    trendColor="#06b6d4"
                />
                <StatCard
                    title="Published Books"
                    value={stats?.publishedBooks || 0}
                    icon={<CheckCircle2 size={18} />}
                    subtitle="Live to readers"
                    trendColor="#22c55e"
                />
                <StatCard
                    title="Draft Books"
                    value={stats?.draftBooks || 0}
                    icon={<Clock size={18} />}
                    subtitle="In progress / review"
                    trendColor="#f59e0b"
                />
                <StatCard
                    title="Processing Uploads"
                    value={stats?.processingUploads || 0}
                    icon={<UploadCloud size={18} />}
                    subtitle="Ingestion jobs active"
                    trendColor="#3b82f6"
                />
                <StatCard
                    title="Failed Uploads"
                    value={stats?.failedUploads || 0}
                    icon={<AlertTriangle size={18} />}
                    subtitle="Requires attention"
                    trendColor="#ef4444"
                />
            </div>

            {/* 3 Content Activity Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
                {/* 1. Recent Books */}
                <div className={styles.tableCard}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent Books</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Latest additions to the book catalog</p>
                        </div>
                        <button
                            className={styles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                            onClick={() => navigate('/admin/books')}
                        >
                            View All <ArrowUpRight size={12} />
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={`${styles.dataTable} ${styles.compactTable}`}>
                            <thead>
                                <tr>
                                    <th>Book</th>
                                    <th>Series</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentBooks && stats.recentBooks.length > 0 ? (
                                    stats.recentBooks.map((b) => (
                                        <tr key={b.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {b.coverImage ? (
                                                        <img
                                                            src={b.coverImage}
                                                            alt={b.title}
                                                            style={{ width: '32px', height: '44px', objectFit: 'cover', borderRadius: '4px' }}
                                                        />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '44px', background: '#222', borderRadius: '4px' }} />
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: '13px' }}>{b.title}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.chapterCount} chapters</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{b.seriesTitle}</td>
                                            <td><StatusBadge status={b.status} /></td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className={styles.btnIcon}
                                                    title="Manage Book"
                                                    onClick={() => navigate(`/admin/books/${b.id}`)}
                                                >
                                                    <ExternalLink size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No recent books found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Recent Uploads & Ingestion */}
                <div className={styles.tableCard}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent Uploads</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ZIP batch ingestion jobs</p>
                        </div>
                        <button
                            className={styles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                            onClick={() => navigate('/admin/uploads')}
                        >
                            View All <ArrowUpRight size={12} />
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={`${styles.dataTable} ${styles.compactTable}`}>
                            <thead>
                                <tr>
                                    <th>Package / Book</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentUploads && stats.recentUploads.length > 0 ? (
                                    stats.recentUploads.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>{u.bookTitle}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.fileName}</div>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.stage}</span>
                                                <div style={{ width: '60px', height: '4px', background: 'var(--color-border-default)', borderRadius: '2px', marginTop: '4px' }}>
                                                    <div style={{ width: `${u.progress}%`, height: '100%', background: u.status === 'FAILED' ? '#ef4444' : u.status === 'COMPLETED' ? '#10b981' : 'var(--color-primary)', borderRadius: '2px' }} />
                                                </div>
                                            </td>
                                            <td><StatusBadge status={u.status} /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No recent upload jobs.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. Recently Updated Chapters */}
                <div className={styles.tableCard}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Recently Updated Chapters</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Latest chapter revisions & pricing</p>
                        </div>
                        <button
                            className={styles.btnSecondary}
                            style={{ padding: '4px 10px', fontSize: '11px', height: '28px' }}
                            onClick={() => navigate('/admin/chapters')}
                        >
                            View All <ArrowUpRight size={12} />
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={`${styles.dataTable} ${styles.compactTable}`}>
                            <thead>
                                <tr>
                                    <th>Chapter</th>
                                    <th>Book</th>
                                    <th>Access</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentlyUpdatedChapters && stats.recentlyUpdatedChapters.length > 0 ? (
                                    stats.recentlyUpdatedChapters.map((c) => (
                                        <tr key={c.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '13px' }}>Ch. {c.chapterNo}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.title}</div>
                                            </td>
                                            <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.bookTitle}</td>
                                            <td>
                                                {c.coinCost > 0 ? (
                                                    <StatusBadge status={`${c.coinCost} Coins`} type="coin" />
                                                ) : (
                                                    <StatusBadge status="FREE" type="info" />
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No recent chapters recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* "+ Add Book" choice modal */}
            <AddBookChoiceModal
                isOpen={choiceModalOpen}
                onClose={() => setChoiceModalOpen(false)}
            />
        </div>
    );
};
