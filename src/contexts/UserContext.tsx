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
import { walletService, type UnlockOutcome } from '../services/walletService';
import { useAuthStore } from '../store/auth.store';

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
  /** Spends coins server-side; resolves with the outcome. */
  unlockChapter: (chapterId: string) => Promise<UnlockOutcome>;
  /** Re-fetch balance, transactions and packages from the server. */
  refreshWallet: () => Promise<void>;
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
  const [chapterUnlocks, setChapterUnlocks] = useState<ChapterUnlock[]>([]);

  const [userLibrary, setUserLibrary] = useState<UserLibrary[]>(() => {
    const saved = localStorage.getItem('ky_user_library');
    return saved ? JSON.parse(saved) : [];
  });

  const [readingProgress, setReadingProgress] = useState<ReadingProgress[]>(() => {
    const saved = localStorage.getItem('ky_reading_progress');
    return saved ? JSON.parse(saved) : [];
  });

  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Wallet data is server-authoritative (never persisted client-side).
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);

  const [paymentOrders] = useState<PaymentOrder[]>(() => {
    const saved = localStorage.getItem('ky_payment_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [paymentTransactions] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('ky_payment_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch catalog data from backend APIs on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const [seriesResult, booksResult, chaptersResult] = await Promise.allSettled([
          seriesService.getAll(),
          bookService.getAll(),
          chapterService.getAll(),
        ]);
        const seriesData = seriesResult.status === 'fulfilled' ? seriesResult.value : [];
        const booksData = booksResult.status === 'fulfilled' ? booksResult.value : [];
        const chaptersData = chaptersResult.status === 'fulfilled' ? chaptersResult.value : [];

        if (seriesResult.status === 'rejected') console.error('[UserContext] Failed to load series:', seriesResult.reason);
        if (booksResult.status === 'rejected') console.error('[UserContext] Failed to load books:', booksResult.reason);
        if (chaptersResult.status === 'rejected') console.error('[UserContext] Failed to load chapters:', chaptersResult.reason);

        const enrichedSeries = seriesData.map((s) => {
          if (!s.cover_image) {
            const childBook = booksData.find(
              (b) => (b.series_id === s.id || (b as any).seriesId === s.id) && (b.coverUrl || b.cover_image)
            );
            if (childBook) {
              return { ...s, cover_image: childBook.coverUrl || childBook.cover_image };
            }
          }
          return s;
        });

        setBookSeries(enrichedSeries);
        setBooks(booksData);
        setChapters(chaptersData);
      } catch (err) {
        console.error('[UserContext] Failed to fetch catalog data:', err);
        setBookSeries([]);
        setBooks([]);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated || !authUser) {
      setWallet(null);
      setCoinTransactions([]);
      setCoinPackages([]);
      setChapterUnlocks([]);
      return;
    }
    const [balanceResult, txResult, packagesResult, unlocksResult] = await Promise.allSettled([
      walletService.getBalance(),
      walletService.getTransactions(),
      walletService.getPackages(),
      walletService.getUnlocks(authUser.userId),
    ]);
    if (balanceResult.status === 'fulfilled') {
      setWallet({
        id: authUser.userId,
        user_id: authUser.userId,
        balance: balanceResult.value,
        created_at: '',
      });
    } else {
      console.error('[UserContext] Failed to load wallet:', balanceResult.reason);
    }
    if (txResult.status === 'fulfilled') setCoinTransactions(txResult.value);
    if (packagesResult.status === 'fulfilled') setCoinPackages(packagesResult.value);
    if (unlocksResult.status === 'fulfilled') setChapterUnlocks(unlocksResult.value);
  }, [isAuthenticated, authUser]);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  // Sync user-specific state to local storage
  useEffect(() => {
    localStorage.setItem('ky_user_library', JSON.stringify(userLibrary));
  }, [userLibrary]);

  useEffect(() => {
    localStorage.setItem('ky_reading_progress', JSON.stringify(readingProgress));
  }, [readingProgress]);

  useEffect(() => {
    localStorage.setItem('ky_payment_orders', JSON.stringify(paymentOrders));
  }, [paymentOrders]);

  useEffect(() => {
    localStorage.setItem('ky_payment_transactions', JSON.stringify(paymentTransactions));
  }, [paymentTransactions]);

  // Unlocked check helper (server enforces; this only drives the UI)
  const isChapterUnlocked = (chapterId: string): boolean => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return false;

    // 1. FREE chapters
    const pricing = ch.pricing_model || ch.pricingModel || ch.access_type || 'FREE';
    if (pricing === 'FREE') return true;

    // 2. Admins read everything
    if (useAuthStore.getState().isAdmin()) return true;

    // 3. User spent coins on this chapter (persisted server-side)
    return chapterUnlocks.some(u => u.chapter_id === chapterId);
  };

  // Chapter unlock: the server debits coins atomically and records the ledger
  const unlockChapter = async (chapterId: string): Promise<UnlockOutcome> => {
    if (!isAuthenticated || !authUser) return 'error';
    if (isChapterUnlocked(chapterId)) return 'unlocked';
    const outcome = await walletService.unlockChapter(chapterId);
    if (outcome === 'unlocked') await refreshWallet();
    return outcome;
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
      refreshWallet,
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
