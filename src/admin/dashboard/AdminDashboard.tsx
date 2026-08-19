import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    BookOpen,
    Layers,
    FileText,
    Coins,
    TrendingUp,
    Plus,
    UploadCloud,
    ArrowUpRight,
    CheckCircle2
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
import styles from '../components/AdminUI.module.css';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        return <LoadingState message="Loading platform metrics and dashboard data..." />;
    }

    return (
        <div>
            <PageHeader
                title="Admin Dashboard"
                subtitle="Overview of platform catalog, users, reader activity, and digital manga publications."
                actions={
                    <>
                        <button className={styles.btnSecondary} onClick={() => navigate('/admin/pages')}>
                            <UploadCloud size={14} /> Page Compiler
                        </button>
                        <button className={styles.btnPrimary} onClick={() => navigate('/admin/books')}>
                            <Plus size={14} /> Create Book
                        </button>
                    </>
                }
            />

            {error && <ErrorBanner message={error} />}

            {/* KPI Metrics Grid */}
            <div className={styles.statGrid}>
                <StatCard
                    title="Total Registered Users"
                    value={stats?.totalUsers || 0}
                    icon={<Users size={20} />}
                    subtitle={`${stats?.totalActiveUsers || 0} active reading sessions`}
                    trendColor="#3b82f6"
                />
                <StatCard
                    title="Manga Series"
                    value={stats?.totalSeries || 0}
                    icon={<Layers size={20} />}
                    subtitle="Ongoing & completed titles"
                    trendColor="#8b5cf6"
                />
                <StatCard
                    title="Published Books"
                    value={stats?.totalBooks || 0}
                    icon={<BookOpen size={20} />}
                    subtitle={`${stats?.totalPublishedBooks || 0} live in catalog`}
                    trendColor="#10b981"
                />
                <StatCard
                    title="Total Chapters"
                    value={stats?.totalChapters || 0}
                    icon={<FileText size={20} />}
                    subtitle={`${stats?.totalPages || 0} optimized DRM pages`}
                    trendColor="#f59e0b"
                />
                <StatCard
                    title="Coins Economy"
                    value={`${stats?.totalCoinsCirculating?.toLocaleString() || 0} 🪙`}
                    icon={<Coins size={20} />}
                    subtitle={`$${stats?.totalRevenue?.toFixed(2) || '0.00'} est. revenue`}
                    trendColor="#ffd700"
                />
            </div>

            {/* Content Tables Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
                {/* Recent Series / Catalog Additions */}
                <div className={styles.tableCard}>
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Recent Manga Series</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Latest catalog entries added</p>
                        </div>
                        <button
                            className={styles.btnSecondary}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => navigate('/admin/series')}
                        >
                            View All <ArrowUpRight size={12} />
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentContent && stats.recentContent.length > 0 ? (
                                    stats.recentContent.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 600, color: '#ffffff' }}>{item.title}</td>
                                            <td><StatusBadge status={item.status} /></td>
                                            <td style={{ fontSize: '12px' }}>{new Date(item.date).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No series entries recorded yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Users Overview */}
                <div className={styles.tableCard}>
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Recent Users & Staff</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Registered accounts & roles</p>
                        </div>
                        <button
                            className={styles.btnSecondary}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => navigate('/admin/users')}
                        >
                            View All <ArrowUpRight size={12} />
                        </button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                                    stats.recentUsers.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#ffffff' }}>{u.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                                            </td>
                                            <td><StatusBadge status={u.role} type="info" /></td>
                                            <td><StatusBadge status="ACTIVE" type="success" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No users found.
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
