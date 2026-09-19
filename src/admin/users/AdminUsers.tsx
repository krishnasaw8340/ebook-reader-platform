import React, { useEffect, useState } from 'react';
import {
    Users,
    Shield,
    CheckCircle2,
    XCircle,
    UserCheck,
    UserX,
    Eye,
    Mail,
    Calendar,
    Lock
} from 'lucide-react';
import {
    adminUserService,
    type AdminUserListItem
} from '../../services/admin/adminServices';
import {
    PageHeader,
    SearchBar,
    StatusBadge,
    Modal,
    LoadingState,
    EmptyState,
    SuccessBanner,
    ErrorBanner
} from '../components/AdminUI';
import styles from '../components/AdminUI.module.css';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<AdminUserListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // User details modal
    const [viewingUser, setViewingUser] = useState<AdminUserListItem | null>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminUserService.getAll({
                search: searchQuery,
                status: statusFilter,
                role: roleFilter
            });
            setUsers(data);
        } catch (err: any) {
            setErrorMessage(err.message || 'Unable to load user directory.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [searchQuery, statusFilter, roleFilter]);

    const handleToggleStatus = async (user: AdminUserListItem) => {
        const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await adminUserService.updateStatus(user.id, nextStatus);
            setSuccessMessage(`User "${user.email}" marked as ${nextStatus}.`);
            loadUsers();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to update user status.');
        }
    };

    return (
        <div>
            <PageHeader
                title="User & Role Management"
                subtitle="Inspect platform accounts, review verified emails, monitor account statuses, and audit security roles."
            />

            {successMessage && <SuccessBanner message={successMessage} />}
            {errorMessage && <ErrorBanner message={errorMessage} />}

            <div className={styles.filterBar}>
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by username, full name, or email..."
                />

                <div className={styles.filterGroup}>
                    <select
                        className={styles.selectInput}
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="USER">USER</option>
                    </select>

                    <select
                        className={styles.selectInput}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Account Statuses</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="PENDING">PENDING</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableCard}>
                {loading ? (
                    <LoadingState message="Loading platform users..." />
                ) : users.length === 0 ? (
                    <EmptyState
                        title="No users found"
                        description="No registered accounts match the selected filters."
                    />
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead>
                                <tr>
                                    <th>User Profile</th>
                                    <th>Email Verification</th>
                                    <th>Assigned Roles</th>
                                    <th>Account Status</th>
                                    <th>Member Since</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => {
                                    const isAdmin = u.roles?.includes('ADMIN');

                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img
                                                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100'}
                                                        alt={u.username || 'User'}
                                                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                                            {u.full_name || u.username || 'KuroYomi Reader'}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {u.is_email_verified ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2ecc71', fontSize: '12px', fontWeight: 600 }}>
                                                        <CheckCircle2 size={14} /> Verified
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f39c12', fontSize: '12px', fontWeight: 600 }}>
                                                        <XCircle size={14} /> Unverified
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {u.roles?.map((r) => (
                                                        <span
                                                            key={r}
                                                            style={{
                                                                fontSize: '10px',
                                                                fontWeight: 800,
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                background: r === 'ADMIN' ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.06)',
                                                                color: r === 'ADMIN' ? '#ff6b6b' : 'var(--text-secondary)',
                                                                border: r === 'ADMIN' ? '1px solid rgba(230,57,70,0.3)' : '1px solid rgba(255,255,255,0.08)'
                                                            }}
                                                        >
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <StatusBadge status={u.status} />
                                            </td>
                                            <td style={{ fontSize: '12px' }}>
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                                    <button
                                                        className={styles.btnIcon}
                                                        title="View Account Details"
                                                        onClick={() => setViewingUser(u)}
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        className={styles.btnIcon}
                                                        style={{ color: u.status === 'ACTIVE' ? '#ef4444' : '#2ecc71' }}
                                                        title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                                                        onClick={() => handleToggleStatus(u)}
                                                    >
                                                        {u.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
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

            {/* User Details Modal (Read-only sensitive security fields) */}
            <Modal
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
                title="User Account Details"
                footer={
                    <button className={styles.btnSecondary} onClick={() => setViewingUser(null)}>
                        Close
                    </button>
                }
            >
                {viewingUser && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <img
                                src={viewingUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100'}
                                alt="User"
                                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                                    {viewingUser.full_name || viewingUser.username || 'User Profile'}
                                </h3>
                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{viewingUser.email}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>ID: {viewingUser.id}</div>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email Verification</label>
                                <div style={{ fontSize: '13px', color: viewingUser.is_email_verified ? '#2ecc71' : '#f39c12', fontWeight: 600 }}>
                                    {viewingUser.is_email_verified ? 'Verified Address' : 'Pending OTP Verification'}
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Account Status</label>
                                <div><StatusBadge status={viewingUser.status} /></div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Authorized Roles (Backend RBAC)</label>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                {viewingUser.roles?.map((r) => (
                                    <span
                                        key={r}
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            background: r === 'ADMIN' ? 'rgba(230,57,70,0.2)' : 'rgba(255,255,255,0.06)',
                                            color: r === 'ADMIN' ? '#ff6b6b' : 'var(--text-primary)',
                                            border: r === 'ADMIN' ? '1px solid rgba(230,57,70,0.3)' : '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            padding: '12px',
                            background: 'rgba(0,0,0,0.35)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Lock size={14} color="var(--primary)" />
                            <span>Security policy: Passwords and internal cryptographic hashes are never exposed to frontend views.</span>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
