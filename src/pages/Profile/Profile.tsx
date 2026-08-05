import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Coins, BookOpen, Clock, Settings, ShieldCheck, ChevronRight } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, wallet, coinTransactions, readingProgress } = useUser();

  const totalReadCount = readingProgress.length;

  return (
    <div className={styles.profile}>
      <div className="main-container">
        
        {/* User Card */}
        {currentUser && (
          <div className={`${styles.userCard} glass`}>
            <img 
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=100&auto=format&fit=crop'} 
              alt="Avatar" 
              className={styles.avatar} 
            />
            <div className={styles.userInfo}>
              <h2>{currentUser.username || currentUser.full_name}</h2>
              <p>{currentUser.email}</p>
              <div className={styles.userTier}>
                <Award size={14} /> Status: {currentUser.status}
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
        )}

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
                <div className={styles.settingItem} onClick={() => navigate('/admin')}>
                  <ShieldCheck size={16} />
                  <span>Creator Publishing Dashboard</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>

          </div>

          {/* Right Split: Transaction logs */}
          <div className={styles.rightCol}>
            
            {/* Transaction Logs */}
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
