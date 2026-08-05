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
export interface BookSeries {
  id: string; // UUID PK
  title: string; // String Title
  description: string | null; // String? Desc
  cover_image: string | null; // String? Cover
  status: 'ONGOING' | 'COMPLETED'; // Enum Status
  created_at: string; // DateTime Created
}

export interface Book {
  id: string; // UUID PK
  series_id: string; // UUID FK
  title: string; // String Title
  summary: string | null; // String? Summary
  cover_image: string | null; // String? Cover
  coin_price: number; // Int Price
  status: 'ONGOING' | 'COMPLETED'; // Enum Status
  created_at: string; // DateTime Created
}

export interface Chapter {
  id: string; // UUID PK
  book_id: string; // UUID FK
  chapter_no: number; // Int Order
  title: string; // String Title
  access_type: 'FREE' | 'PARTIAL' | 'PAID'; // Enum FREE/PARTIAL/PAID
  free_pages: number; // Int Free
  coin_cost: number; // Int Cost
  created_at: string; // DateTime Created
}

export interface Page {
  id: string; // UUID PK
  chapter_id: string; // UUID FK
  page_no: number; // Int Order
  image_url: string; // String Image
  created_at: string; // DateTime Created
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
  page_id: string; // UUID FK (points to the page id)
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
