# 📖 KuroYomi — Premium Manga & Ebook Reader Platform

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-Auth_Store-4338CA?logo=react&logoColor=white)](https://zustand.docs.pmnd.rs/)
[![Axios](https://img.shields.io/badge/Axios-HTTP_Client-5A29E4?logo=axios&logoColor=white)](https://axios-http.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**KuroYomi** is an enterprise-ready, full-stack digital manga, webtoon, and ebook platform built with React 19, TypeScript, Vite, and Zustand. It combines the cinematic aesthetic of **Netflix**, the ergonomic reader utility of **Kindle**, and the interactive catalog visual presentation of **Apple Books**, paired with a comprehensive **Admin CMS Portal** and a **production-grade Secure Token Authentication Architecture**.

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Secure Authentication & Token Architecture](#-secure-authentication--token-architecture)
3. [Key Features & Platform Modules](#-key-features--platform-modules)
   - [Reader Experience & Discovery](#1-reader-experience--discovery)
   - [Reader Engine](#2-immersive-reader-engine)
   - [Monetization & Coin Economy](#3-virtual-coin-economy--wallet)
   - [Library & Progress Tracking](#4-personal-library--reading-history)
   - [Admin CMS & DRM Studio](#5-admin-cms--drm-studio)
4. [Project Structure](#-project-structure)
5. [API Contract & Backend Integration](#-api-contract--backend-integration)
6. [Getting Started (End-to-End Guide)](#-getting-started-end-to-end-guide)
7. [Testing & Verification Guide](#-testing--verification-guide)
8. [Available Scripts](#-available-scripts)
9. [License](#-license)

---

## 🏛️ Architectural Overview

The platform uses a decoupled frontend/backend architecture designed for high security, smooth interactivity, and offline resilience:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 KUROYOMI CLIENT                                 │
│                                                                                 │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐  │
│  │   Zustand Auth Store │   │  User / State Engine │   │   React Router v6   │  │
│  │   • In-Memory Tokens │   │  • Wallet & Coins    │   │   • Reader Routes   │  │
│  │   • User Profile     │   │  • Bookmarks & Lib   │   │   • AdminRoute Guard│  │
│  │   • Session Restore  │   │  • Reading Progress  │   │   • ReturnUrl Flow  │  │
│  └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬──────────┘  │
│             │                          │                          │             │
│             ▼                          ▼                          ▼             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    Axios HTTP Client (withCredentials: true)              │  │
│  │     • Bearer Token Injection (from Zustand Memory)                        │  │
│  │     • Single-Flight 401 Interceptor Mutex (Queued Request Replay)         │  │
│  └──────────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────────┼───────────────────────────────────────┘
                                          │ HTTP / HTTPS (REST API + Cookies)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURE EBOOK BACKEND API                           │
│                                                                                 │
│   • POST /api/auth/login     ───>  Set-Cookie: refreshToken (HttpOnly, Secure)  │
│   • POST /api/auth/refresh   ───>  Rotates Cookie & Returns New Access Token    │
│   • POST /api/auth/logout    ───>  Revokes Session & Clears Refresh Cookie      │
│   • /api/admin/* (Protected) ───>  JWT AuthGuard & Role-Based Access (RolesGuard)│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Secure Authentication & Token Architecture

The authentication layer complies with strict web security standards against **XSS (Cross-Site Scripting)** and **CSRF (Cross-Site Request Forgery)** token theft:

### 1. Token Distribution Model
| Token Type | Storage Location | Accessible to JavaScript? | Transport Mechanism | Lifetime |
| :--- | :--- | :--- | :--- | :--- |
| **Access Token** | **Zustand (In-Memory Only)** | Yes (Memory only, wiped on page close) | `Authorization: Bearer <token>` | Short (e.g., 15m) |
| **Refresh Token** | **HttpOnly + Secure Cookie** | **NO** (`document.cookie` cannot read) | Auto-sent via `withCredentials: true` | Long (e.g., 7d) |

> [!IMPORTANT]
> Neither the access token nor the refresh token is ever stored in `localStorage`, `sessionStorage`, or Zustand `persist` middleware.

### 2. Single-Flight Token Refresh Flow
When an access token expires while multiple API requests are in flight:
1. The first `401 Unauthorized` triggers the refresh process (`POST /auth/refresh`).
2. Concurrent requests are paused and placed into a mutex queue (`failedQueue`).
3. Once the backend verifies the HttpOnly cookie and returns a new access token, the Zustand in-memory state is updated.
4. All queued requests are replayed with the new access token.
5. If the refresh token is expired or revoked, the queue is rejected, memory state is wiped, and the user is redirected to `/login`.

### 3. Page Reload / Session Restoration (`initAuth`)
Because the access token resides only in memory, reloading the browser (`F5`) resets the memory state. 
- On app mount, `AuthProvider` calls `initAuth()`.
- The client silently requests `POST /auth/refresh` (sending the browser's HttpOnly cookie).
- Upon success, the access token is populated and `GET /auth/me` fetches user details and role permissions.
- `isLoading` transitions to `false` without premature kicks to `/login`.

---

## 🌟 Key Features & Platform Modules

### 1. Reader Experience & Discovery
- **Hero Slider & Trending Shelves**: Auto-sliding banners and responsive carousels for spotlighted series, featured titles, and recent additions.
- **Adaptive Dual Navigation**:
  - **Desktop (Top Navbar)**: Live search dropdown with suggestions, quick-wallet balance pill, notifications, and profile menus.
  - **Mobile (Bottom Nav)**: Thumb-optimized navigation bar with animated tab transitions.
- **Advanced Catalog Filtering**: Multi-criteria search by genre, completion status, format, and keywords.

### 2. Immersive Reader Engine
- **Dual Reading Canvas**:
  - **Vertical Webtoon Scroll**: Continuous, seamless vertical image stream with page position tracking.
  - **Horizontal Manga Swipe**: Traditional page-by-page flip mode.
- **Ambient Lighting Modes**: Instant switch between **Normal (Dark)**, **Dim (Warm Sepia)**, and **Pitch Dark (OLED)**.
- **HUD & DRM Shield**: Auto-hiding control overlays, quick chapter switch drawer, page scrubber, and fullscreen reader toggle.

### 3. Virtual Coin Economy & Wallet
- **Monetization Gates**: Seamless coin-gating for premium chapters with instant balance validation and unlock confirmation.
- **Coin Wallet Dashboard**: Real-time balance tracker, recharge packages (e.g., Starter, Reader's Pack, Collector's Vault), and ledger transaction history.
- **Simulated Payment Gateway**: Sandbox Stripe checkout simulation logging order and transaction references.

### 4. Personal Library & Reading History
- **Categorized Shelves**: Instant switching between **Currently Reading**, **Bookmarked**, and **Completed** series.
- **Granular Progress Tracker**: Saves exact volume, chapter, and page coordinates to resume where you left off.

### 5. Admin CMS & DRM Studio (`/admin/*`)
A full administrative management portal protected by role guards (`AdminRoute`):
- **📊 Analytics Dashboard**: Live metrics for users, active readers, books, series, chapters, pages, circulating coins, and platform revenue.
- **📚 Series & Volume Manager**: Complete CRUD operations for manga series, volume hierarchies, and publishing metadata.
- **📦 Automated ZIP Ingestion Studio**: Batch upload of compressed manga archives (ZIP) with automatic chapter directory extraction, sequential page parsing, DRM compilation, and flexible Series / Volume assignment.
- **📑 Chapter & Page Reorder**: Chapter creation, coin pricing configuration, and deterministic drag-and-drop page re-indexing.
- **🔒 Digital DRM Pipeline Simulator**: WebP compression optimization and AES-256 DRM encryption simulator.
- **👥 User & Permission Center**: Account status moderation (`ACTIVE` / `SUSPENDED`) and role inspection.
- **💰 Pricing & Package Editor**: Real-time management of coin tier packages and pricing rules.

---

## 📂 Project Structure

```
ebook-reader-platform/
├── public/                  # Static assets and icons
├── src/
│   ├── admin/               # Admin CMS Portal
│   │   ├── books/           # Book management views
│   │   ├── chapters/        # Chapter sequencing views
│   │   ├── dashboard/       # Analytics dashboard & telemetry
│   │   ├── guards/          # AdminRoute (RBAC authentication guard)
│   │   ├── layout/          # AdminLayout sidebar & header
│   │   ├── pages/           # DRM compiler & page reorder views
│   │   ├── pricing/         # Coin package configuration
│   │   ├── series/          # Manga series management views
│   │   ├── uploads/         # Automated ZIP archive ingestion & DRM pipeline
│   │   ├── users/           # User moderation & role management
│   │   └── volumes/         # Volume & book grouping views
│   ├── assets/              # High-res covers, banners, and vectors
│   ├── components/
│   │   ├── common/          # BookCard, SkeletonCard, RechargeModal
│   │   └── layout/          # TopNavbar, BottomNavigation, GlobalFooter
│   ├── contexts/            # AuthContext (Zustand bridge) & UserContext (Simulator state)
│   ├── pages/               # Reader-facing application pages
│   │   ├── BookDetails/     # Manga detail page, chapters list & reviews
│   │   ├── Browse/          # Catalog search with multi-criteria filters
│   │   ├── Home/            # Hero slider, trending shelves, new releases
│   │   ├── Library/         # Bookmarks, reading history, saved series
│   │   ├── Login/           # Authentication portal (Login, Register, OTP, Reset)
│   │   ├── Profile/         # User profile, statistics, transaction history
│   │   ├── Reader/          # Webtoon vertical & Manga horizontal reading engine
│   │   └── Wallet/          # Coin refill, package checkout, transaction ledger
│   ├── services/            # API clients & backend integrations
│   │   ├── admin/           # adminServices.ts (CMS API & LS fallback)
│   │   ├── api.ts           # Axios client (withCredentials, interceptors, single-flight refresh)
│   │   ├── authApi.ts       # Auth endpoints (login, register, OTP, refresh, logout)
│   │   └── mockData.ts      # Initial seed datasets for local simulator
│   ├── store/
│   │   └── auth.store.ts    # Zustand In-Memory Auth Store
│   ├── types/               # Full TypeScript schemas and API contracts
│   ├── App.tsx              # Application shell & route configuration
│   ├── index.css            # Design tokens, variables & glassmorphism theme
│   └── main.tsx             # Application entry point & provider tree
├── .env.example             # Environment configuration template
├── package.json             # Dependencies and build scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 🔌 API Contract & Backend Integration

The frontend expects an API backend providing the following contract:

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Request Body | Response / Cookie |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Create account | `{ email, username, fullName, password, roleType }` | `{ message, email }` |
| `POST` | `/auth/verify-email` | Verify email OTP | `{ email, otp }` | `{ message }` |
| `POST` | `/auth/resend-verification-otp`| Resend verification OTP | `{ email }` | `{ message }` |
| `POST` | `/auth/login` | Login with credentials | `{ email, password }` | **Body:** `{ accessToken, user }`<br>**Cookie:** `refreshToken=<token>; HttpOnly; Secure; Path=/api/auth` |
| `POST` | `/auth/refresh` | Rotate tokens | *(Empty body; browser sends cookie)* | **Body:** `{ accessToken }`<br>**Cookie:** New `refreshToken` cookie |
| `POST` | `/auth/logout` | Invalidate current session | *(Empty body; browser sends cookie)* | **Cookie:** Clears `refreshToken` |
| `POST` | `/auth/logout-all` | Invalidate all sessions | `Authorization: Bearer <token>` | `{ message }` |
| `GET` | `/auth/me` | Fetch active user profile | `Authorization: Bearer <token>` | `JwtUser` object |
| `POST` | `/auth/forgot-password`| Request reset OTP | `{ email }` | `{ message }` |
| `POST` | `/auth/reset-password` | Reset password | `{ email, otp, newPassword }` | `{ message }` |

---

## 🚀 Getting Started (End-to-End Guide)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**
- Running backend API (e.g. `secure-ebook-api` running on `http://localhost:3000`)

### 1. Clone & Install
```bash
git clone https://github.com/krishnasaw8340/ebook-reader-platform.git
cd ebook-reader-platform
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
# URL pointing to your backend API gateway
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. Start Development Server
```bash
npm run dev
```
The app will be accessible at: `http://localhost:5173`

---

## 🧪 Testing & Verification Guide

### 1. Test Login & In-Memory Storage
1. Navigate to `/login`.
2. Sign in with test credentials (e.g., `admin@kuroyomi.com` / password).
3. Open **Chrome DevTools > Application**:
   - Check **Local Storage**: Verify **NO** `ky_access_token` or `ky_refresh_token` exists.
   - Check **Cookies**: Verify `refreshToken` is set with `HttpOnly` and `SameSite=Lax`.
   - In Console, run: `window.useAuthStore.getState()` to see `accessToken` held in memory.

### 2. Test Browser Reload & Silent Session Restore
1. While logged in, press `F5` to reload the page.
2. Watch the Network tab:
   - Request to `POST /api/auth/refresh` fires automatically.
   - `GET /api/auth/me` restores user credentials and roles.
   - User remains authenticated without seeing a login redirect.

### 3. Test Role-Based Protected Routes
1. With a standard `USER` account, navigate to `http://localhost:5173/admin`.
   - Verify the **403 Forbidden** barrier is displayed.
2. Log in with an `ADMIN` account.
   - Verify full access to the **Admin Portal** (`/admin/dashboard`, `/admin/books`, `/admin/users`, etc.).

### 4. Test Single-Flight Token Refresh
1. Wait for or simulate access token expiration.
2. Trigger multiple simultaneous API requests.
3. Observe Network tab:
   - Exactly **one** `/auth/refresh` call is initiated.
   - All pending requests resolve successfully with the renewed access token.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles TypeScript (`tsc -b`) and bundles production assets into `dist/`. |
| `npm run preview` | Locally serves the optimized production bundle from `dist/`. |
| `npm run lint` | Runs `oxlint` to analyze code quality and potential issues. |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.