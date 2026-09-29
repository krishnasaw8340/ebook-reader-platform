import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  User,
  BookSeries,
  Book,
  Chapter,
  ChapterUnlock,
  Wallet,
  CoinTransaction,
  CoinPackage,
  UserLibrary,
  ReadingProgress,
  PaymentOrder,
  PaymentTransaction
} from '../types';
import { seriesService } from '../services/seriesService';
import { bookService } from '../services/bookService';
import { chapterService } from '../services/chapterService';

interface UserContextType {
  currentUser: User | null;
  bookSeries: BookSeries[];
  books: Book[];
  chapters: Chapter[];
  chapterUnlocks: ChapterUnlock[];
  userLibrary: UserLibrary[];
  readingProgress: ReadingProgress[];
  wallet: Wallet | null;
  coinTransactions: CoinTransaction[];
  coinPackages: CoinPackage[];
  paymentOrders: PaymentOrder[];
  paymentTransactions: PaymentTransaction[];
  loading: boolean;
  
  // Database Operations
  isChapterUnlocked: (chapterId: string) => boolean;
  unlockChapter: (chapterId: string) => boolean;
  rechargeCoins: (packageId: string) => void;
  toggleBookmark: (seriesId: string) => void;
  saveProgress: (
    bookId: string,
    chapterId: string,
    progressPercent?: number,
    lastPdfPage?: number,
    lastScrollPosition?: number
  ) => void;
  publishBook: (
    seriesTitle: string,
    bookTitle: string,
    chapterTitle: string,
    pagesCount: number,
    cost: number
  ) => void;
  deleteBookSeries: (seriesId: string) => void;
  toggleSeriesStatus: (seriesId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All state starts empty — populated from API
  const [currentUser] = useState<User | null>(null);
  const [bookSeries, setBookSeries] = useState<BookSeries[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  // User-specific state (these will eventually come from APIs too)
  const [chapterUnlocks, setChapterUnlocks] = useState<ChapterUnlock[]>(() => {
    const saved = localStorage.getItem('ky_chapter_unlocks');
    return saved ? JSON.parse(saved) : [];
  });

  const [userLibrary, setUserLibrary] = useState<UserLibrary[]>(() => {
    const saved = localStorage.getItem('ky_user_library');
    return saved ? JSON.parse(saved) : [];
  });

  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>(() => {
    const saved = localStorage.getItem('ky_reading_progress');
    return saved ? JSON.parse(saved) : [];
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem('ky_wallets');
    return saved ? JSON.parse(saved) : [];
  });

  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>(() => {
    const saved = localStorage.getItem('ky_coin_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [coinPackages] = useState<CoinPackage[]>([]);

  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>(() => {
    const saved = localStorage.getItem('ky_payment_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('ky_payment_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch catalog data from backend APIs on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const [seriesData, booksData, chaptersData] = await Promise.all([
          seriesService.getAll().catch(() => []),
          bookService.getAll().catch(() => []),
          chapterService.getAll().catch(() => []),
        ]);
        setBookSeries(seriesData);
        setBooks(booksData);
        setChapters(chaptersData);
      } catch (err) {
        console.warn('[UserContext] Failed to fetch catalog data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Sync user-specific state to local storage
  useEffect(() => {
    localStorage.setItem('ky_chapter_unlocks', JSON.stringify(chapterUnlocks));
  }, [chapterUnlocks]);

  useEffect(() => {
    localStorage.setItem('ky_user_library', JSON.stringify(userLibrary));
  }, [userLibrary]);

  useEffect(() => {
    localStorage.setItem('ky_reading_progress', JSON.stringify(readingProgress));
  }, [readingProgress]);

  useEffect(() => {
    localStorage.setItem('ky_wallets', JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem('ky_coin_transactions', JSON.stringify(coinTransactions));
  }, [coinTransactions]);

  useEffect(() => {
    localStorage.setItem('ky_payment_orders', JSON.stringify(paymentOrders));
  }, [paymentOrders]);

  useEffect(() => {
    localStorage.setItem('ky_payment_transactions', JSON.stringify(paymentTransactions));
  }, [paymentTransactions]);

  // Find active user wallet helper
  const wallet = wallets.find(w => w.user_id === currentUser?.id) || null;

  // Unlocked check helper
  const isChapterUnlocked = (chapterId: string): boolean => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return false;
    
    // 1. FREE Chapters
    const pricing = ch.pricing_model || ch.pricingModel || ch.access_type || 'FREE';
    const cost = ch.coin_cost ?? ch.coinCost ?? 0;
    if (pricing === 'FREE' || cost === 0) return true;

    // 2. Volume/Book is Unlocked in Library
    const isBookUnlocked = userLibrary.some(lib => lib.user_id === currentUser?.id && lib.book_id === ch.book_id);
    if (isBookUnlocked) return true;

    // 3. User has an explicit ChapterUnlock entitlement
    const hasUnlock = chapterUnlocks.some(
      u => u.user_id === currentUser?.id && u.chapter_id === chapterId
    );
    if (hasUnlock) return true;

    // 4. Fallback check for past debit transactions
    const hasTx = coinTransactions.some(tx => 
      tx.wallet_id === wallet?.id && 
      tx.type === 'Debit' && 
      tx.reason.includes(chapterId)
    );
    return hasTx;
  };

  // Chapter Unlock
  const unlockChapter = (chapterId: string): boolean => {
    if (!currentUser || !wallet) return false;
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return false;

    if (isChapterUnlocked(chapterId)) return true;

    const cost = ch.coin_cost ?? ch.coinCost ?? 0;

    if (wallet.balance >= cost) {
      // Deduct coins from wallet balance
      setWallets(prev => prev.map(w => w.id === wallet.id ? { ...w, balance: w.balance - cost } : w));

      // Create new ChapterUnlock entitlement
      const newUnlock: ChapterUnlock = {
        id: `unlock-${Date.now()}`,
        user_id: currentUser.id,
        chapter_id: chapterId,
        coins_paid: cost,
        source: 'COIN_PURCHASE',
        unlocked_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setChapterUnlocks(prev => [newUnlock, ...prev]);

      // Log coin debit transaction
      const newTx: CoinTransaction = {
        id: `tx-${Date.now()}`,
        wallet_id: wallet.id,
        type: 'Debit',
        coins: -cost,
        reason: `Unlocked chapter: ${ch.title} (${chapterId})`,
        created_at: new Date().toISOString()
      };
      setCoinTransactions(prev => [newTx, ...prev]);
      return true;
    }
    return false;
  };

  // Recharge Coins package
  const rechargeCoins = (packageId: string) => {
    if (!currentUser || !wallet) return;
    const pkg = coinPackages.find(p => p.id === packageId);
    if (!pkg) return;

    // 1. Create PENDING Payment Order
    const orderId = `order-${Date.now()}`;
    const newOrder: PaymentOrder = {
      id: orderId,
      user_id: currentUser.id,
      package_id: pkg.id,
      amount: pkg.price,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    setPaymentOrders(prev => [newOrder, ...prev]);

    // 2. Simulate payment gateway response (SUCCESS after 200ms)
    setTimeout(() => {
      // Update Payment Order Status to PAID
      setPaymentOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PAID' } : o));

      // Create Payment Transaction entry
      const newTxn: PaymentTransaction = {
        id: `txn-${Date.now()}`,
        order_id: orderId,
        gateway: "Sandbox_Stripe",
        gateway_txn_id: `gref-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'SUCCESS',
        paid_at: new Date().toISOString()
      };
      setPaymentTransactions(prev => [newTxn, ...prev]);

      // Credit Coins into Wallet balance
      setWallets(prev => prev.map(w => w.id === wallet.id ? { ...w, balance: w.balance + pkg.coins } : w));

      // Append Coin Credit Transaction
      const coinTx: CoinTransaction = {
        id: `tx-${Date.now()}`,
        wallet_id: wallet.id,
        type: 'Credit',
        coins: pkg.coins,
        reason: `Recharged Wallet (${pkg.coins} Coins via ${pkg.name})`,
        created_at: new Date().toISOString()
      };
      setCoinTransactions(prev => [coinTx, ...prev]);
    }, 200);
  };

  // Series bookmark toggle
  const toggleBookmark = (seriesId: string) => {
    if (!currentUser) return;
    
    const seriesBooks = books.filter(b => b.series_id === seriesId);
    if (seriesBooks.length === 0) return;

    const targetBook = seriesBooks[0];
    const existingIndex = userLibrary.findIndex(lib => lib.user_id === currentUser.id && lib.book_id === targetBook.id);

    if (existingIndex > -1) {
      const itemToRemove = userLibrary[existingIndex];
      setUserLibrary(prev => prev.filter(lib => lib.id !== itemToRemove.id));
    } else {
      const newLib: UserLibrary = {
        id: `lib-${Date.now()}`,
        user_id: currentUser.id,
        book_id: targetBook.id,
        unlocked_at: new Date().toISOString()
      };
      setUserLibrary(prev => [...prev, newLib]);
    }
  };

  // Save chapter reading progress
  const saveProgress = (
    bookId: string,
    chapterId: string,
    progressPercent = 0,
    lastPdfPage = 1,
    lastScrollPosition = 0
  ) => {
    if (!currentUser) return;

    const existingIndex = readingProgress.findIndex(
      p => p.user_id === currentUser.id && p.book_id === bookId
    );

    const updatedRow: ReadingProgress = {
      id: existingIndex > -1 ? readingProgress[existingIndex].id : `prog-${Date.now()}`,
      user_id: currentUser.id,
      book_id: bookId,
      chapter_id: chapterId,
      progress_percent: progressPercent,
      last_pdf_page: lastPdfPage,
      last_scroll_position: lastScrollPosition,
      updated_at: new Date().toISOString()
    };

    if (existingIndex > -1) {
      setReadingProgress(prev => prev.map((p, idx) => idx === existingIndex ? updatedRow : p));
    } else {
      setReadingProgress(prev => [...prev, updatedRow]);
    }
  };

  // Creator Studio Publishing — creates real API records now
  const publishBook = async (
    seriesTitle: string,
    bookTitle: string,
    chapterTitle: string,
    pagesCount: number,
    cost: number
  ) => {
    try {
      // 1. Create Series via API
      const newSeries = await seriesService.create({
        name: seriesTitle,
        description: `Creator Published Comic. Uploaded by admin user.`,
        status: 'ONGOING',
      });

      // 2. Create Book via API
      const newBook = await bookService.create({
        seriesId: newSeries.id,
        title: bookTitle,
        description: `A compiled creator volume for ${seriesTitle}.`,
        status: 'PUBLISHED',
        pricingModel: cost > 0 ? 'PER_CHAPTER' : 'FREE',
        defaultChapterCoinCost: cost,
        defaultFreeChapters: cost > 0 ? 0 : 1,
      });

      // 3. Create Chapter via API
      const newChapter = await chapterService.create({
        bookId: newBook.id,
        chapterNumber: 1,
        title: chapterTitle,
        pricingModel: cost > 0 ? 'PAID' : 'FREE',
        coinCost: cost,
        published: true,
      });

      // Refresh state from what was created
      setBookSeries(prev => [newSeries, ...prev]);
      setBooks(prev => [newBook, ...prev]);
      setChapters(prev => [newChapter, ...prev]);
    } catch (err) {
      console.error('[UserContext] Failed to publish book via API:', err);
    }
  };

  const deleteBookSeries = async (seriesId: string) => {
    try {
      await seriesService.delete(seriesId);
      setBookSeries(prev => prev.filter(s => s.id !== seriesId));
      const relatedBookIds = books.filter(b => b.series_id === seriesId).map(b => b.id);
      setBooks(prev => prev.filter(b => b.series_id !== seriesId));
      setChapters(prev => prev.filter(c => !relatedBookIds.includes(c.book_id)));
    } catch (err) {
      console.error('[UserContext] Failed to delete series:', err);
    }
  };

  const toggleSeriesStatus = async (seriesId: string) => {
    try {
      const updated = await seriesService.toggleStatus(seriesId);
      setBookSeries(prev => prev.map(s => s.id === seriesId ? updated : s));
    } catch (err) {
      console.error('[UserContext] Failed to toggle series status:', err);
    }
  };

  return (
    <UserContext.Provider value={{
      currentUser,
      bookSeries,
      books,
      chapters,
      chapterUnlocks,
      userLibrary,
      readingProgress,
      wallet,
      coinTransactions,
      coinPackages,
      paymentOrders,
      paymentTransactions,
      loading,
      isChapterUnlocked,
      unlockChapter,
      rechargeCoins,
      toggleBookmark,
      saveProgress,
      publishBook,
      deleteBookSeries,
      toggleSeriesStatus
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};
