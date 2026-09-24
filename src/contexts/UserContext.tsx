import React, { createContext, useContext, useState, useEffect } from 'react';
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
import {
  initialUsers,
  initialBookSeries,
  initialBooks,
  initialChapters,
  initialChapterUnlocks,
  initialWallets,
  initialCoinPackages,
  initialCoinTransactions,
  initialUserLibrary,
  initialReadingProgress
} from '../services/mockData';

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
  // Simulator Tables States
  const [currentUser] = useState<User | null>(initialUsers[0]);

  const [bookSeries, setBookSeries] = useState<BookSeries[]>(() => {
    const saved = localStorage.getItem('ky_book_series');
    return saved ? JSON.parse(saved) : initialBookSeries;
  });

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('ky_books');
    return saved ? JSON.parse(saved) : initialBooks;
  });

  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem('ky_chapters');
    return saved ? JSON.parse(saved) : initialChapters;
  });

  const [chapterUnlocks, setChapterUnlocks] = useState<ChapterUnlock[]>(() => {
    const saved = localStorage.getItem('ky_chapter_unlocks');
    return saved ? JSON.parse(saved) : initialChapterUnlocks;
  });

  const [userLibrary, setUserLibrary] = useState<UserLibrary[]>(() => {
    const saved = localStorage.getItem('ky_user_library');
    return saved ? JSON.parse(saved) : initialUserLibrary;
  });

  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>(() => {
    const saved = localStorage.getItem('ky_reading_progress');
    return saved ? JSON.parse(saved) : initialReadingProgress;
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem('ky_wallets');
    return saved ? JSON.parse(saved) : initialWallets;
  });

  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>(() => {
    const saved = localStorage.getItem('ky_coin_transactions');
    return saved ? JSON.parse(saved) : initialCoinTransactions;
  });

  const [coinPackages] = useState<CoinPackage[]>(initialCoinPackages);

  const [paymentOrders, setPaymentOrders] = useState<PaymentOrder[]>(() => {
    const saved = localStorage.getItem('ky_payment_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('ky_payment_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('ky_book_series', JSON.stringify(bookSeries));
  }, [bookSeries]);

  useEffect(() => {
    localStorage.setItem('ky_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('ky_chapters', JSON.stringify(chapters));
  }, [chapters]);

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

  // Creator Studio Publishing simulator (creates Series -> Book -> Chapter -> PDF metadata)
  const publishBook = (
    seriesTitle: string,
    bookTitle: string,
    chapterTitle: string,
    pagesCount: number,
    cost: number
  ) => {
    if (!currentUser) return;

    const seriesId = `series-upload-${Date.now()}`;
    const bookId = `book-upload-${Date.now()}`;
    const chapterId = `ch-upload-${Date.now()}`;

    // 1. Create Series record
    const newSeries: BookSeries = {
      id: seriesId,
      title: seriesTitle,
      description: `Creator Published Comic. Uploaded by admin user.`,
      cover_image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400&auto=format&fit=crop",
      status: "ONGOING",
      created_at: new Date().toISOString()
    };

    // 2. Create Book record
    const newBook: Book = {
      id: bookId,
      series_id: seriesId,
      title: bookTitle,
      summary: `A compiled creator volume for ${seriesTitle}.`,
      cover_image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400&auto=format&fit=crop",
      coin_price: cost * 5,
      default_chapter_coin_cost: cost,
      default_free_chapters: cost > 0 ? 0 : 1,
      status: "ONGOING",
      created_at: new Date().toISOString()
    };

    // 3. Create Chapter record with Chapter PDF metadata
    const slugFile = chapterTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newChapter: Chapter = {
      id: chapterId,
      book_id: bookId,
      chapter_no: 1,
      chapterNumber: 1,
      title: chapterTitle,
      access_type: cost > 0 ? "PAID" : "FREE",
      pricing_model: cost > 0 ? "PAID" : "FREE",
      coin_cost: cost,
      coinCost: cost,
      pdf_file_name: `${slugFile}.pdf`,
      pdf_file_size: (pagesCount || 24) * 650000,
      pdf_page_count: pagesCount || 24,
      content_status: "READY",
      published: true,
      created_at: new Date().toISOString()
    };

    setBookSeries(prev => [newSeries, ...prev]);
    setBooks(prev => [newBook, ...prev]);
    setChapters(prev => [newChapter, ...prev]);
  };

  const deleteBookSeries = (seriesId: string) => {
    setBookSeries(prev => prev.filter(s => s.id !== seriesId));
    const relatedBookIds = books.filter(b => b.series_id === seriesId).map(b => b.id);
    setBooks(prev => prev.filter(b => b.series_id !== seriesId));
    setChapters(prev => prev.filter(c => !relatedBookIds.includes(c.book_id)));
  };

  const toggleSeriesStatus = (seriesId: string) => {
    setBookSeries(prev => prev.map(s => {
      if (s.id === seriesId) {
        const nextStatus = s.status === 'ONGOING' ? 'COMPLETED' : 'ONGOING';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
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
