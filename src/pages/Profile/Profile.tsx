import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Coins, BookOpen, Settings, ShieldCheck, ChevronRight, LogOut, ShieldAlert } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, wallet, coinTransactions, readingProgress } = useUser();
    const { user, isAuthenticated, logout, logoutAll } = useAuth();

    const totalReadCount = readingProgress.length;

    const displayEmail = user?.email || currentUser?.email || 'guest@kuroyomi.com';
    const displayUsername = user?.email.split('@')[0] || currentUser?.username || currentUser?.full_name || 'KuroYomi User';
    const displayRoles = user?.roles?.join(', ') || 'USER';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleLogoutAll = async () => {
        await logoutAll();
        navigate('/login');
    };

    return (
        <div className={styles.profile}>
            <div className="main-container">
                {/* User Card */}
                <div className={`${styles.userCard} glass`}>
                    <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop"
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
                                {user?.roles?.includes('ADMIN') && (
                                    <div className={styles.settingItem} onClick={() => navigate('/admin')} style={{ color: '#ff6b6b', fontWeight: 700 }}>
                                        <ShieldCheck size={16} style={{ color: '#e50914' }} />
                                        <span>Admin Control & Book Management</span>
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
        </div>
    );
};
