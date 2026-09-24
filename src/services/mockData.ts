import type { 
  User, 
  Role, 
  UserRole, 
  BookSeries, 
  Book, 
  Chapter, 
  ChapterUnlock,
  UserLibrary, 
  ReadingProgress, 
  Wallet, 
  CoinTransaction, 
  CoinPackage, 
  PaymentOrder, 
  PaymentTransaction 
} from '../types';

import coverShatterfirst from '../assets/cover_shatterfirst.png';
import coverCyberpunk from '../assets/cover_cyberpunk.png';
import coverValkyrie from '../assets/cover_valkyrie.png';

// Auth: Users table
export const initialUsers: User[] = [
  {
    id: "user-1",
    email: "reader@kuroyomi.com",
    username: "NeoReader",
    full_name: "Kenji Sato",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&width=200&auto=format&fit=crop",
    is_email_verified: true,
    status: "ACTIVE",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z"
  }
];

// Auth: Roles table
export const initialRoles: Role[] = [
  {
    id: "role-1",
    name: "USER",
    description: "Standard platform reader role",
    created_at: "2026-07-01T00:00:00Z"
  }
];

// Auth: UserRoles junction table
export const initialUserRoles: UserRole[] = [
  {
    id: "ur-1",
    user_id: "user-1",
    role_id: "role-1",
    assigned_at: "2026-07-01T00:00:00Z"
  }
];

// Catalog: BookSeries table
export const initialBookSeries: BookSeries[] = [
  {
    id: "series-shatterfirst",
    title: "Shatterfirst",
    description: "In the ruthless neon underworld of Neo-Shinjuku, underground cage fighting isn't just a sport—it's a corporate death sentence. Axel, an undocumented street boxer, discovers an ancient biomechanical art hidden inside his knuckles.",
    cover_image: coverShatterfirst,
    status: "ONGOING",
    created_at: "2026-07-10T00:00:00Z"
  },
  {
    id: "series-cyberpunk-neotokyo",
    title: "Cyberpunk Neo-Tokyo",
    description: "High tech, low life. When a freelance data courier accidentally intercepts the neural ghost of a murdered mega-corporation CEO, she becomes the most hunted entity on the orbital net.",
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
    default_chapter_coin_cost: 0,
    default_free_chapters: 2,
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
    default_chapter_coin_cost: 2,
    default_free_chapters: 0,
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
    default_chapter_coin_cost: 2,
    default_free_chapters: 1,
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
    default_chapter_coin_cost: 2,
    default_free_chapters: 1,
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
    default_chapter_coin_cost: 0,
    default_free_chapters: 2,
    status: "COMPLETED",
    created_at: "2026-05-01T00:00:00Z"
  }
];

