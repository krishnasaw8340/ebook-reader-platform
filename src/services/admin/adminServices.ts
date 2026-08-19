import { api } from '../api';
import type {
    Book,
    BookSeries,
    Chapter,
    Page,
    User,
    CoinPackage,
} from '../../types';
import {
    initialBookSeries,
    initialBooks,
    initialChapters,
    initialPages,
    initialUsers,
    initialCoinPackages
} from '../mockData';

// Local storage keys
const LS_SERIES = 'ky_book_series';
const LS_BOOKS = 'ky_books';
const LS_CHAPTERS = 'ky_chapters';
const LS_PAGES = 'ky_pages';
const LS_USERS = 'ky_admin_users';
const LS_PACKAGES = 'ky_coin_packages';

const getFromLS = <T>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
};

const saveToLS = <T>(key: string, data: T) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
    }
};

// ==========================================
// 1. DASHBOARD SERVICE
// ==========================================
export interface DashboardStats {
    totalUsers: number;
    totalActiveUsers: number;
    totalBooks: number;
    totalSeries: number;
    totalChapters: number;
    totalPages: number;
    totalPublishedBooks: number;
    totalPublishedChapters: number;
    totalCoinsCirculating: number;
    totalRevenue: number;
    recentContent: Array<{ id: string; title: string; type: string; date: string; status: string }>;
    recentUsers: Array<{ id: string; name: string; email: string; role: string; date: string }>;
}

export const adminDashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        try {
            const res = await api.get<DashboardStats>('/admin/dashboard/stats');
            return res.data;
        } catch {
            const series = getFromLS<BookSeries[]>(LS_SERIES, initialBookSeries);
            const books = getFromLS<Book[]>(LS_BOOKS, initialBooks);
            const chapters = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            const pages = getFromLS<Page[]>(LS_PAGES, initialPages);
            const users = getFromLS<User[]>(LS_USERS, initialUsers);

            return {
                totalUsers: users.length + 142,
                totalActiveUsers: users.filter(u => u.status === 'ACTIVE').length + 118,
                totalBooks: books.length,
                totalSeries: series.length,
                totalChapters: chapters.length,
                totalPages: pages.length,
                totalPublishedBooks: books.filter(b => b.status === 'COMPLETED' || b.status === 'ONGOING').length,
                totalPublishedChapters: chapters.length,
                totalCoinsCirculating: 14520,
                totalRevenue: 2840.50,
                recentContent: series.slice(0, 5).map(s => ({
                    id: s.id,
                    title: s.title,
                    type: 'Manga Series',
                    date: s.created_at || new Date().toISOString(),
                    status: s.status
                })),
                recentUsers: users.slice(0, 5).map(u => ({
                    id: u.id,
                    name: u.full_name || u.username || 'Reader',
                    email: u.email,
                    role: 'ADMIN',
                    date: u.created_at || new Date().toISOString()
                }))
            };
        }
    }
};

