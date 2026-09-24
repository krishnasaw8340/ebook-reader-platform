// Schema: auth
export interface User {
  id: string; // UUID PK
  email: string; // String Unique login
  username: string | null; // String? Optional
  password?: string; // String Hashed (optional on frontend)
  full_name: string; // String Display
  avatar_url: string | null; // String? Avatar
  is_email_verified: boolean; // Boolean Verified
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'; // Enum State
  created_at: string; // DateTime Created
  updated_at: string; // DateTime Updated
}

export interface Role {
  id: string; // UUID PK
  name: 'ADMIN' | 'USER'; // Enum ADMIN/USER
  description: string | null; // String? Desc
  created_at: string; // DateTime Created
}

export interface UserRole {
  id: string; // UUID PK
  user_id: string; // UUID FK
  role_id: string; // UUID FK
  assigned_at: string; // DateTime Assigned
}

export interface OTPVerification {
  id: string; // UUID PK
  user_id: string | null; // UUID? FK
  email: string; // String Email
  otp_code: string; // String OTP
  purpose: 'REGISTER' | 'LOGIN'; // Enum REGISTER/LOGIN
  expires_at: string; // DateTime Expiry
  attempts: number; // Int Attempts
  verified: boolean; // Boolean Verified
  created_at: string; // DateTime Created
}

export interface RefreshToken {
  id: string; // UUID PK
  user_id: string; // UUID FK
  token_hash: string; // String Hash
  expires_at: string; // DateTime Expiry
  revoked_at: string | null; // DateTime? Revoked
  created_at: string; // DateTime Created
}

// Schema: catalog
export type SeriesStatus = 'DRAFT' | 'ONGOING' | 'COMPLETED' | 'HIATUS' | 'PUBLISHED' | 'ARCHIVED';

export interface BookSeries {
  id: string; // UUID PK
  name?: string; // Franchise Name from Backend
  title: string; // Title alias for UI compatibility
  slug?: string; // Unique URL-friendly slug
  description: string | null; // Synopsis
  cover_image: string | null; // Cover image URL
  status: SeriesStatus; // Series publication status
  created_at: string; // Creation timestamp
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  volumes?: Volume[];
  books?: Book[];
}

export interface CreateSeriesPayload {
  name: string;
  slug?: string;
  description?: string;
  status?: SeriesStatus;
}

export interface UpdateSeriesPayload {
  name?: string;
  slug?: string;
  description?: string;
  status?: SeriesStatus;
}

