import { isAxiosError } from 'axios';
import { api } from './api';
import type { ChapterUnlock, CoinPackage, CoinTransaction } from '../types';

export type UnlockOutcome = 'unlocked' | 'insufficient' | 'error';

interface WalletApiResponse {
  balance: number;
}

interface CoinTransactionApi {
  id: string;
  type: 'RECHARGE' | 'BONUS' | 'UNLOCK' | 'REFUND';
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

interface CoinPackageApi {
  id: string;
  name: string;
  coins: number;
  price: string;
  currency: string;
}

const REASONS: Record<CoinTransactionApi['type'], string> = {
  RECHARGE: 'Wallet recharge',
  BONUS: 'Welcome bonus',
  UNLOCK: 'Chapter unlock',
  REFUND: 'Refund',
};

export const walletService = {
  /** GET /wallet — authoritative server-side coin balance. */
  getBalance: async (): Promise<number> => {
    const { data } = await api.get<WalletApiResponse>('/wallet');
    return data.balance;
  },

  /** GET /wallet/transactions */
  getTransactions: async (): Promise<CoinTransaction[]> => {
    const { data } = await api.get<CoinTransactionApi[]>('/wallet/transactions');
    return data.map((tx) => ({
      id: tx.id,
      wallet_id: '',
      type: tx.amount >= 0 ? 'Credit' : 'Debit',
      coins: tx.amount,
      reason: REASONS[tx.type] ?? tx.type,
      created_at: tx.createdAt,
    }));
  },

  /** GET /chapters/unlocks/me — chapters this user has spent coins on. */
  getUnlocks: async (userId: string): Promise<ChapterUnlock[]> => {
    const { data } = await api.get<
      { chapterId: string; coinsPaid: number; unlockedAt: string }[]
    >('/chapters/unlocks/me');
    return data.map((u) => ({
      id: u.chapterId,
      user_id: userId,
      chapter_id: u.chapterId,
      coins_paid: u.coinsPaid,
      source: 'COIN_PURCHASE',
      unlocked_at: u.unlockedAt,
      created_at: u.unlockedAt,
    }));
  },

  /** POST /chapters/:id/unlock — server debits coins atomically (402 if short). */
  unlockChapter: async (chapterId: string): Promise<UnlockOutcome> => {
    try {
      await api.post(`/chapters/${encodeURIComponent(chapterId)}/unlock`);
      return 'unlocked';
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 402) return 'insufficient';
      return 'error';
    }
  },

  /** GET /wallet/packages — active coin packages (empty until configured). */
  getPackages: async (): Promise<CoinPackage[]> => {
    const { data } = await api.get<CoinPackageApi[]>('/wallet/packages');
    return data.map((p) => ({
      id: p.id,
      name: p.name,
      coins: p.coins,
      price: Number(p.price),
      currency: p.currency,
      active: true,
    }));
  },
};