// ==========================================
// 2. SERIES SERVICE
// ==========================================
export const adminSeriesService = {
    getAll: async (search?: string): Promise<BookSeries[]> => {
        try {
            const res = await api.get<BookSeries[]>('/admin/series', { params: { search } });
            return res.data;
        } catch {
            let list = getFromLS<BookSeries[]>(LS_SERIES, initialBookSeries);
            if (search && search.trim()) {
                const q = search.toLowerCase();
                list = list.filter(s => s.title.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)));
            }
            return list;
        }
    },

    getById: async (id: string): Promise<BookSeries | undefined> => {
        try {
            const res = await api.get<BookSeries>(`/admin/series/${id}`);
            return res.data;
        } catch {
            const list = getFromLS<BookSeries[]>(LS_SERIES, initialBookSeries);
            return list.find(s => s.id === id);
        }
    },

    create: async (data: Omit<BookSeries, 'id' | 'created_at'>): Promise<BookSeries> => {
        try {
            const res = await api.post<BookSeries>('/admin/series', data);
            return res.data;
        } catch {
            const list = getFromLS<BookSeries[]>(LS_SERIES, initialBookSeries);
            const newItem: BookSeries = {
                ...data,
                id: `series-${Date.now()}`,
                created_at: new Date().toISOString()
            };
            const updated = [newItem, ...list];
            saveToLS(LS_SERIES, updated);
            return newItem;
        }
    },

    update: async (id: string, data: Partial<BookSeries>): Promise<BookSeries> => {
        try {
            const res = await api.put<BookSeries>(`/admin/series/${id}`, data);
            return res.data;
        } catch {
            const list = getFromLS<BookSeries[]>(LS_SERIES, initialBookSeries);
            let target: BookSeries | undefined;
            const updated = list.map(s => {
                if (s.id === id) {
                    target = { ...s, ...data };
                    return target;
                }
                return s;
            });
            saveToLS(LS_SERIES, updated);
            if (!target) throw new Error('Series not found');
            return target;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/admin/series/${id}`);
        } catch {
            const list = getFromLS<BookSeries[]>(LS_SERIES, initialBookSeries);
            saveToLS(LS_SERIES, list.filter(s => s.id !== id));
        }
    },

    toggleStatus: async (id: string): Promise<BookSeries> => {
        const item = await adminSeriesService.getById(id);
        if (!item) throw new Error('Series not found');
        const nextStatus = item.status === 'ONGOING' ? 'COMPLETED' : 'ONGOING';
        return adminSeriesService.update(id, { status: nextStatus });
    }
};

// ==========================================
// 3. BOOK / VOLUME SERVICE
// ==========================================
export const adminBookService = {
    getAll: async (params?: { seriesId?: string; search?: string; status?: string }): Promise<Book[]> => {
        try {
            const res = await api.get<Book[]>('/admin/books', { params });
            return res.data;
        } catch {
            let list = getFromLS<Book[]>(LS_BOOKS, initialBooks);
            if (params?.seriesId) {
                list = list.filter(b => b.series_id === params.seriesId);
            }
            if (params?.status) {
                list = list.filter(b => b.status === params.status);
            }
            if (params?.search) {
                const q = params.search.toLowerCase();
                list = list.filter(b => b.title.toLowerCase().includes(q) || (b.summary && b.summary.toLowerCase().includes(q)));
            }
            return list;
        }
    },

    getById: async (id: string): Promise<Book | undefined> => {
        try {
            const res = await api.get<Book>(`/admin/books/${id}`);
            return res.data;
        } catch {
            const list = getFromLS<Book[]>(LS_BOOKS, initialBooks);
            return list.find(b => b.id === id);
        }
    },

    create: async (data: Omit<Book, 'id' | 'created_at'>): Promise<Book> => {
        try {
            const res = await api.post<Book>('/admin/books', data);
            return res.data;
        } catch {
            const list = getFromLS<Book[]>(LS_BOOKS, initialBooks);
            const newItem: Book = {
                ...data,
                id: `book-${Date.now()}`,
                created_at: new Date().toISOString()
            };
            const updated = [newItem, ...list];
            saveToLS(LS_BOOKS, updated);
            return newItem;
        }
    },

    update: async (id: string, data: Partial<Book>): Promise<Book> => {
        try {
            const res = await api.put<Book>(`/admin/books/${id}`, data);
            return res.data;
        } catch {
            const list = getFromLS<Book[]>(LS_BOOKS, initialBooks);
            let target: Book | undefined;
            const updated = list.map(b => {
                if (b.id === id) {
                    target = { ...b, ...data };
                    return target;
                }
                return b;
            });
            saveToLS(LS_BOOKS, updated);
            if (!target) throw new Error('Book not found');
            return target;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/admin/books/${id}`);
        } catch {
            const list = getFromLS<Book[]>(LS_BOOKS, initialBooks);
            saveToLS(LS_BOOKS, list.filter(b => b.id !== id));
        }
    }
};