export interface QuerySeriesParams {
  search?: string;
  status?: SeriesStatus;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedSeriesResponse {
  data: BookSeries[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Volume types & DTOs
export type VolumeStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Volume {
  id: string; // UUID PK
  series_id: string; // UUID FK
  seriesId?: string; // Backend camelCase alias
  volume_no: number; // Order in series
  volumeNumber?: number; // Backend camelCase alias
  title: string;
  slug?: string;
  description?: string | null;
  cover_image?: string | null;
  status: VolumeStatus;
  sortOrder?: number;
  sort_order?: number;
  release_date?: string | null;
  releaseDate?: string | null;
  publishedAt?: string | null;
  created_at: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  series?: BookSeries;
  books?: Book[];
}

export interface CreateVolumePayload {
  seriesId: string;
  volumeNumber: number;
  title?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  releaseDate?: string;
  status?: VolumeStatus;
  publishedAt?: string;
}

export interface UpdateVolumePayload {
  seriesId?: string;
  volumeNumber?: number;
  title?: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  releaseDate?: string;
  status?: VolumeStatus;
  publishedAt?: string;
}

export interface QueryVolumeParams {
  seriesId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface PaginatedVolumeResponse {
  data: Volume[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Book types & DTOs
export type BookStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED' | 'READY' | 'ONGOING' | 'COMPLETED' | 'PROCESSING';
export type PricingModel = 'FREE' | 'PER_CHAPTER' | 'PER_BOOK' | 'SUBSCRIPTION';

export interface Book {
  id: string; // UUID PK
  series_id: string; // UUID FK
  seriesId?: string; // Backend camelCase
  volume_id?: string | null; // Optional Volume FK (Supports Direct Series -> Book)
  volumeId?: string | null; // Backend camelCase
  title: string; // String Title
  japanese_title?: string | null;
  japaneseTitle?: string | null;
  slug?: string;
  summary: string | null; // String? Summary
  description?: string | null;
  language?: string; // 'English', 'Japanese', etc.
  languageId?: string;
  author?: string;
  authorId?: string;
  artist?: string;
  artistId?: string;
  category?: string;
  categoryId?: string;
  genres?: string[];
  genreIds?: string[];
  tags?: string[];
  tagIds?: string[];
  cover_image: string | null; // String? Cover
  coverImage?: string | null;
  banner_image?: string | null;
  bannerImage?: string | null;
  thumbnail_image?: string | null;
  thumbnailImage?: string | null;
  release_date?: string | null;
  releaseDate?: string | null;
  publishedAt?: string | null;

  // Book default pricing model
  pricing_model?: PricingModel;
  pricingModel?: PricingModel;
  coin_price: number; // Int Price (for PER_BOOK or default fallback)
  coinPrice?: number;
  default_chapter_coin_cost?: number;
  defaultChapterCoinCost?: number;
  default_free_chapters?: number;
  defaultFreeChapters?: number;
  is_premium?: boolean;
  isPremium?: boolean;

  status: BookStatus;
  chapter_count?: number;
  totalChapters?: number;
  averageRating?: number;
  totalViews?: number;
  created_at: string; // DateTime Created
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  series?: BookSeries;
  volume?: Volume;
  chapters?: Chapter[];
}

export interface CreateBookPayload {
  seriesId: string;
  volumeId?: string | null;
  title: string;
  japaneseTitle?: string;
  slug?: string;
  description?: string;
  authorId?: string;
  artistId?: string;
  languageId: string;
  categoryId: string;
  genreIds?: string[];
  tagIds?: string[];
  status?: BookStatus;
  pricingModel?: PricingModel;
  defaultChapterCoinCost?: number;
  defaultFreeChapters?: number;
  isPremium?: boolean;
  releaseDate?: string;
  publishedAt?: string;
}

export interface UpdateBookPayload {
  seriesId?: string;
  volumeId?: string | null;
  title?: string;
  japaneseTitle?: string;
  slug?: string;
  description?: string;
  authorId?: string;
  artistId?: string;
  languageId?: string;
  categoryId?: string;
  genreIds?: string[];
  tagIds?: string[];
  status?: BookStatus;
  pricingModel?: PricingModel;
  defaultChapterCoinCost?: number;
  defaultFreeChapters?: number;
  isPremium?: boolean;
  releaseDate?: string;
  publishedAt?: string;
}

export interface QueryBookParams {
  seriesId?: string;
  volumeId?: string;
  authorId?: string;
  artistId?: string;
  languageId?: string;
  categoryId?: string;
  genreId?: string;
  tagId?: string;
  status?: string;
  pricingModel?: string;
  isPremium?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface PaginatedBookResponse {
  data: Book[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface UploadJob {
  id: string;
  file_name: string;
  file_size?: number;
  series_id?: string;
  series_title?: string;
  volume_id?: string | null;
  volume_title?: string | null;
  book_title?: string;
  status: 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PUBLISHED';
  progress: number;
  stage?: 'Uploading' | 'Processing' | 'Extracting' | 'Validating' | 'Generating PDF preview' | 'Completed' | 'Failed';
  chapters_detected: number;
  pdf_pages_detected?: number;
  warnings?: string[];
  error?: string | null;
  detected_structure?: {
    series_title: string;
    volume_title?: string | null;
    book_title: string;
    chapters: Array<{
      chapter_no: number;
      title: string;
      pdf_page_count?: number;
      file_name?: string;
    }>;
  };
  started_at: string;
  completed_at?: string | null;
}

// Chapter types & DTOs
export type ChapterPricingModel = 'FREE' | 'PAID';
export type ChapterContentStatus = 'PENDING' | 'READY' | 'FAILED';

export interface Chapter {
  id: string; // UUID PK
  book_id: string; // UUID FK
  bookId?: string; // Backend camelCase
  chapter_no: number; // Int Order
  chapterNumber?: number; // Backend camelCase
  title: string; // String Title
  sort_order?: number;
  sortOrder?: number;
  access_type: ChapterPricingModel; // Enum FREE/PAID
  pricing_model?: ChapterPricingModel;
  pricingModel?: ChapterPricingModel;
  coin_cost: number; // Int Cost
  coinCost?: number;
  
  // PDF Content Metadata
  pdf_storage_key?: string | null;
  pdfStorageKey?: string | null;
  pdf_file_name?: string | null;
  pdfFileName?: string | null;
  pdf_file_size?: number | null;
  pdfFileSize?: number | null;
  pdf_page_count?: number | null;
  pdfPageCount?: number | null;
  pdf_checksum?: string | null;
  pdfChecksum?: string | null;
  content_status?: ChapterContentStatus;
  contentStatus?: ChapterContentStatus;

  published?: boolean;
  publishedAt?: string | null;
  created_at: string; // DateTime Created
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  book?: Book;
}

export interface CreateChapterPayload {
  bookId: string;
  chapterNumber: number;
  title?: string;
  sortOrder?: number;
  pricingModel?: ChapterPricingModel;
  coinCost?: number;
  pdfStorageKey?: string;
  pdfFileName?: string;
  pdfFileSize?: number;
  pdfPageCount?: number;
  pdfChecksum?: string;
  contentStatus?: ChapterContentStatus;
  published?: boolean;
  publishedAt?: string;
}

export interface UpdateChapterPayload {
  bookId?: string;
  chapterNumber?: number;
  title?: string;
  sortOrder?: number;
  pricingModel?: ChapterPricingModel;
  coinCost?: number;
  pdfStorageKey?: string;
  pdfFileName?: string;
  pdfFileSize?: number;
  pdfPageCount?: number;
  pdfChecksum?: string;
  contentStatus?: ChapterContentStatus;
  published?: boolean;
  publishedAt?: string;
}

export interface ChapterPdfUploadInitPayload {
  fileName: string;
  fileSize: number;
  mimeType?: string;
}

export interface ChapterPdfUploadInitResponse {
  chapterId: string;
  storageKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface ChapterPdfUploadCompletePayload {
  fileName: string;
  fileSize: number;
  pageCount?: number;
  checksum?: string;
}

export interface QueryChapterParams {
  bookId?: string;
  pricingModel?: string;
  published?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

export interface PaginatedChapterResponse {
  data: Chapter[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Chapter Unlock entity (Entitlement)
export interface ChapterUnlock {
  id: string; // UUID PK
  user_id: string; // UUID FK
  chapter_id: string; // UUID FK
  coins_paid: number;
  source: string;
  unlocked_at: string;
  created_at: string;
}

// Schema: reading
export interface UserLibrary {
  id: string; // UUID PK
  user_id: string; // UUID FK
  book_id: string; // UUID FK
  unlocked_at: string; // DateTime Unlocked
}

export interface ReadingProgress {
  id: string; // UUID PK
  user_id: string; // UUID FK
  book_id: string; // UUID FK
  chapter_id: string; // UUID FK
  progress_percent?: number;
  last_pdf_page?: number;
  last_scroll_position?: number;
  updated_at: string; // DateTime Updated
}

// Schema: wallet
export interface Wallet {
  id: string; // UUID PK
  user_id: string; // UUID FK
  balance: number; // Int Coins
  created_at: string; // DateTime Created
}

export interface CoinTransaction {
  id: string; // UUID PK
  wallet_id: string; // UUID FK
  type: 'Credit' | 'Debit'; // Enum Credit/Debit
  coins: number; // Int Amount
  reason: string; // String Reason
  created_at: string; // DateTime Created
}

export interface CoinPackage {
  id: string; // UUID PK
  name: string; // String Package
  coins: number; // Int Coins
  price: number; // Decimal Price
  active: boolean; // Boolean Active
}

// Schema: payments
export interface PaymentOrder {
  id: string; // UUID PK
  user_id: string; // UUID FK
  package_id: string; // UUID FK
  amount: number; // Decimal Amount
  status: 'PENDING' | 'PAID' | 'FAILED'; // Enum Status
  created_at: string; // DateTime Created
}

export interface PaymentTransaction {
  id: string; // UUID PK
  order_id: string; // UUID FK
  gateway: string; // String Gateway
  gateway_txn_id: string; // String Txn Ref
  status: 'PENDING' | 'SUCCESS' | 'FAILED'; // Enum Status
  paid_at: string | null; // DateTime? Paid
}
