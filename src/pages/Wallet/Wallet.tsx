import React, { useState } from 'react';
import { Coins, Plus, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useAuthStore } from '../../store/auth.store';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { RechargeModal } from '../../components/common/RechargeModal';
import { formatPrice } from '../../utils/formatPrice';
import styles from './Wallet.module.css';

export const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, coinTransactions, coinPackages } = useUser();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [checkoutPackageId, setCheckoutPackageId] = useState<string | null>(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const openRecharge = (packageId?: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCheckoutPackageId(packageId ?? null);
    setRechargeOpen(true);
  };

  const closeRecharge = () => {
    setRechargeOpen(false);
    setCheckoutPackageId(null);
  };

  return (
    <div className={styles.wallet}>
      <div className="main-container">
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Coins & Wallet' }]} />

        {/* Balance Box */}
        <div className={styles.balanceBox}>
          <Coins size={36} className={styles.coinIcon} />
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>Current Reading Balance</span>
            <div className={styles.coinCount}>
              <motion.span
                key={wallet?.balance ?? 0}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                {wallet?.balance ?? 0}
              </motion.span>
              <span> Coins</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.addCoinsBtn}
            onClick={() => openRecharge()}
          >
            <Plus size={17} />
            Add Coins
          </button>
        </div>

        {/* Package selection */}
        <div className={styles.purchaseBlock}>
          <div className={styles.packagesWrapper}>
            <h3>Purchase Reading Coins</h3>
            <p className={styles.subtext}>Refill your wallet to unlock premium chapters.</p>

            {coinPackages.length === 0 ? (
              <p className={styles.subtext}>No coin packages available right now.</p>
            ) : (
              <div className={styles.packagesGrid}>
                {coinPackages.map((pack) => (
                  <button
                    key={pack.id}
                    className={styles.packageCard}
                    type="button"
                    onClick={() => openRecharge(pack.id)}
                  >
                    <span className={styles.packLabel}>{pack.name}</span>
                    <div className={styles.coinVal}>
                      <Coins size={20} />
                      <span>{pack.coins}</span>
                    </div>
                    <span className={styles.priceBtn}>
                      {formatPrice(pack.price, pack.currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
                        <td>
                          {new Date(tx.created_at).toLocaleDateString()}{' '}
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td>{tx.reason}</td>
                        <td className={isCredit ? styles.positive : styles.negative}>
                          {sign}
                          {tx.coins} Coins
                        </td>
                        <td>{tx.type}</td>
                        <td>
                          <span className={styles.statusBadge}>
                            <ShieldCheck size={11} /> Settled
                          </span>
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

      <RechargeModal
        isOpen={rechargeOpen}
        initialPackageId={checkoutPackageId}
        onClose={closeRecharge}
      />
    </div>
  );
};