// ==========================================
// 4. CHAPTER SERVICE
// ==========================================
export const adminChapterService = {
    getAll: async (bookId?: string): Promise<Chapter[]> => {
        try {
            const res = await api.get<Chapter[]>('/admin/chapters', { params: { bookId } });
            return res.data;
        } catch {
            let list = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            if (bookId) {
                list = list.filter(c => c.book_id === bookId);
            }
            return list.sort((a, b) => a.chapter_no - b.chapter_no);
        }
    },

    getById: async (id: string): Promise<Chapter | undefined> => {
        try {
            const res = await api.get<Chapter>(`/admin/chapters/${id}`);
            return res.data;
        } catch {
            const list = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            return list.find(c => c.id === id);
        }
    },

    create: async (data: Omit<Chapter, 'id' | 'created_at'>): Promise<Chapter> => {
        try {
            const res = await api.post<Chapter>('/admin/chapters', data);
            return res.data;
        } catch {
            const list = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            const newItem: Chapter = {
                ...data,
                id: `ch-${Date.now()}`,
                created_at: new Date().toISOString()
            };
            const updated = [...list, newItem];
            saveToLS(LS_CHAPTERS, updated);
            return newItem;
        }
    },

    update: async (id: string, data: Partial<Chapter>): Promise<Chapter> => {
        try {
            const res = await api.put<Chapter>(`/admin/chapters/${id}`, data);
            return res.data;
        } catch {
            const list = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            let target: Chapter | undefined;
            const updated = list.map(c => {
                if (c.id === id) {
                    target = { ...c, ...data };
                    return target;
                }
                return c;
            });
            saveToLS(LS_CHAPTERS, updated);
            if (!target) throw new Error('Chapter not found');
            return target;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/admin/chapters/${id}`);
        } catch {
            const list = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            saveToLS(LS_CHAPTERS, list.filter(c => c.id !== id));
        }
    }
};

// ==========================================
// 5. PAGE SERVICE (WITH DETERMINISTIC REORDERING)
// ==========================================
export const adminPageService = {
    getByChapter: async (chapterId: string): Promise<Page[]> => {
        try {
            const res = await api.get<Page[]>(`/admin/chapters/${chapterId}/pages`);
            return res.data.sort((a, b) => a.page_no - b.page_no);
        } catch {
            const list = getFromLS<Page[]>(LS_PAGES, initialPages);
            return list
                .filter(p => p.chapter_id === chapterId)
                .sort((a, b) => a.page_no - b.page_no);
        }
    },

    uploadPages: async (chapterId: string, imageUrls: string[]): Promise<Page[]> => {
        try {
            const res = await api.post<Page[]>(`/admin/chapters/${chapterId}/pages`, { images: imageUrls });
            return res.data;
        } catch {
            const list = getFromLS<Page[]>(LS_PAGES, initialPages);
            const currentChapterPages = list.filter(p => p.chapter_id === chapterId);
            let startNo = currentChapterPages.length;

            const newPages: Page[] = imageUrls.map((url, idx) => ({
                id: `page-${chapterId}-${Date.now()}-${idx + 1}`,
                chapter_id: chapterId,
                page_no: startNo + idx + 1,
                image_url: url,
                created_at: new Date().toISOString()
            }));

            const updated = [...list, ...newPages];
            saveToLS(LS_PAGES, updated);
            return newPages;
        }
    },

    reorderPages: async (chapterId: string, orderedPageIds: string[]): Promise<Page[]> => {
        try {
            const res = await api.put<Page[]>(`/admin/chapters/${chapterId}/pages/reorder`, { orderedPageIds });
            return res.data;
        } catch {
            const list = getFromLS<Page[]>(LS_PAGES, initialPages);
            const updated = list.map(page => {
                if (page.chapter_id === chapterId) {
                    const newIndex = orderedPageIds.indexOf(page.id);
                    if (newIndex !== -1) {
                        return { ...page, page_no: newIndex + 1 };
                    }
                }
                return page;
            });
            saveToLS(LS_PAGES, updated);
            return updated
                .filter(p => p.chapter_id === chapterId)
                .sort((a, b) => a.page_no - b.page_no);
        }
    },

    deletePage: async (pageId: string): Promise<void> => {
        try {
            await api.delete(`/admin/pages/${pageId}`);
        } catch {
            const list = getFromLS<Page[]>(LS_PAGES, initialPages);
            const target = list.find(p => p.id === pageId);
            if (!target) return;
            const remaining = list.filter(p => p.id !== pageId);
            // Re-sequence remaining pages for this chapter
            let currentNo = 1;
            const reindexed = remaining.map(p => {
                if (p.chapter_id === target.chapter_id) {
                    return { ...p, page_no: currentNo++ };
                }
                return p;
            });
            saveToLS(LS_PAGES, reindexed);
        }
    },

    replacePageImage: async (pageId: string, newImageUrl: string): Promise<Page> => {
        try {
            const res = await api.put<Page>(`/admin/pages/${pageId}`, { image_url: newImageUrl });
            return res.data;
        } catch {
            const list = getFromLS<Page[]>(LS_PAGES, initialPages);
            let target: Page | undefined;
            const updated = list.map(p => {
                if (p.id === pageId) {
                    target = { ...p, image_url: newImageUrl };
                    return target;
                }
                return p;
            });
            saveToLS(LS_PAGES, updated);
            if (!target) throw new Error('Page not found');
            return target;
        }
    }
};

// ==========================================
// 6. USER MANAGEMENT SERVICE
// ==========================================
export interface AdminUserListItem extends User {
    roles: string[];
}

export const adminUserService = {
    getAll: async (params?: { search?: string; status?: string; role?: string }): Promise<AdminUserListItem[]> => {
        try {
            const res = await api.get<AdminUserListItem[]>('/admin/users', { params });
            return res.data;
        } catch {
            const baseUsers = getFromLS<User[]>(LS_USERS, initialUsers);
            const enriched: AdminUserListItem[] = baseUsers.map(u => ({
                ...u,
                roles: u.email.includes('admin') ? ['ADMIN', 'USER'] : ['USER']
            }));

            // Add demo records for comprehensive management view
            const demoUsers: AdminUserListItem[] = [
                {
                    id: 'usr-admin-demo',
                    email: 'admin@kuroyomi.com',
                    username: 'ChiefEditor',
                    full_name: 'Lead Manga Editor',
                    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&width=150',
                    is_email_verified: true,
                    status: 'ACTIVE',
                    roles: ['ADMIN'],
                    created_at: '2026-06-01T10:00:00Z',
                    updated_at: '2026-08-01T12:00:00Z'
                },
                {
                    id: 'usr-reader-1',
                    email: 'kenji.sato@example.jp',
                    username: 'NeoReaderX',
                    full_name: 'Kenji Sato',
                    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&width=150',
                    is_email_verified: true,
                    status: 'ACTIVE',
                    roles: ['USER'],
                    created_at: '2026-07-15T08:30:00Z',
                    updated_at: '2026-08-10T14:20:00Z'
                },
                {
                    id: 'usr-reader-2',
                    email: 'sarah.m@comicfan.net',
                    username: 'ValkyrieFan',
                    full_name: 'Sarah Miller',
                    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&width=150',
                    is_email_verified: true,
                    status: 'ACTIVE',
                    roles: ['USER'],
                    created_at: '2026-07-20T11:15:00Z',
                    updated_at: '2026-08-12T09:00:00Z'
                },
                {
                    id: 'usr-reader-3',
                    email: 'tetsuo99@cyber.io',
                    username: 'CyberTetsuo',
                    full_name: 'Tetsuo Shima',
                    avatar_url: null,
                    is_email_verified: false,
                    status: 'PENDING',
                    roles: ['USER'],
                    created_at: '2026-08-18T16:45:00Z',
                    updated_at: '2026-08-18T16:45:00Z'
                }
            ];

            let all = [...demoUsers, ...enriched];
            if (params?.search) {
                const q = params.search.toLowerCase();
                all = all.filter(u => u.email.toLowerCase().includes(q) || (u.username && u.username.toLowerCase().includes(q)) || (u.full_name && u.full_name.toLowerCase().includes(q)));
            }
            if (params?.status) {
                all = all.filter(u => u.status === params.status);
            }
            if (params?.role) {
                all = all.filter(u => u.roles.includes(params.role!));
            }
            return all;
        }
    },

    updateStatus: async (userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { status });
        } catch {
            const users = getFromLS<User[]>(LS_USERS, initialUsers);
            const updated = users.map(u => u.id === userId ? { ...u, status } : u);
            saveToLS(LS_USERS, updated);
        }
    }
};

// ==========================================
// 7. PRICING & COIN CONFIGURATION SERVICE
// ==========================================
export const adminPricingService = {
    getCoinPackages: async (): Promise<CoinPackage[]> => {
        try {
            const res = await api.get<CoinPackage[]>('/admin/pricing/packages');
            return res.data;
        } catch {
            return getFromLS<CoinPackage[]>(LS_PACKAGES, initialCoinPackages);
        }
    },

    updatePackage: async (id: string, payload: Partial<CoinPackage>): Promise<CoinPackage> => {
        try {
            const res = await api.put<CoinPackage>(`/admin/pricing/packages/${id}`, payload);
            return res.data;
        } catch {
            const list = getFromLS<CoinPackage[]>(LS_PACKAGES, initialCoinPackages);
            let target: CoinPackage | undefined;
            const updated = list.map(p => {
                if (p.id === id) {
                    target = { ...p, ...payload };
                    return target;
                }
                return p;
            });
            saveToLS(LS_PACKAGES, updated);
            if (!target) throw new Error('Package not found');
            return target;
        }
    }
};
