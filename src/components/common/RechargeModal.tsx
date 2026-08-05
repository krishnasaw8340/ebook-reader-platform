import React, { useState } from 'react';
import { X, Coins, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import styles from './Modal.module.css';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose, message }) => {
  const { rechargeCoins, coinPackages } = useUser();
  const [successCoins, setSuccessCoins] = useState<number | null>(null);

  const handlePurchase = (packageId: string, coins: number) => {
    rechargeCoins(packageId);
    setSuccessCoins(coins);
    
    // Auto-close success message
    setTimeout(() => {
      setSuccessCoins(null);
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          {/* Backdrop */}
          <motion.div 
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            className={`${styles.modalCard} glass`}
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <h3>Recharge Wallet</h3>
              <button onClick={onClose} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className={styles.modalBody}>
              {successCoins ? (
                // Success screen
                <motion.div 
                  className={styles.successScreen}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <CheckCircle size={56} className={styles.successIcon} />
                  <h4>Purchase Successful!</h4>
                  <p>Added <strong>{successCoins} Coins</strong> to your wallet.</p>
                </motion.div>
              ) : (
                // Packages list
                <>
                  {message && (
                    <div className={styles.noticeMessage}>
                      {message}
                    </div>
                  )}

                  <p className={styles.subtext}>Select a package to refill your coin balance instantly.</p>

                  <div className={styles.packagesContainer}>
                    {coinPackages.map((pack) => (
                      <div 
                        key={pack.id} 
                        className={`${styles.packageRow} ${pack.coins === 55 ? styles.popularRow : ''}`}
                        onClick={() => handlePurchase(pack.id, pack.coins)}
                      >
                        <div className={styles.packageInfo}>
                          <div className={styles.packHeader}>
                            <span className={styles.coinCount}>
                              <Coins size={15} className={styles.coinIcon} /> {pack.coins} Coins
                            </span>
                          </div>
                          <span className={styles.packLabel}>{pack.name}</span>
                        </div>
                        
                        <button className={styles.priceBtn}>
                          ${pack.price}
                        </button>

                        {pack.coins === 55 && (
                          <div className={styles.popularBadge}>BEST VALUE</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={styles.modalFooter}>
                    <span>Sandbox Checkout Simulation. No real charge processed.</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
