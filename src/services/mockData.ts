import type {
  User,
  Role,
  UserRole,
  BookSeries,
  Book,
  Chapter,
  Page,
  Wallet,
  CoinTransaction,
  CoinPackage,
  UserLibrary,
  ReadingProgress
} from '../types';
import coverShatterfirst from '../assets/cover_shatterfirst.png';
import coverCyberpunk from '../assets/cover_cyberpunk.png';
import coverValkyrie from '../assets/cover_valkyrie.png';

// Auth tables
export const initialUsers: User[] = [
  {
    id: "user-1",
    email: "premium.reader@kuroyomi.com",
    username: "MangaFan99",
    full_name: "Manga Fan Ninety-Nine",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=150&auto=format&fit=crop",
    is_email_verified: true,
    status: "ACTIVE",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z"
  }
];

export const initialRoles: Role[] = [
  { id: "role-admin", name: "ADMIN", description: "Administrator", created_at: "2026-07-01T00:00:00Z" },
  { id: "role-user", name: "USER", description: "Regular User", created_at: "2026-07-01T00:00:00Z" }
];

export const initialUserRoles: UserRole[] = [
  { id: "ur-1", user_id: "user-1", role_id: "role-user", assigned_at: "2026-07-01T00:00:00Z" }
];

// Catalog: Series table
export const initialBookSeries: BookSeries[] = [
  {
    id: "series-shatterfirst",
    title: "Shatterfirst",
    description: "A street brawler with a punch that cracks reality itself climbs the tournament ladder to reach the man who erased his brother from existence. In a world controlled by iron-fisted martial arts corporations, his fists are the only voice of freedom.",
    cover_image: coverShatterfirst,
    status: "ONGOING",
    created_at: "2026-07-10T00:00:00Z"
  },
  {
    id: "series-cyberpunk-neotokyo",
    title: "Cyberpunk Neo-Tokyo",
    description: "In the neon-drenched rain of Neo-Tokyo, a rogue cyber-hacker stumbles upon an encrypted file containing the consciousness of a dead corporate CEO. Pursued by elite cyber-assassins, she must plug in to unravel a conspiracy that could rewrite humanity's neural net.",
    cover_image: coverCyberpunk,
    status: "ONGOING",
    created_at: "2026-07-01T00:00:00Z"
  },
  {
    id: "series-valkyrie-chronicles",
    title: "Valkyrie Chronicles",
    description: "A dark gothic fantasy detailing the descent of the final Valkyrie. Armed with a crimson sword powered by the souls of her fallen sisters, she wages a lonely, brutal war against both corrupt gods and demonic swarms to prevent the end of Midgard.",
    cover_image: coverValkyrie,
    status: "ONGOING",
    created_at: "2026-06-25T00:00:00Z"
  },
  {
    id: "series-sakura-whispers",
    title: "Whispers of the Sakura",
    description: "A bittersweet slice-of-life romance. Two childhood friends separated by distance reconnect under the blooming cherry blossoms of high school, only to realize that the silent letters they sent each other for years contained words they can no longer say.",
    cover_image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&width=400&auto=format&fit=crop",
    status: "COMPLETED",
    created_at: "2026-05-01T00:00:00Z"
  }
];

