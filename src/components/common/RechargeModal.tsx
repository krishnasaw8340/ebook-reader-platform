import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Coins,
  CheckCircle,
  ExternalLink,
  Clock,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../contexts/UserContext';
import { useCheckout } from '../../hooks/useCheckout';
import type { PaymentOrderView } from '../../services/paymentService';
import { formatPrice } from '../../utils/formatPrice';
import styles from './Modal.module.css';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  /** When set, checkout starts immediately for this package. */
  initialPackageId?: string | null;
  discordWindowRef?: React.MutableRefObject<Window | null>;
}

const CELEBRATION_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.cos((i / 14) * Math.PI * 2) * 110,
  y: Math.sin((i / 14) * Math.PI * 2) * 110,
}));

const formatClock = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  message,
  initialPackageId,
  discordWindowRef,
}) => {
  const localDiscordWindowRef = useRef<Window | null>(null);
  const paymentWindowRef = discordWindowRef ?? localDiscordWindowRef;
  const onOrderCreated = (order: PaymentOrderView) => {
    const discordWindow = paymentWindowRef.current;
    paymentWindowRef.current = null;
    if (!discordWindow || discordWindow.closed) return;
    if (!order.discordUrl) {
      discordWindow.close();
      return;
    }
    discordWindow.location.href = order.discordUrl;
  };
  const onOrderFailed = () => {
    paymentWindowRef.current?.close();
    paymentWindowRef.current = null;
  };
  const { coinPackages, refreshWallet } = useUser();
  const { phase, order, error, secondsLeft, start, reset } = useCheckout({
    onCompleted: refreshWallet,
    onOrderCreated,
    onOrderFailed,
  });
  const [codeCopied, setCodeCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Auto-start when opened with a preselected package.
  const startedFor = useRef<string | null>(null);
  useEffect(() => {
    if (
      isOpen &&
      phase === 'idle' &&
      initialPackageId &&
      startedFor.current !== initialPackageId
    ) {
      startedFor.current = initialPackageId;
      void start(initialPackageId);
    }
    if (!isOpen) startedFor.current = null;
  }, [isOpen, initialPackageId, phase, start]);

  useEffect(() => {
    setCodeCopied(false);
    setCopyError(null);
    if (!order?.orderCode) return;
    if (!navigator.clipboard?.writeText) {
      setCopyError(
        'Clipboard access is unavailable. Select and copy the code above.',
      );
      return;
    }

    let active = true;
    void navigator.clipboard
      .writeText(order.orderCode)
      .then(() => {
        if (active) setCodeCopied(true);
      })
      .catch(() => {
        if (active) {
          setCopyError(
            'Clipboard access is unavailable. Select and copy the code above.',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [order?.id, order?.orderCode]);

  const handleClose = () => {
    if (phase !== 'creating' && phase !== 'awaiting') reset();
    onClose();
  };

  // Close shortly after the celebration.
  useEffect(() => {
    if (phase !== 'success') return;
    const id = window.setTimeout(handleClose, 3000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const retry = () => {
    reset();
    startedFor.current = null;
  };

  const copyOrderCode = async () => {
    if (!order?.orderCode) return;
    try {
      await navigator.clipboard.writeText(order.orderCode);
      setCodeCopied(true);
      setCopyError(null);
    } catch {
      setCodeCopied(false);
      setCopyError('Clipboard access is unavailable. Select and copy the code above.');
    }
  };

  const renderBody = () => {
    if (phase === 'creating') {
      return (
        <div className={styles.successScreen}>
          <Loader2 size={40} className={styles.spin} />
          <p>Preparing your secure checkout…</p>
        </div>
      );
    }

    if (phase === 'awaiting' && order) {
      return (
        <div className={styles.checkoutPanel}>
          <div className={styles.orderSummary}>
            <span className={styles.orderCreated}>
              Order Created: {order.coinsAmount} Coins (
              {formatPrice(order.priceAmount, order.currency)})
            </span>
          </div>

          <div className={styles.orderCodeCard}>
            <span className={styles.orderCreated}>Your One-Time Code</span>
            <div className={styles.orderCodeRow}>
              <strong className={styles.orderCode}>{order.orderCode ?? 'N/A'}</strong>
              <button
                type="button"
                className={styles.copyCodeButton}
                onClick={() => void copyOrderCode()}
                disabled={!order.orderCode}
              >
                {codeCopied ? <Check size={15} /> : <Copy size={15} />}
                {codeCopied ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            {copyError && <p className={styles.copyError}>{copyError}</p>}
          </div>

          {order.discordUrl ? (
            <a
              className={styles.primaryAction}
              href={order.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={16} /> Open Discord to Pay
            </a>
          ) : (
            <button type="button" className={styles.primaryAction} disabled>
              Discord payment is not configured
            </button>
          )}

          <div className={styles.waitingRow}>
            <Loader2 size={14} className={styles.spin} />
            <span>
              {order.status === 'COMPLETED'
                ? 'Payment received. Updating your wallet balance…'
                : 'Waiting for payment... Updates automatically.'}
            </span>
          </div>
          {order.status !== 'COMPLETED' && (
            <div className={styles.timerRow}>
              <Clock size={13} /> Checkout expires in{' '}
              <strong>{formatClock(secondsLeft)}</strong>
            </div>
          )}
          <p className={styles.modalFooter}>
            Enter your code in the Discord payment channel, then use its private PayPal link.
            Keep this window open; your balance updates automatically after payment is confirmed.
          </p>
        </div>
      );
    }

    if (phase === 'success' && order) {
      return (
        <motion.div
          className={styles.successScreen}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className={styles.celebration}>
            {CELEBRATION_PARTICLES.map((p) => (
              <motion.span
                key={p.id}
                className={styles.particle}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1.2 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              >
                🪙
              </motion.span>
            ))}
            <CheckCircle size={56} className={styles.successIcon} />
          </div>
          <h4>Payment Successful!</h4>
          <p>
            <strong>{order.coinsAmount} Coins</strong> added to your balance.
          </p>
        </motion.div>
      );
    }

    if (phase === 'expired' || phase === 'failed' || phase === 'error') {
      const text =
        phase === 'expired'
          ? 'This checkout expired. Start a new one to continue.'
          : phase === 'failed'
            ? 'The payment could not be completed. You have not been charged coins.'
            : error;
      return (
        <div className={styles.successScreen}>
          <AlertTriangle size={44} className={styles.warnIcon} />
          <p>{text}</p>
          <button className={styles.primaryAction} onClick={retry}>
            Choose a package
          </button>
        </div>
      );
    }

    // idle: package selection
    return (
      <>
        {message && <div className={styles.noticeMessage}>{message}</div>}

        <p className={styles.subtext}>Select a package to refill your coin balance.</p>

        <div className={styles.packagesContainer}>
          {coinPackages.length === 0 && (
            <p className={styles.subtext}>No coin packages available right now.</p>
          )}
          {coinPackages.map((pack, index) => (
            <button
              key={pack.id}
              type="button"
              className={`${styles.packageRow} ${index === coinPackages.length - 1 && coinPackages.length > 2 ? styles.popularRow : ''}`}
              onClick={() => {
                paymentWindowRef.current = window.open('about:blank', '_blank');
                void start(pack.id);
              }}
            >
              <div className={styles.packageInfo}>
                <div className={styles.packHeader}>
                  <span className={styles.coinCount}>
                    <Coins size={15} className={styles.coinIcon} /> {pack.coins} Coins
                  </span>
                </div>
                <span className={styles.packLabel}>{pack.name}</span>
              </div>
              <span className={styles.priceBtn}>{formatPrice(pack.price, pack.currency)}</span>
            </button>
          ))}
        </div>
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className={`${styles.modalCard} glass`}
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div className={styles.modalHeader}>
              <h3>Recharge Wallet</h3>
              <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>{renderBody()}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
