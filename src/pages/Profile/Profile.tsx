import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Award,
    BookOpen,
    Coins,
    ChevronRight,
    LogOut,
    Settings,
    ShieldCheck,
    ShieldAlert,
    UserCheck,
    KeyRound
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthStore } from '../../store/auth.store';
import { userService } from '../../services/userService';
import { Modal, SuccessBanner, ErrorBanner } from '../../admin/components/AdminUI';
import adminStyles from '../../admin/components/AdminUI.module.css';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, wallet, coinTransactions, readingProgress } = useUser();
    const { user, isAuthenticated, isAdmin, logout, logoutAll } = useAuth();

    const totalReadCount = readingProgress.length;

    const displayEmail = user?.email || currentUser?.email || 'guest@kuroyomi.com';
    const displayUsername = user?.username || user?.fullName || currentUser?.username || currentUser?.full_name || user?.email?.split('@')[0] || 'KuroYomi User';
    const displayRoles = user?.roles?.join(', ') || 'USER';
    const avatarUrl = user?.avatarUrl || currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop';

    // Profile Edit State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFullName, setEditFullName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editAvatarUrl, setEditAvatarUrl] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [editSuccess, setEditSuccess] = useState<string | null>(null);

    // Password Change State
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleLogoutAll = async () => {
        await logoutAll();
        navigate('/login');
    };

    const handleOpenEditModal = () => {
        setEditFullName(user?.fullName || '');
        setEditUsername(user?.username || '');
        setEditAvatarUrl(user?.avatarUrl || '');
        setEditError(null);
        setEditSuccess(null);
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditLoading(true);
        setEditError(null);
        setEditSuccess(null);

        try {
            const updated = await userService.updateProfile({
                fullName: editFullName.trim() || undefined,
                username: editUsername.trim() || undefined,
                avatarUrl: editAvatarUrl.trim() || undefined,
            });

            // Update Zustand store
            const currentAuthUser = useAuthStore.getState().user;
            if (currentAuthUser) {
                useAuthStore.setState({
                    user: {
                        ...currentAuthUser,
                        fullName: updated.fullName,
                        username: updated.username,
                        avatarUrl: updated.avatarUrl,
                    }
                });
            }

            setEditSuccess('Profile updated successfully!');
            setTimeout(() => {
                setIsEditModalOpen(false);
                setEditSuccess(null);
            }, 1200);
        } catch (err: any) {
            setEditError(err.response?.data?.message || err.message || 'Failed to update profile');
        } finally {
            setEditLoading(false);
        }
    };

    const handleOpenPasswordModal = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
        setPasswordSuccess(null);
        setIsPasswordModalOpen(true);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (!currentPassword) {
            setPasswordError('Current password is required.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (currentPassword === newPassword) {
            setPasswordError('New password must be different from current password.');
            return;
        }

        setPasswordLoading(true);

        try {
            const res = await userService.changePassword({
                currentPassword,
                newPassword,
            });

            setPasswordSuccess(res.message || 'Password changed successfully. Redirecting to login...');

            // Password change revokes all active refresh tokens on backend
            setTimeout(async () => {
                await logout();
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || err.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className={styles.profile}>
            <div className="main-container">
                {/* User Card */}
                <div className={`${styles.userCard} glass`}>
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className={styles.avatar}
                    />
                    <div className={styles.userInfo}>
                        <h2>{displayUsername}</h2>
                        <p>{displayEmail}</p>
                        <div className={styles.userTier}>
                            <Award size={14} /> Roles: {displayRoles}
                        </div>
                    </div>

                    <div className={styles.statsContainer}>
                        <div className={styles.statBox}>
                            <BookOpen size={20} />
                            <div className={styles.statInfo}>
                                <span className={styles.statVal}>{totalReadCount}</span>
                                <span className={styles.statLabel}>Chapters Read</span>
                            </div>
                        </div>
                        <div className={styles.statBox}>
                            <Coins size={20} />
                            <div className={styles.statInfo}>
                                <span className={styles.statVal}>{wallet?.balance || 0}</span>
                                <span className={styles.statLabel}>Coins Owned</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dynamic content splits */}
                <div className={styles.splitsGrid}>
                    {/* Left Split: Account Options */}
                    <div className={styles.leftCol}>
                        <div className={styles.block}>
                            <h3 className={styles.blockTitle}><Settings size={18} /> Account Options</h3>
                            <div className={styles.settingsMenu}>
                                <div className={styles.settingItem} onClick={() => navigate('/wallet')}>
                                    <Coins size={16} />
                                    <span>Wallet Balance Refill</span>
                                    <ChevronRight size={16} />
                                </div>

                                {isAuthenticated && (
                                    <>
                                        <div className={styles.settingItem} onClick={handleOpenEditModal}>
                                            <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                                            <span>Edit Profile Details</span>
                                            <ChevronRight size={16} />
                                        </div>

                                        <div className={styles.settingItem} onClick={handleOpenPasswordModal}>
                                            <KeyRound size={16} style={{ color: '#f59e0b' }} />
                                            <span>Change Account Password</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </>
                                )}

                                {isAdmin && (
                                    <div className={styles.settingItem} onClick={() => navigate('/admin')} style={{ color: '#ff6b6b', fontWeight: 700 }}>
                                        <ShieldCheck size={16} style={{ color: '#e50914' }} />
                                        <span>Admin Portal & Book Management</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '10px', background: '#e50914', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>ADMIN</span>
                                    </div>
                                )}

                                {isAuthenticated ? (
                                    <>
                                        <div className={styles.settingItem} onClick={handleLogout} style={{ color: '#f87171' }}>
                                            <LogOut size={16} />
                                            <span>Sign Out (This Device)</span>
                                            <ChevronRight size={16} />
                                        </div>
                                        <div className={styles.settingItem} onClick={handleLogoutAll} style={{ color: '#ef4444' }}>
                                            <ShieldAlert size={16} />
                                            <span>Sign Out (All Devices)</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.settingItem} onClick={() => navigate('/login')} style={{ color: '#4f46e5' }}>
                                        <LogOut size={16} />
                                        <span>Sign In / Register</span>
                                        <ChevronRight size={16} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Split: Transaction logs */}
                    <div className={styles.rightCol}>
                        <div className={styles.block}>
                            <h3 className={styles.blockTitle}><Coins size={18} /> Wallet Transaction Logs</h3>
                            <div className={styles.transactionsContainer}>
                                {coinTransactions.length > 0 ? (
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.transactionsTable}>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Details / Reason</th>
                                                    <th>Coins</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {coinTransactions.map((tx) => {
                                                    const isCredit = tx.type === 'Credit';
                                                    const sign = tx.coins > 0 ? '+' : '';

                                                    return (
                                                        <tr key={tx.id}>
                                                            <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                                                            <td className={styles.txDesc}>{tx.reason}</td>
                                                            <td className={isCredit ? styles.positiveCoins : styles.negativeCoins}>
                                                                {sign}{tx.coins}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className={styles.emptyTransactions}>No transaction history logged yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => { if (!editLoading) setIsEditModalOpen(false); }}
                title="Edit Profile Details"
            >
                <form onSubmit={handleSaveProfile}>
                    {editSuccess && <SuccessBanner message={editSuccess} />}
                    {editError && <ErrorBanner message={editError} />}

                    <div className={adminStyles.formGroup} style={{ marginTop: '16px' }}>
                        <label className={adminStyles.formLabel}>Full Name</label>
                        <input
                            type="text"
                            className={adminStyles.formInput}
                            placeholder="e.g. Krishna Kumar"
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            disabled={editLoading}
                        />
                    </div>

                    <div className={adminStyles.formGroup}>
                        <label className={adminStyles.formLabel}>Username / Handle</label>
                        <input
                            type="text"
                            className={adminStyles.formInput}
                            placeholder="e.g. krishna_dev"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            disabled={editLoading}
                        />
                    </div>

                    <div className={adminStyles.formGroup}>
                        <label className={adminStyles.formLabel}>Avatar Image URL</label>
                        <input
                            type="url"
                            className={adminStyles.formInput}
                            placeholder="https://example.com/avatar.png"
                            value={editAvatarUrl}
                            onChange={(e) => setEditAvatarUrl(e.target.value)}
                            disabled={editLoading}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button
                            type="button"
                            className={adminStyles.btnSecondary}
                            onClick={() => setIsEditModalOpen(false)}
                            disabled={editLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={adminStyles.btnPrimary}
                            disabled={editLoading}
                        >
                            {editLoading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => { if (!passwordLoading) setIsPasswordModalOpen(false); }}
                title="Change Account Password"
            >
                <form onSubmit={handleChangePassword}>
                    {passwordSuccess && <SuccessBanner message={passwordSuccess} />}
                    {passwordError && <ErrorBanner message={passwordError} />}

                    <div className={adminStyles.formGroup} style={{ marginTop: '16px' }}>
                        <label className={adminStyles.formLabel}>Current Password</label>
                        <input
                            type="password"
                            className={adminStyles.formInput}
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={passwordLoading}
                            required
                        />
                    </div>

                    <div className={adminStyles.formGroup}>
                        <label className={adminStyles.formLabel}>New Password (min. 8 characters)</label>
                        <input
                            type="password"
                            className={adminStyles.formInput}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={passwordLoading}
                            minLength={8}
                            required
                        />
                    </div>

                    <div className={adminStyles.formGroup}>
                        <label className={adminStyles.formLabel}>Confirm New Password</label>
                        <input
                            type="password"
                            className={adminStyles.formInput}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={passwordLoading}
                            minLength={8}
                            required
                        />
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '8px', marginBottom: '20px' }}>
                        Changing your password will automatically sign out all existing active sessions on other devices for security.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            className={adminStyles.btnSecondary}
                            onClick={() => setIsPasswordModalOpen(false)}
                            disabled={passwordLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={adminStyles.btnPrimary}
                            disabled={passwordLoading}
                        >
                            {passwordLoading ? 'Updating Password...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