// Catalog: Books (Volumes) table
export const initialBooks: Book[] = [
  // Shatterfirst
  {
    id: "book-shatterfirst-v1",
    series_id: "series-shatterfirst",
    title: "Volume 1: Reality Cracks",
    summary: "Axel begins his journey in the street rings. He discovers the power of his reality-cracking fist.",
    cover_image: coverShatterfirst,
    coin_price: 0,
    status: "COMPLETED",
    created_at: "2026-07-10T00:00:00Z"
  },
  {
    id: "book-shatterfirst-v2",
    series_id: "series-shatterfirst",
    title: "Volume 2: Corporate Arena",
    summary: "Entering the high-tier corporate leagues. The opponents get tougher, and the conspiracy deepens.",
    cover_image: coverShatterfirst,
    coin_price: 5,
    status: "ONGOING",
    created_at: "2026-07-18T00:00:00Z"
  },
  // Cyberpunk Neo-Tokyo
  {
    id: "book-cyberpunk-v1",
    series_id: "series-cyberpunk-neotokyo",
    title: "Volume 1: Interface",
    summary: "Kenji discovers the corporate CEO ghost and starts her escape from cyber-assassins.",
    cover_image: coverCyberpunk,
    coin_price: 0,
    status: "ONGOING",
    created_at: "2026-07-01T00:00:00Z"
  },
  // Valkyrie Chronicles
  {
    id: "book-valkyrie-v1",
    series_id: "series-valkyrie-chronicles",
    title: "Volume 1: Fallen Wings",
    summary: "The descent of the final Valkyrie into Midgard to stop corrupt deities.",
    cover_image: coverValkyrie,
    coin_price: 0,
    status: "ONGOING",
    created_at: "2026-06-25T00:00:00Z"
  },
  // Sakura Whispers
  {
    id: "book-sakura-v1",
    series_id: "series-sakura-whispers",
    title: "Volume 1: Blossoms",
    summary: "Bitter reunion of two separated childhood friends in high school.",
    cover_image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&width=400&auto=format&fit=crop",
    coin_price: 0,
    status: "COMPLETED",
    created_at: "2026-05-01T00:00:00Z"
  }
];

// Catalog: Chapters table
export const initialChapters: Chapter[] = [
  // Shatterfirst Vol 1 (Chapters 1 & 2)
  {
    id: "ch-shatter-1",
    book_id: "book-shatterfirst-v1",
    chapter_no: 1,
    title: "Iron Fists, Broken Hopes",
    access_type: "FREE",
    free_pages: 8,
    coin_cost: 0,
    created_at: "2026-07-10T00:00:00Z"
  },
  {
    id: "ch-shatter-2",
    book_id: "book-shatterfirst-v1",
    chapter_no: 2,
    title: "Reality Cracks",
    access_type: "FREE",
    free_pages: 8,
    coin_cost: 0,
    created_at: "2026-07-12T00:00:00Z"
  },
  // Shatterfirst Vol 2 (Chapters 3 & 4)
  {
    id: "ch-shatter-3",
    book_id: "book-shatterfirst-v2",
    chapter_no: 3,
    title: "The Arena Callout",
    access_type: "PAID",
    free_pages: 2,
    coin_cost: 1,
    created_at: "2026-07-15T00:00:00Z"
  },
  {
    id: "ch-shatter-4",
    book_id: "book-shatterfirst-v2",
    chapter_no: 4,
    title: "Redemption in Dust",
    access_type: "PAID",
    free_pages: 0,
    coin_cost: 1,
    created_at: "2026-07-18T00:00:00Z"
  },
  // Cyberpunk Vol 1
  {
    id: "ch-cyber-1",
    book_id: "book-cyberpunk-v1",
    chapter_no: 1,
    title: "Interface Zero",
    access_type: "FREE",
    free_pages: 7,
    coin_cost: 0,
    created_at: "2026-07-01T00:00:00Z"
  },
  {
    id: "ch-cyber-2",
    book_id: "book-cyberpunk-v1",
    chapter_no: 2,
    title: "Ghost in the Wire",
    access_type: "PAID",
    free_pages: 1,
    coin_cost: 1,
    created_at: "2026-07-05T00:00:00Z"
  },
  {
    id: "ch-cyber-3",
    book_id: "book-cyberpunk-v1",
    chapter_no: 3,
    title: "Neon Runaway",
    access_type: "PAID",
    free_pages: 0,
    coin_cost: 1,
    created_at: "2026-07-11T00:00:00Z"
  },
  // Valkyrie Vol 1
  {
    id: "ch-valk-1",
    book_id: "book-valkyrie-v1",
    chapter_no: 1,
    title: "Fallen Wings",
    access_type: "FREE",
    free_pages: 9,
    coin_cost: 0,
    created_at: "2026-06-25T00:00:00Z"
  },
  {
    id: "ch-valk-2",
    book_id: "book-valkyrie-v1",
    chapter_no: 2,
    title: "Soul Drinker",
    access_type: "PAID",
    free_pages: 2,
    coin_cost: 1,
    created_at: "2026-06-29T00:00:00Z"
  },
  // Sakura Whispers Vol 1
  {
    id: "ch-sakura-1",
    book_id: "book-sakura-v1",
    chapter_no: 1,
    title: "Reunion under Pink Petals",
    access_type: "FREE",
    free_pages: 6,
    coin_cost: 0,
    created_at: "2026-05-01T00:00:00Z"
  },
  {
    id: "ch-sakura-2",
    book_id: "book-sakura-v1",
    chapter_no: 2,
    title: "Unopened Envelopes",
    access_type: "FREE",
    free_pages: 6,
    coin_cost: 0,
    created_at: "2026-05-15T00:00:00Z"
  }
];

