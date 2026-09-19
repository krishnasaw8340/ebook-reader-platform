import { api } from '../api';
import type {
    Book,
    BookSeries,
    Volume,
    Chapter,
    Page,
    User,
    CoinPackage,
    UploadJob,
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
const LS_VOLUMES = 'ky_volumes';
const LS_BOOKS = 'ky_books';
const LS_CHAPTERS = 'ky_chapters';
const LS_PAGES = 'ky_pages';
const LS_USERS = 'ky_admin_users';
const LS_PACKAGES = 'ky_coin_packages';
const LS_UPLOADS = 'ky_upload_jobs';

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

// Initial Volumes decoupled from Books
export const initialVolumes: Volume[] = [
    {
        id: 'vol-shatterfirst-1',
        series_id: 'series-shatterfirst',
        volume_no: 1,
        title: 'Volume 1: Reality Cracks',
        description: 'First official compilation collecting Chapters 1 through 10.',
        cover_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400',
        status: 'COMPLETED',
        release_date: '2026-07-10',
        created_at: '2026-07-10T00:00:00Z'
    },
    {
        id: 'vol-shatterfirst-2',
        series_id: 'series-shatterfirst',
        volume_no: 2,
        title: 'Volume 2: Corporate Arena',
        description: 'Collecting the tournament arc and underground matches.',
        cover_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400',
        status: 'ONGOING',
        release_date: '2026-07-18',
        created_at: '2026-07-18T00:00:00Z'
    },
    {
        id: 'vol-cyberpunk-1',
        series_id: 'series-cyberpunk-neotokyo',
        volume_no: 1,
        title: 'Volume 1: Interface Protocol',
        description: 'Introduction to Neo-Tokyo underground netrunners.',
        cover_image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&width=400',
        status: 'ONGOING',
        release_date: '2026-07-01',
        created_at: '2026-07-01T00:00:00Z'
    }
];

// Initial Seed Upload Jobs
export const initialUploadJobs: UploadJob[] = [
    {
        id: 'job-101',
        file_name: 'shatterfirst_v03_ch11-20.zip',
        file_size: 148200000,
        series_id: 'series-shatterfirst',
        series_title: 'Shatterfirst',
        volume_id: 'vol-shatterfirst-2',
        volume_title: 'Volume 2: Corporate Arena',
        book_title: 'Shatterfirst - Arc 3 Compilation',
        status: 'COMPLETED',
        progress: 100,
        stage: 'Completed',
        chapters_detected: 10,
        pages_detected: 210,
        started_at: '2026-09-18T14:20:00Z',
        completed_at: '2026-09-18T14:24:30Z',
        warnings: ['Chapter 14 has low DPI image on page 12 (upscaled automatically)']
    },
    {
        id: 'job-102',
        file_name: 'valkyrie_chronicles_special_edition.zip',
        file_size: 92400000,
        series_id: 'series-valkyrie-chronicles',
        series_title: 'Valkyrie Chronicles',
        volume_id: null, // Direct book without volume
        book_title: 'Valkyrie Chronicles — Crimson Requiem Edition',
        status: 'FAILED',
        progress: 45,
        stage: 'Validating',
        chapters_detected: 4,
        pages_detected: 82,
        error: 'Archive extraction failed: CRC checksum mismatch on chapter_003/page_018.jpg',
        started_at: '2026-09-19T10:15:00Z',
        completed_at: null,
        warnings: ['Corrupted file header detected in archive']
    },
    {
        id: 'job-103',
        file_name: 'cyberpunk_neo_tokyo_side_stories.zip',
        file_size: 65000000,
        series_id: 'series-cyberpunk-neotokyo',
        series_title: 'Cyberpunk Neo-Tokyo',
        volume_id: 'vol-cyberpunk-1',
        volume_title: 'Volume 1: Interface Protocol',
        book_title: 'Ghost In The Machine — Side Stories',
        status: 'PROCESSING',
        progress: 72,
        stage: 'Generating pages',
        chapters_detected: 3,
        pages_detected: 64,
        started_at: '2026-09-19T20:50:00Z',
        completed_at: null,
        warnings: []
    }
];

// Seed enhanced books with volume references and rich metadata
const seedBooks = (): Book[] => {
    return initialBooks.map((b, idx) => {
        const volumeId = idx === 0 ? 'vol-shatterfirst-1' : idx === 1 ? 'vol-shatterfirst-2' : idx === 2 ? 'vol-cyberpunk-1' : null;
        return {
            ...b,
            volume_id: volumeId,
            japanese_title: idx === 0 ? 'シャッターファースト 第1巻' : idx === 2 ? 'サイバーパンク・ネオ東京' : undefined,
            slug: b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            language: 'English',
            author: idx % 2 === 0 ? 'Tatsuki Fujimoto' : 'Eiichiro Oda',
            artist: idx % 2 === 0 ? 'Yusuke Murata' : 'Kentaro Miura',
            category: 'Shonen',
            genres: ['Action', 'Martial Arts', 'Sci-Fi'],
            tags: ['Cyberpunk', 'Tournament', 'High Stakes'],
            banner_image: b.cover_image,
            thumbnail_image: b.cover_image,
            pricing_model: b.coin_price > 0 ? 'PER_CHAPTER' : 'FREE',
            default_coins_per_page: 0,
            default_free_chapters: 2,
            default_free_pages: 5,
            is_premium: b.coin_price > 0,
            status: (b.status === 'COMPLETED' ? 'PUBLISHED' : 'PUBLISHED') as any,
            chapter_count: 5,
            page_count: 95,
            updated_at: new Date().toISOString()
        };
    });
};

// ==========================================
// 1. DASHBOARD SERVICE
// ==========================================
export interface DashboardRecentBook {
    id: string;
    title: string;
    seriesTitle: string;
    coverImage: string | null;
    status: string;
    pricingModel: string;
    chapterCount: number;
    updatedAt: string;
}

export interface DashboardRecentUpload {
    id: string;
    fileName: string;
    bookTitle: string;
    status: string;
    progress: number;
    stage: string;
    startedAt: string;
}

export interface DashboardRecentChapter {
    id: string;
    chapterNo: number;
    title: string;
    bookTitle: string;
    accessType: string;
    coinCost: number;
    updatedAt: string;
}

export interface DashboardStats {
    totalSeries: number;
    totalVolumes: number;
    totalBooks: number;
    totalChapters: number;
    totalPages: number;
    publishedBooks: number;
    draftBooks: number;
    processingUploads: number;
    failedUploads: number;
    recentBooks: DashboardRecentBook[];
    recentUploads: DashboardRecentUpload[];
    recentlyUpdatedChapters: DashboardRecentChapter[];
}

export const adminDashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        try {
            const res = await api.get<DashboardStats>('/admin/dashboard/stats');
            return res.data;
        } catch {
            const series = getFromLS<BookSeries[]>(LS_SERIES, initialBookSeries);
            const volumes = getFromLS<Volume[]>(LS_VOLUMES, initialVolumes);
            const books = getFromLS<Book[]>(LS_BOOKS, seedBooks());
            const chapters = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            const pages = getFromLS<Page[]>(LS_PAGES, initialPages);
            const uploads = getFromLS<UploadJob[]>(LS_UPLOADS, initialUploadJobs);

            const publishedBooks = books.filter(b => b.status === 'PUBLISHED' || b.status === 'COMPLETED' || b.status === 'ONGOING').length;
            const draftBooks = books.filter(b => b.status === 'DRAFT' || b.status === 'READY').length;
            const processingUploads = uploads.filter(u => u.status === 'PROCESSING' || u.status === 'QUEUED').length;
            const failedUploads = uploads.filter(u => u.status === 'FAILED').length;

            const recentBooks: DashboardRecentBook[] = books.slice(0, 5).map(b => {
                const s = series.find(ser => ser.id === b.series_id);
                return {
                    id: b.id,
                    title: b.title,
                    seriesTitle: s?.title || 'Standalone',
                    coverImage: b.cover_image,
                    status: b.status,
                    pricingModel: b.pricing_model || (b.coin_price > 0 ? 'PER_BOOK' : 'FREE'),
                    chapterCount: chapters.filter(c => c.book_id === b.id).length || b.chapter_count || 3,
                    updatedAt: b.updated_at || b.created_at
                };
            });

            const recentUploads: DashboardRecentUpload[] = uploads.slice(0, 5).map(u => ({
                id: u.id,
                fileName: u.file_name,
                bookTitle: u.book_title || 'Untitled Upload',
                status: u.status,
                progress: u.progress,
                stage: u.stage || u.status,
                startedAt: u.started_at
            }));

            const recentlyUpdatedChapters: DashboardRecentChapter[] = chapters.slice(0, 5).map(c => {
                const b = books.find(book => book.id === c.book_id);
                return {
                    id: c.id,
                    chapterNo: c.chapter_no,
                    title: c.title,
                    bookTitle: b?.title || 'Unknown Book',
                    accessType: c.access_type,
                    coinCost: c.coin_cost,
                    updatedAt: c.created_at
                };
            });

            return {
                totalSeries: series.length,
                totalVolumes: volumes.length,
                totalBooks: books.length,
                totalChapters: chapters.length,
                totalPages: pages.length,
                publishedBooks,
                draftBooks,
                processingUploads,
                failedUploads,
                recentBooks,
                recentUploads,
                recentlyUpdatedChapters
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
                    target = { ...s, ...data, updated_at: new Date().toISOString() };
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
// 3. VOLUME SERVICE (DECOUPLED FROM BOOKS)
// ==========================================
export const adminVolumeService = {
    getAll: async (seriesId?: string): Promise<Volume[]> => {
        try {
            const res = await api.get<Volume[]>('/admin/volumes', { params: { seriesId } });
            return res.data;
        } catch {
            let list = getFromLS<Volume[]>(LS_VOLUMES, initialVolumes);
            if (seriesId) {
                list = list.filter(v => v.series_id === seriesId);
            }
            return list.sort((a, b) => a.volume_no - b.volume_no);
        }
    },

    getById: async (id: string): Promise<Volume | undefined> => {
        try {
            const res = await api.get<Volume>(`/admin/volumes/${id}`);
            return res.data;
        } catch {
            const list = getFromLS<Volume[]>(LS_VOLUMES, initialVolumes);
            return list.find(v => v.id === id);
        }
    },

    create: async (data: Omit<Volume, 'id' | 'created_at'>): Promise<Volume> => {
        try {
            const res = await api.post<Volume>('/admin/volumes', data);
            return res.data;
        } catch {
            const list = getFromLS<Volume[]>(LS_VOLUMES, initialVolumes);
            // Validate duplicate volume_no in the same series
            const duplicate = list.some(v => v.series_id === data.series_id && v.volume_no === data.volume_no);
            if (duplicate) {
                throw new Error(`Volume ${data.volume_no} already exists for this series.`);
            }

            const newItem: Volume = {
                ...data,
                id: `vol-${Date.now()}`,
                created_at: new Date().toISOString()
            };
            const updated = [...list, newItem];
            saveToLS(LS_VOLUMES, updated);
            return newItem;
        }
    },

    update: async (id: string, data: Partial<Volume>): Promise<Volume> => {
        try {
            const res = await api.put<Volume>(`/admin/volumes/${id}`, data);
            return res.data;
        } catch {
            const list = getFromLS<Volume[]>(LS_VOLUMES, initialVolumes);
            const current = list.find(v => v.id === id);
            if (!current) throw new Error('Volume not found');

            // If updating volume_no or series_id, check for uniqueness
            const targetSeriesId = data.series_id || current.series_id;
            const targetVolumeNo = data.volume_no !== undefined ? data.volume_no : current.volume_no;

            const duplicate = list.some(v => v.id !== id && v.series_id === targetSeriesId && v.volume_no === targetVolumeNo);
            if (duplicate) {
                throw new Error(`Volume ${targetVolumeNo} already exists for this series.`);
            }

            let target: Volume | undefined;
            const updated = list.map(v => {
                if (v.id === id) {
                    target = { ...v, ...data, updated_at: new Date().toISOString() };
                    return target;
                }
                return v;
            });
            saveToLS(LS_VOLUMES, updated);
            return target!;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/admin/volumes/${id}`);
        } catch {
            const list = getFromLS<Volume[]>(LS_VOLUMES, initialVolumes);
            saveToLS(LS_VOLUMES, list.filter(v => v.id !== id));
        }
    },

    reorder: async (seriesId: string, orderedVolumeIds: string[]): Promise<Volume[]> => {
        try {
            const res = await api.put<Volume[]>(`/admin/series/${seriesId}/volumes/reorder`, { orderedVolumeIds });
            return res.data;
        } catch {
            const list = getFromLS<Volume[]>(LS_VOLUMES, initialVolumes);
            const updated = list.map(v => {
                if (v.series_id === seriesId) {
                    const idx = orderedVolumeIds.indexOf(v.id);
                    if (idx !== -1) {
                        return { ...v, volume_no: idx + 1, updated_at: new Date().toISOString() };
                    }
                }
                return v;
            });
            saveToLS(LS_VOLUMES, updated);
            return updated.filter(v => v.series_id === seriesId).sort((a, b) => a.volume_no - b.volume_no);
        }
    }
};

// ==========================================
// 4. BOOK SERVICE (FULL CATALOG WORKSPACE)
// ==========================================
export interface BookFilterParams {
    seriesId?: string;
    volumeId?: string;
    search?: string;
    status?: string;
    language?: string;
    category?: string;
    pricingModel?: string;
    sortBy?: 'title' | 'created_at' | 'updated_at' | 'chapter_count';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

export const adminBookService = {
    getAll: async (params?: BookFilterParams): Promise<Book[]> => {
        try {
            const res = await api.get<Book[]>('/admin/books', { params });
            return res.data;
        } catch {
            let list = getFromLS<Book[]>(LS_BOOKS, seedBooks());

            if (params?.seriesId) {
                list = list.filter(b => b.series_id === params.seriesId);
            }
            if (params?.volumeId !== undefined) {
                if (params.volumeId === 'none') {
                    list = list.filter(b => !b.volume_id);
                } else if (params.volumeId) {
                    list = list.filter(b => b.volume_id === params.volumeId);
                }
            }
            if (params?.status) {
                list = list.filter(b => b.status === params.status);
            }
            if (params?.language) {
                list = list.filter(b => b.language?.toLowerCase() === params.language?.toLowerCase());
            }
            if (params?.category) {
                list = list.filter(b => b.category?.toLowerCase() === params.category?.toLowerCase());
            }
            if (params?.pricingModel) {
                list = list.filter(b => (b.pricing_model || 'FREE') === params.pricingModel);
            }
            if (params?.search) {
                const q = params.search.toLowerCase();
                list = list.filter(b =>
                    b.title.toLowerCase().includes(q) ||
                    (b.summary && b.summary.toLowerCase().includes(q)) ||
                    (b.author && b.author.toLowerCase().includes(q)) ||
                    (b.japanese_title && b.japanese_title.toLowerCase().includes(q))
                );
            }

            // Sorting
            const sortBy = params?.sortBy || 'updated_at';
            const sortOrder = params?.sortOrder || 'desc';
            list = [...list].sort((a: any, b: any) => {
                const valA = a[sortBy] || a.created_at || '';
                const valB = b[sortBy] || b.created_at || '';
                if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            });

            return list;
        }
    },

    getById: async (id: string): Promise<Book | undefined> => {
        try {
            const res = await api.get<Book>(`/admin/books/${id}`);
            return res.data;
        } catch {
            const list = getFromLS<Book[]>(LS_BOOKS, seedBooks());
            return list.find(b => b.id === id);
        }
    },

    create: async (data: Omit<Book, 'id' | 'created_at'>): Promise<Book> => {
        try {
            const res = await api.post<Book>('/admin/books', data);
            return res.data;
        } catch {
            const list = getFromLS<Book[]>(LS_BOOKS, seedBooks());
            const newItem: Book = {
                ...data,
                id: `book-${Date.now()}`,
                slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                chapter_count: data.chapter_count || 0,
                page_count: data.page_count || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
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
            const list = getFromLS<Book[]>(LS_BOOKS, seedBooks());
            let target: Book | undefined;
            const updated = list.map(b => {
                if (b.id === id) {
                    target = { ...b, ...data, updated_at: new Date().toISOString() };
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
            const list = getFromLS<Book[]>(LS_BOOKS, seedBooks());
            saveToLS(LS_BOOKS, list.filter(b => b.id !== id));
        }
    },

    togglePublish: async (id: string): Promise<Book> => {
        const book = await adminBookService.getById(id);
        if (!book) throw new Error('Book not found');
        const nextStatus = (book.status === 'PUBLISHED' || book.status === 'COMPLETED' || book.status === 'ONGOING') ? 'DRAFT' : 'PUBLISHED';
        return adminBookService.update(id, { status: nextStatus });
    },

    archive: async (id: string): Promise<Book> => {
        return adminBookService.update(id, { status: 'ARCHIVED' });
    }
};

// ==========================================
// 5. CHAPTER SERVICE
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
                id: `ch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                created_at: new Date().toISOString()
            };
            const updated = [...list, newItem];
            saveToLS(LS_CHAPTERS, updated);
            return newItem;
        }
    },

    duplicate: async (id: string): Promise<Chapter> => {
        const existing = await adminChapterService.getById(id);
        if (!existing) throw new Error('Chapter not found');
        const allChapters = await adminChapterService.getAll(existing.book_id);
        const nextNo = allChapters.length + 1;

        return adminChapterService.create({
            book_id: existing.book_id,
            chapter_no: nextNo,
            title: `${existing.title} (Copy)`,
            access_type: existing.access_type,
            free_pages: existing.free_pages,
            coin_cost: existing.coin_cost
        });
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
    },

    reorder: async (bookId: string, orderedChapterIds: string[]): Promise<Chapter[]> => {
        try {
            const res = await api.put<Chapter[]>(`/admin/books/${bookId}/chapters/reorder`, { orderedChapterIds });
            return res.data;
        } catch {
            const list = getFromLS<Chapter[]>(LS_CHAPTERS, initialChapters);
            const updated = list.map(c => {
                if (c.book_id === bookId) {
                    const idx = orderedChapterIds.indexOf(c.id);
                    if (idx !== -1) {
                        return { ...c, chapter_no: idx + 1 };
                    }
                }
                return c;
            });
            saveToLS(LS_CHAPTERS, updated);
            return updated.filter(c => c.book_id === bookId).sort((a, b) => a.chapter_no - b.chapter_no);
        }
    }
};

// ==========================================
// 6. PAGE SERVICE (WITH DETERMINISTIC REORDERING)
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
// 7. COMPLETE BOOK PACKAGE UPLOAD SERVICE
// ==========================================
export interface CreateUploadJobPayload {
    file: { name: string; size: number };
    seriesId: string;
    seriesTitle: string;
    volumeId?: string | null;
    volumeTitle?: string | null;
    bookTitle: string;
    language: string;
}

export const adminUploadService = {
    getAllJobs: async (): Promise<UploadJob[]> => {
        try {
            const res = await api.get<UploadJob[]>('/admin/uploads');
            return res.data;
        } catch {
            return getFromLS<UploadJob[]>(LS_UPLOADS, initialUploadJobs);
        }
    },

    getJobById: async (id: string): Promise<UploadJob | undefined> => {
        try {
            const res = await api.get<UploadJob>(`/admin/uploads/${id}`);
            return res.data;
        } catch {
            const jobs = getFromLS<UploadJob[]>(LS_UPLOADS, initialUploadJobs);
            return jobs.find(j => j.id === id);
        }
    },

    createJob: async (payload: CreateUploadJobPayload): Promise<UploadJob> => {
        try {
            const res = await api.post<UploadJob>('/admin/uploads', payload);
            return res.data;
        } catch {
            const jobs = getFromLS<UploadJob[]>(LS_UPLOADS, initialUploadJobs);
            const newJob: UploadJob = {
                id: `job-${Date.now()}`,
                file_name: payload.file.name,
                file_size: payload.file.size,
                series_id: payload.seriesId,
                series_title: payload.seriesTitle,
                volume_id: payload.volumeId || null,
                volume_title: payload.volumeTitle || null,
                book_title: payload.bookTitle,
                status: 'UPLOADED',
                progress: 15,
                stage: 'Uploading',
                chapters_detected: 0,
                pages_detected: 0,
                started_at: new Date().toISOString(),
                warnings: [],
                detected_structure: {
                    series_title: payload.seriesTitle,
                    volume_title: payload.volumeTitle || null,
                    book_title: payload.bookTitle,
                    chapters: [
                        { chapter_no: 1, title: 'Chapter 01: The Inception', pages_count: 24, file_names: ['001.jpg', '002.jpg'] },
                        { chapter_no: 2, title: 'Chapter 02: Neon Shadows', pages_count: 22, file_names: ['001.jpg', '002.jpg'] },
                        { chapter_no: 3, title: 'Chapter 03: Resonance', pages_count: 28, file_names: ['001.jpg', '002.jpg'] }
                    ]
                }
            };
            const updated = [newJob, ...jobs];
            saveToLS(LS_UPLOADS, updated);
            return newJob;
        }
    },

    updateJob: async (id: string, partial: Partial<UploadJob>): Promise<UploadJob> => {
        const jobs = getFromLS<UploadJob[]>(LS_UPLOADS, initialUploadJobs);
        let target: UploadJob | undefined;
        const updated = jobs.map(j => {
            if (j.id === id) {
                target = { ...j, ...partial };
                return target;
            }
            return j;
        });
        saveToLS(LS_UPLOADS, updated);
        if (!target) throw new Error('Job not found');
        return target;
    },

    retryJob: async (jobId: string): Promise<UploadJob> => {
        return adminUploadService.updateJob(jobId, {
            status: 'PROCESSING',
            progress: 25,
            stage: 'Extracting',
            error: null
        });
    },

    publishJob: async (jobId: string): Promise<Book> => {
        const job = await adminUploadService.getJobById(jobId);
        if (!job) throw new Error('Job not found');

        // Create actual book from package
        const newBook = await adminBookService.create({
            series_id: job.series_id || 'series-shatterfirst',
            volume_id: job.volume_id,
            title: job.book_title || 'Uploaded Book',
            summary: `Automated ingest from ${job.file_name}`,
            cover_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400',
            coin_price: 0,
            status: 'PUBLISHED',
            chapter_count: job.chapters_detected || 3,
            page_count: job.pages_detected || 74,
            pricing_model: 'FREE'
        });

        // Mark job as published
        await adminUploadService.updateJob(jobId, {
            status: 'PUBLISHED',
            completed_at: new Date().toISOString()
        });

        return newBook;
    }
};

// ==========================================
// 8. USER MANAGEMENT SERVICE
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
// 9. PRICING & COIN CONFIGURATION SERVICE
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
