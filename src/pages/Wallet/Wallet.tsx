import React, { useState } from 'react';
import { Coins, Plus, ShieldCheck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import styles from './Wallet.module.css';

export const Wallet: React.FC = () => {
  const { wallet, rechargeCoins, coinTransactions, coinPackages } = useUser();
  const [successCoins, setSuccessCoins] = useState<number | null>(null);

  const handlePurchase = (packageId: string) => {
    rechargeCoins(packageId);
    const pkg = coinPackages.find(p => p.id === packageId);
    if (pkg) {
      setSuccessCoins(pkg.coins);
      setTimeout(() => {
        setSuccessCoins(null);
      }, 1800);
    }
  };

  return (
    <div className={styles.wallet}>
      <div className="main-container">
        
        {/* Balance Box */}
        <div className={`${styles.balanceBox} glass`}>
          <Coins size={36} className={styles.coinIcon} />
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>Current Reading Balance</span>
            <div className={styles.coinCount}>
              <motion.span 
                key={wallet?.balance || 0}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {wallet?.balance || 0}
              </motion.span>
              <span> Coins</span>
            </div>
          </div>
        </div>

        {/* Purchase screen */}
        <div className={styles.purchaseBlock}>
          {successCoins ? (
            <motion.div 
              className={`${styles.successCard} glass`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <CheckCircle size={48} className={styles.successIcon} />
              <h3>Purchase Successful!</h3>
              <p>Successfully refilled your wallet with <strong>{successCoins} Coins</strong>.</p>
            </motion.div>
          ) : (
            <div className={styles.packagesWrapper}>
              <h3>Purchase Reading Coins</h3>
              <p className={styles.subtext}>Refill your wallet to unlock premium chapters instantly.</p>
              
              <div className={styles.packagesGrid}>
                {coinPackages.map((pack) => (
                  <div 
                    key={pack.id} 
                    className={`${styles.packageCard} ${pack.coins === 55 ? styles.popularCard : ''}`}
                    onClick={() => handlePurchase(pack.id)}
                  >
                    {pack.coins === 55 && (
                      <div className={styles.popularBadge}>BEST VALUE</div>
                    )}
                    <span className={styles.packLabel}>{pack.name}</span>
                    <div className={styles.coinVal}>
                      <Coins size={20} />
                      <span>{pack.coins}</span>
                    </div>
                    <button className={styles.priceBtn}>
                      ${pack.price}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transaction History Logs */}
        <div className={styles.logsBlock}>
          <h3>Transaction History</h3>
          <div className={styles.tableWrapper}>
            {coinTransactions.length > 0 ? (
              <table className={styles.transactionsTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reason / Details</th>
                    <th>Coins Transacted</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {coinTransactions.map((tx) => {
                    const isCredit = tx.type === 'Credit';
                    const sign = tx.coins > 0 ? '+' : '';
                    
                    return (
                      <tr key={tx.id}>
                        <td>{new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>{tx.reason}</td>
                        <td className={isCredit ? styles.positive : styles.negative}>
                          {sign}{tx.coins} Coins
                        </td>
                        <td>{tx.type}</td>
                        <td>
                          <span className={styles.statusBadge}><ShieldCheck size={11} /> Settled</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyLogs}>No wallet transaction history logged yet.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