// Catalog: Pages table
// Helper to dynamically build page list for chapters to keep mock file compact
const generatePagesForChapter = (chapterId: string, pageCount: number): Page[] => {
  const list: Page[] = [];
  for (let i = 1; i <= pageCount; i++) {
    list.push({
      id: `page-${chapterId}-${i}`,
      chapter_id: chapterId,
      page_no: i,
      image_url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&width=800&auto=format&fit=crop&text=Page+${i}`,
      created_at: "2026-07-01T00:00:00Z"
    });
  }
  return list;
};

export const initialPages: Page[] = [
  ...generatePagesForChapter("ch-shatter-1", 8),
  ...generatePagesForChapter("ch-shatter-2", 8),
  ...generatePagesForChapter("ch-shatter-3", 8),
  ...generatePagesForChapter("ch-shatter-4", 8),
  ...generatePagesForChapter("ch-cyber-1", 7),
  ...generatePagesForChapter("ch-cyber-2", 7),
  ...generatePagesForChapter("ch-cyber-3", 7),
  ...generatePagesForChapter("ch-valk-1", 9),
  ...generatePagesForChapter("ch-valk-2", 9),
  ...generatePagesForChapter("ch-sakura-1", 6),
  ...generatePagesForChapter("ch-sakura-2", 6)
];

// Wallet table
export const initialWallets: Wallet[] = [
  {
    id: "wallet-user-1",
    user_id: "user-1",
    balance: 51,
    created_at: "2026-07-01T00:00:00Z"
  }
];

// Wallet: Packages
export const initialCoinPackages: CoinPackage[] = [
  { id: "pkg-starter", name: "Starter Pack", coins: 10, price: 0.99, active: true },
  { id: "pkg-choices", name: "Reader Choice", coins: 55, price: 3.99, active: true },
  { id: "pkg-collector", name: "Collector Bundle", coins: 120, price: 7.99, active: true }
];

// Wallet: Transactions table
export const initialCoinTransactions: CoinTransaction[] = [
  {
    id: "tx-welcome",
    wallet_id: "wallet-user-1",
    type: "Credit",
    coins: 50,
    reason: "New Account Welcome Gift",
    created_at: "2026-07-19T10:00:00Z"
  },
  {
    id: "tx-first-unlock",
    wallet_id: "wallet-user-1",
    type: "Debit",
    coins: -1,
    reason: "Unlocked chapter: ch-shatter-3",
    created_at: "2026-07-19T12:30:00Z"
  }
];

// Reading: Library table
export const initialUserLibrary: UserLibrary[] = [
  {
    id: "lib-1",
    user_id: "user-1",
    book_id: "book-shatterfirst-v1",
    unlocked_at: "2026-07-19T12:30:00Z"
  }
];

// Reading: Progress table
export const initialReadingProgress: ReadingProgress[] = [
  {
    id: "prog-1",
    user_id: "user-1",
    book_id: "book-shatterfirst-v1",
    chapter_id: "ch-shatter-1",
    page_id: "page-ch-shatter-1-4",
    updated_at: "2026-07-19T12:30:00Z"
  }
];