// Catalog: Chapters table with Chapter PDF metadata
export const initialChapters: Chapter[] = [
  // Shatterfirst Vol 1 (Chapters 1 & 2)
  {
    id: "ch-shatter-1",
    book_id: "book-shatterfirst-v1",
    chapter_no: 1,
    title: "Iron Fists, Broken Hopes",
    access_type: "FREE",
    pricing_model: "FREE",
    coin_cost: 0,
    pdf_file_name: "shatterfirst-ch01.pdf",
    pdf_file_size: 18450000,
    pdf_page_count: 24,
    content_status: "READY",
    published: true,
    created_at: "2026-07-10T00:00:00Z"
  },
  {
    id: "ch-shatter-2",
    book_id: "book-shatterfirst-v1",
    chapter_no: 2,
    title: "Reality Cracks",
    access_type: "FREE",
    pricing_model: "FREE",
    coin_cost: 0,
    pdf_file_name: "shatterfirst-ch02.pdf",
    pdf_file_size: 21300000,
    pdf_page_count: 28,
    content_status: "READY",
    published: true,
    created_at: "2026-07-12T00:00:00Z"
  },
  // Shatterfirst Vol 2 (Chapters 3 & 4)
  {
    id: "ch-shatter-3",
    book_id: "book-shatterfirst-v2",
    chapter_no: 3,
    title: "The Arena Callout",
    access_type: "PAID",
    pricing_model: "PAID",
    coin_cost: 2,
    pdf_file_name: "shatterfirst-ch03.pdf",
    pdf_file_size: 24100000,
    pdf_page_count: 32,
    content_status: "READY",
    published: true,
    created_at: "2026-07-15T00:00:00Z"
  },
  {
    id: "ch-shatter-4",
    book_id: "book-shatterfirst-v2",
    chapter_no: 4,
    title: "Redemption in Dust",
    access_type: "PAID",
    pricing_model: "PAID",
    coin_cost: 2,
    pdf_file_name: "shatterfirst-ch04.pdf",
    pdf_file_size: 19800000,
    pdf_page_count: 26,
    content_status: "READY",
    published: true,
    created_at: "2026-07-18T00:00:00Z"
  },
  // Cyberpunk Vol 1
  {
    id: "ch-cyber-1",
    book_id: "book-cyberpunk-v1",
    chapter_no: 1,
    title: "Interface Zero",
    access_type: "FREE",
    pricing_model: "FREE",
    coin_cost: 0,
    pdf_file_name: "cyberpunk-ch01.pdf",
    pdf_file_size: 16900000,
    pdf_page_count: 22,
    content_status: "READY",
    published: true,
    created_at: "2026-07-01T00:00:00Z"
  },
  {
    id: "ch-cyber-2",
    book_id: "book-cyberpunk-v1",
    chapter_no: 2,
    title: "Ghost in the Wire",
    access_type: "PAID",
    pricing_model: "PAID",
    coin_cost: 2,
    pdf_file_name: "cyberpunk-ch02.pdf",
    pdf_file_size: 20400000,
    pdf_page_count: 26,
    content_status: "READY",
    published: true,
    created_at: "2026-07-05T00:00:00Z"
  },
  {
    id: "ch-cyber-3",
    book_id: "book-cyberpunk-v1",
    chapter_no: 3,
    title: "Neon Runaway",
    access_type: "PAID",
    pricing_model: "PAID",
    coin_cost: 2,
    pdf_file_name: "cyberpunk-ch03.pdf",
    pdf_file_size: 22100000,
    pdf_page_count: 30,
    content_status: "READY",
    published: true,
    created_at: "2026-07-11T00:00:00Z"
  },
  // Valkyrie Vol 1
  {
    id: "ch-valk-1",
    book_id: "book-valkyrie-v1",
    chapter_no: 1,
    title: "Fallen Wings",
    access_type: "FREE",
    pricing_model: "FREE",
    coin_cost: 0,
    pdf_file_name: "valkyrie-ch01.pdf",
    pdf_file_size: 25000000,
    pdf_page_count: 34,
    content_status: "READY",
    published: true,
    created_at: "2026-06-25T00:00:00Z"
  },
  {
    id: "ch-valk-2",
    book_id: "book-valkyrie-v1",
    chapter_no: 2,
    title: "Soul Drinker",
    access_type: "PAID",
    pricing_model: "PAID",
    coin_cost: 2,
    pdf_file_name: "valkyrie-ch02.pdf",
    pdf_file_size: 27500000,
    pdf_page_count: 36,
    content_status: "READY",
    published: true,
    created_at: "2026-06-29T00:00:00Z"
  },
  // Sakura Whispers Vol 1
  {
    id: "ch-sakura-1",
    book_id: "book-sakura-v1",
    chapter_no: 1,
    title: "Reunion under Pink Petals",
    access_type: "FREE",
    pricing_model: "FREE",
    coin_cost: 0,
    pdf_file_name: "sakura-ch01.pdf",
    pdf_file_size: 14200000,
    pdf_page_count: 20,
    content_status: "READY",
    published: true,
    created_at: "2026-05-01T00:00:00Z"
  },
  {
    id: "ch-sakura-2",
    book_id: "book-sakura-v1",
    chapter_no: 2,
    title: "Unopened Envelopes",
    access_type: "FREE",
    pricing_model: "FREE",
    coin_cost: 0,
    pdf_file_name: "sakura-ch02.pdf",
    pdf_file_size: 15600000,
    pdf_page_count: 22,
    content_status: "READY",
    published: true,
    created_at: "2026-05-15T00:00:00Z"
  }
];

// Access: ChapterUnlocks table
export const initialChapterUnlocks: ChapterUnlock[] = [
  {
    id: "unlock-1",
    user_id: "user-1",
    chapter_id: "ch-shatter-1",
    coins_paid: 0,
    source: "FREE_CHAPTER",
    unlocked_at: "2026-07-19T12:30:00Z",
    created_at: "2026-07-19T12:30:00Z"
  },
  {
    id: "unlock-2",
    user_id: "user-1",
    chapter_id: "ch-shatter-2",
    coins_paid: 0,
    source: "FREE_CHAPTER",
    unlocked_at: "2026-07-19T12:30:00Z",
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

// Reading: Progress table (Chapter and PDF position based)
export const initialReadingProgress: ReadingProgress[] = [
  {
    id: "prog-1",
    user_id: "user-1",
    book_id: "book-shatterfirst-v1",
    chapter_id: "ch-shatter-1",
    progress_percent: 50,
    last_pdf_page: 12,
    last_scroll_position: 1450,
    updated_at: "2026-07-19T12:30:00Z"
  }
];

// Wallet: Wallets table
export const initialWallets: Wallet[] = [
  {
    id: "wallet-1",
    user_id: "user-1",
    balance: 100, // 100 Kuroyomi Coins initial balance
    created_at: "2026-07-01T00:00:00Z"
  }
];

// Wallet: Transactions table
export const initialCoinTransactions: CoinTransaction[] = [
  {
    id: "tx-1",
    wallet_id: "wallet-1",
    type: "Credit",
    coins: 100,
    reason: "New User Registration Bonus",
    created_at: "2026-07-01T00:00:00Z"
  }
];

// Wallet: Coin Packages for recharge modal
export const initialCoinPackages: CoinPackage[] = [
  {
    id: "pkg-1",
    name: "Starter Pouch",
    coins: 10,
    price: 0.99,
    active: true
  },
  {
    id: "pkg-2",
    name: "Reader's Cache",
    coins: 50,
    price: 4.49,
    active: true
  },
  {
    id: "pkg-3",
    name: "Manga Vault",
    coins: 120,
    price: 9.99,
    active: true
  },
  {
    id: "pkg-4",
    name: "Collector's Hoard",
    coins: 300,
    price: 24.99,
    active: true
  }
];

// Payments: Orders & Transactions simulator tables
export const initialPaymentOrders: PaymentOrder[] = [];
export const initialPaymentTransactions: PaymentTransaction[] = [];
