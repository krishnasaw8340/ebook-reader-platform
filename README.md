# 📖 KuroYomi — Premium Manga, Webtoon & Ebook Platform

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-Auth_Store-4338CA?logo=react&logoColor=white)](https://zustand.docs.pmnd.rs/)
[![Axios](https://img.shields.io/badge/Axios-HTTP_Client-5A29E4?logo=axios&logoColor=white)](https://axios-http.com/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-Direct_Upload-FF9900?logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**KuroYomi** is an enterprise-grade digital manga, webtoon, light novel, and ebook reading platform built with **React 19**, **TypeScript**, **Vite**, and **Zustand**. Designed with the rich visual immersion of **Mythtoons** and **Netflix**, the ergonomic reader utility of **Kindle**, and the modern catalog aesthetic of **Apple Books**, KuroYomi delivers an end-to-end reader storefront and an administrative publishing CMS.

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Secure Authentication & Token Architecture](#-secure-authentication--token-architecture)
3. [Key Features & Platform Modules](#-key-features--platform-modules)
   - [Reader Discovery & MythToons UI/UX](#1-reader-discovery--mythtoons-uiux)
   - [Dual-Engine Reader](#2-dual-engine-immersive-reader)
   - [Virtual Coin Economy & Chapter Monetization](#3-virtual-coin-economy--chapter-monetization)
   - [Personal Library & Cloud Progress](#4-personal-library--cloud-progress)
   - [Admin Publishing CMS & Book Wizard](#5-admin-publishing-cms--book-wizard)
   - [Direct Cloud Storage (AWS S3) Pipeline](#6-direct-cloud-storage-aws-s3-pipeline)
4. [Project Structure](#-project-structure)
5. [API Contract & Backend Endpoints](#-api-contract--backend-endpoints)
6. [Getting Started (End-to-End Guide)](#-getting-started-end-to-end-guide)
7. [Testing & Verification](#-testing--verification)
8. [Available Scripts](#-available-scripts)
9. [License](#-license)

---

## 🏛️ Architectural Overview

The application adopts a decoupled frontend/backend architecture prioritizing bank-grade auth token security, zero memory-leak state management, and direct-to-cloud asset streaming:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 KUROYOMI CLIENT                                 │
│                                                                                 │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐  │
│  │   Zustand Auth Store │   │  User & Wallet Store │   │   React Router v6   │  │
│  │   • In-Memory Tokens │   │  • Coin Balance      │   │   • Storefront & Read│ │
│  │   • User Profile     │   │  • Bookmarks & Lib   │   │   • Admin Protected │  │
│  │   • Session Restore  │   │  • Reading History   │   │   • Auth Interceptor│  │
│  └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬──────────┘  │
│             │                          │                          │             │
│             ▼                          ▼                          ▼             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    Axios HTTP Client (withCredentials: true)              │  │
│  │     • Bearer Token Injection (from Zustand in-memory state)               │  │
│  │     • Single-Flight 401 Interceptor Mutex (Token Rotation & Replay)       │  │
│  └──────────────────────────────────────┬────────────────────────────────────┘  │
│                                         │                                       │
│  ┌──────────────────────────────────────▼────────────────────────────────────┐  │
│  │            Direct AWS S3 Presigned Upload Engine (XMLHttpRequest)          │  │
│  │     • Clean binary streams (No auth token leakage to S3 storage)          │  │
│  │     • Real-time progress tracking for covers & multi-part chapter PDFs    │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │ HTTP / HTTPS (REST API + Cookies)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURE EBOOK BACKEND API                           │
│                                                                                 │
│   • POST /api/auth/login     ───>  Set-Cookie: refreshToken (HttpOnly, Secure)  │
│   • POST /api/auth/refresh   ───>  Rotates Cookie & Returns New Access Token    │
│   • POST /api/books/*/upload-url ──> Returns short-lived S3 PUT Presigned URL   │
│   • POST /api/books/*/complete   ──> Magic-byte S3 validation & DB record       │
│   • /api/admin/* (Protected) ───>  JWT AuthGuard & Role-Based Access (RolesGuard)│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Secure Authentication & Token Architecture

The authentication layer follows web security best practices against **XSS (Cross-Site Scripting)** and **CSRF (Cross-Site Request Forgery)** token compromise:

### 1. Token Distribution Model
| Token Type | Storage Location | Accessible to JS? | Transport Mechanism | Lifetime |
| :--- | :--- | :--- | :--- | :--- |
| **Access Token** | **Zustand (In-Memory Only)** | Yes (Memory only; cleared on tab close) | `Authorization: Bearer <token>` | Short (e.g., 15m) |
| **Refresh Token** | **HttpOnly + Secure Cookie** | **NO** (`document.cookie` cannot access) | Auto-sent via `withCredentials: true` | Long (e.g., 7d) |

> [!IMPORTANT]
> Neither the access token nor the refresh token is stored in `localStorage`, `sessionStorage`, or Zustand `persist` middleware.

### 2. Single-Flight Token Refresh Flow
When an access token expires while multiple asynchronous API requests are in flight:
1. The first `401 Unauthorized` triggers the refresh process (`POST /auth/refresh`).
2. Concurrent requests are paused and placed into a mutex queue (`failedQueue`).
3. Once the backend verifies the HttpOnly cookie and returns a new access token, the Zustand in-memory state is updated.
4. All queued requests are replayed seamlessly with the renewed access token.
5. If the refresh token is expired or revoked, the queue is rejected, memory state is wiped, and the user is redirected to `/login`.

---

## 🌟 Key Features & Platform Modules

### 1. Reader Discovery & MythToons UI/UX
- **Cinematic Dark Aesthetics**: Glassmorphism cards, glowing accent gradients, and fluid micro-animations.
- **Spotlight Hero Slider**: Auto-sliding banners and spotlight carousels for trending releases and top webtoons.
- **Smart Catalog & Filter Engine**: Instant search and filtering by genre, demographic, status (`ONGOING`, `COMPLETED`), language, and pricing model.
- **Adaptive Dual Navigation**:
  - **Desktop (Top Navbar)**: Quick search with autocomplete, real-time coin wallet pill, notifications, and profile menus.
  - **Mobile (Bottom Nav)**: Thumb-friendly navigation bar with tactile feedback and animated transitions.

### 2. Dual-Engine Immersive Reader
- **Vertical Webtoon Canvas**: Continuous, high-performance vertical image stream with live scroll coordinate tracking.
- **Horizontal Manga Swipe**: Traditional page-by-page flip mode with keyboard navigation (`Arrow Left`/`Right`) and touch swipe.
- **Ambient Lighting Modes**: Instant switch between **Normal (Dark)**, **Dim (Warm Sepia)**, and **OLED Pitch Dark**.
- **HUD & Reader Controls**: Auto-hiding control overlays, quick chapter drawer, progress scrubber, and fullscreen toggle.

### 3. Virtual Coin Economy & Chapter Monetization
- **Simplified 2-Tier Monetization**:
  - 🟢 **100% FREE**: All chapters and pages are accessible to any reader.
  - 🟡 **PAID (Coins)**: Specific chapters require coin unlock (e.g., 2 Coins per chapter).
- **Flexible Free Preview Window**: Specify default initial free chapters (e.g. Chapter 1-3 free, subsequent chapters paid).
- **Coin Wallet Dashboard**: Real-time balance tracker, recharge packages (Starter, Reader's Pack, Collector's Vault), and simulated Stripe checkout.

### 4. Personal Library & Cloud Progress
- **Organized Reading Shelves**: Instant switching between **Currently Reading**, **Bookmarked**, and **Completed**.
- **Granular Progress Coordinates**: Automatically saves exact chapter and page coordinates to resume where you left off.

### 5. Admin Publishing CMS & Book Wizard
A comprehensive administrative management suite protected by `AdminRoute` role guards:
- **🧙 Unified Manga & Book Creation Wizard (`BookWizard.tsx`)**:
  - **Option A (Standalone Manga / Book)**: For one-shots, webcomics, and single novels. Automatically provisions the franchise Series and default Book in one seamless 2-step form.
  - **Option B (Part of an Existing Franchise)**: For sequels, seasons, and multi-part series with searchable series selectors and optional volume assignment.
- **📑 Multi-PDF Chapter Ingestion**: Upload one or multiple PDF assets per chapter with auto-filename parsing (e.g., `Chapter_01_Title.pdf`).
- **📚 Franchise Series Catalog (`/admin/series`)**: Manage overarching franchise titles, synopses, and serialization statuses with integrated cover management and quick navigation.
- **📊 Analytics & Revenue Dashboard**: Real-time metrics for active readers, book catalog count, circulating coins, and unlocks.

### 6. Direct Cloud Storage (AWS S3) Pipeline
- **Direct-to-S3 Presigned PUT Uploads**: Artwork and multi-megabyte chapter PDFs upload directly from the browser to AWS S3, bypassing backend memory overhead.
- **Header Isolation**: Uses clean `XMLHttpRequest` streams without authorization headers to prevent S3 `403 SignatureDoesNotMatch` rejections.
- **Live Progress & Error Recovery**: Accurate upload percentage indicator and automatic image fallback badges across all admin tables.

---

## 📂 Project Structure

```
ebook-reader-platform/
├── public/                  # Static assets and icons
├── src/
│   ├── admin/               # Admin CMS Portal
│   │   ├── books/           # Book wizard, detail workspace, and cover uploader
│   │   ├── chapters/        # Chapter sequencing and multi-PDF management
│   │   ├── dashboard/       # Real-time analytics and telemetry
│   │   ├── guards/          # AdminRoute (RBAC authentication guard)
│   │   ├── layout/          # AdminLayout sidebar, topbar, and breadcrumbs
│   │   ├── series/          # Manga franchise series management
│   │   ├── uploads/         # Batch ZIP ingestion & PDF DRM pipeline
│   │   ├── users/           # User moderation and role management
│   │   └── volumes/         # Optional volume hierarchy management
│   ├── assets/              # High-res vector graphics and theme assets
│   ├── components/
│   │   ├── common/          # BookCard, SkeletonCard, RechargeModal
│   │   └── layout/          # TopNavbar, BottomNavigation, GlobalFooter
│   ├── contexts/            # UserContext (Wallet & Reading Progress)
│   ├── pages/               # Reader-Facing Application Pages
│   │   ├── BookDetails/     # Manga detail view, chapters list & reviews
│   │   ├── Browse/          # Catalog search with multi-criteria filters
│   │   ├── Home/            # Spotlight slider, trending shelves, new releases
│   │   ├── Library/         # Bookmarks, reading history, saved series
│   │   ├── Login/           # Auth portal (Login, Register, OTP, Reset Password)
│   │   ├── Profile/         # User profile, statistics, transaction history
│   │   ├── Reader/          # Webtoon vertical & Manga horizontal reading engine
│   │   └── Wallet/          # Coin refill, package checkout, transaction ledger
│   ├── services/            # API Services & Cloud Integration
│   │   ├── admin/           # adminServices.ts (CMS API bridge)
│   │   ├── api.ts           # Axios client (single-flight token refresh)
│   │   ├── authApi.ts       # Auth endpoints (login, register, OTP, refresh)
│   │   ├── bookService.ts   # Books catalog & S3 cover upload service
│   │   ├── chapterService.ts# Chapters catalog & S3 PDF upload service
│   │   └── seriesService.ts # Series franchise catalog service
│   ├── store/
│   │   └── auth.store.ts    # Zustand In-Memory Auth Store
│   ├── styles/              # Design tokens and themes (themes.css)
│   ├── types/               # Full TypeScript schemas and API contracts
│   ├── App.tsx              # Application shell & route configuration
│   ├── index.css            # Global CSS variables & glassmorphism system
│   └── main.tsx             # Application entry point & provider tree
├── .env.example             # Environment configuration template
├── package.json             # Dependencies and build scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 🔌 API Contract & Backend Endpoints

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Request Body | Response / Cookie |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Create account | `{ email, username, fullName, password, roleType }` | `{ message, email }` |
| `POST` | `/auth/verify-email` | Verify email OTP | `{ email, otp }` | `{ message }` |
| `POST` | `/auth/login` | Authenticate credentials | `{ email, password }` | **Body:** `{ accessToken, user }`<br>**Cookie:** `refreshToken=<token>; HttpOnly; Secure` |
| `POST` | `/auth/refresh` | Rotate access token | *(Empty body; browser sends cookie)* | **Body:** `{ accessToken }`<br>**Cookie:** New `refreshToken` cookie |
| `POST` | `/auth/logout` | Invalidate session | *(Empty body; browser sends cookie)* | **Cookie:** Clears `refreshToken` |
| `GET` | `/auth/me` | Fetch active profile | `Authorization: Bearer <token>` | `JwtUser` object |

### Catalog & Cloud Storage Endpoints
| Method | Endpoint | Description | Request Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/books` | List books with search & filters | Query params: `search`, `status`, `seriesId`, `limit` |
| `POST` | `/api/books` | Create book release | `CreateBookPayload` |
| `POST` | `/api/books/:id/cover/upload-url` | Generate S3 presigned PUT URL | `{ fileName, fileSize, contentType }` |
| `POST` | `/api/books/:id/cover/complete` | Confirm S3 upload & save metadata | `{ fileName }` |
| `POST` | `/api/chapters/:id/content/upload-url`| Generate S3 presigned PUT URL for PDF | `{ fileName, fileSize, contentType }` |
| `POST` | `/api/chapters/:id/content/complete` | Confirm PDF upload & extract pages | `{ fileName, fileSize, pageCount }` |

---

## 🚀 Getting Started (End-to-End Guide)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** / **yarn** / **pnpm**
- Backend API running (e.g. `secure-ebook-api` running on `http://localhost:3000`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/krishnasaw8340/ebook-reader-platform.git
cd ebook-reader-platform
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Backend API gateway
VITE_API_BASE_URL=http://localhost:3000/api

# Max cover upload size in MB (Client pre-check)
VITE_MAX_BOOK_COVER_SIZE_MB=10
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Testing & Verification

1. **Test Standalone Manga Creation**:
   - Navigate to `/admin/books/new`.
   - Select **Option A: Standalone Manga / Book**.
   - Enter title, synopsis, select category, upload cover artwork, and attach chapter PDFs.
   - Submit and verify automatic creation of both Series and Book records.

2. **Test Direct S3 Cloud Cover Upload**:
   - Navigate to `/admin/series` or `/admin/books/:id`.
   - Click **Upload Cover** / **Replace Cover**, pick a JPEG/PNG/WebP image.
   - Verify upload progress indicator reaches 100% and the cover is displayed live.

3. **Test Single-Flight Auth Refresh**:
   - Reload the page while logged in (`F5`).
   - Confirm silent token refresh occurs via `POST /api/auth/refresh` without kick-outs to `/login`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles TypeScript (`tsc -b`) and produces production bundle in `dist/`. |
| `npm run preview` | Locally serves the optimized production bundle from `dist/`. |
| `npm run lint` | Runs code quality checks and linter. |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.