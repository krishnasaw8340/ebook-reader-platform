import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { paymentService, type PaymentOrderView } from '../services/paymentService';

export type CheckoutPhase =
  | 'idle'
  | 'creating'
  | 'awaiting'
  | 'success'
  | 'expired'
  | 'failed'
  | 'error';

const POLL_INTERVAL_MS = 2500;

function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === 'string') return message;
    if (err.response?.status === 503) return 'Payments are not available right now.';
  }
  return 'Something went wrong. Please try again.';
}

interface Options {
  /** Called once when the server confirms the order as COMPLETED. */
  onCompleted: () => Promise<void> | void;
}

/**
 * Create an order, then poll its status every 2.5s until it settles.
 * The server (webhook) is the only thing that can complete an order, so the
 * client never credits coins itself.
 */
export function useCheckout({ onCompleted }: Options) {
  const [phase, setPhase] = useState<CheckoutPhase>('idle');
  const [order, setOrder] = useState<PaymentOrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const onCompletedRef = useRef(onCompleted);
  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  const orderId = order?.id ?? null;
  const expiresAt = order?.expiresAt ?? null;

  const start = useCallback(async (packageId: string) => {
    setPhase('creating');
    setError(null);
    setOrder(null);
    try {
      const created = await paymentService.createOrder(packageId);
      setOrder(created);
      setPhase('awaiting');
    } catch (err) {
      setError(errorMessage(err));
      setPhase('error');
    }
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setOrder(null);
    setError(null);
    setSecondsLeft(0);
  }, []);

  // Poll while waiting for the webhook to settle the order.
  useEffect(() => {
    if (phase !== 'awaiting' || !orderId) return;
    let cancelled = false;
    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const latest = await paymentService.getOrderStatus(orderId);
        if (cancelled) return;
        setOrder(latest);
        if (latest.status === 'COMPLETED') {
          await onCompletedRef.current();
          if (!cancelled) setPhase('success');
        } else if (latest.status === 'EXPIRED') {
          setPhase('expired');
        } else if (latest.status === 'FAILED') {
          setPhase('failed');
        }
      } catch {
        // Transient network error: keep polling.
      } finally {
        inFlight = false;
      }
    };

    const id = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [phase, orderId]);

  // Countdown to code/checkout expiry.
  useEffect(() => {
    if (phase !== 'awaiting' || !expiresAt) return;
    const update = () =>
      setSecondsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [phase, expiresAt]);

  return { phase, order, error, secondsLeft, start, reset };
}
