import { api } from '../api';
import { seriesService } from '../seriesService';
import { volumeService } from '../volumeService';
import { bookService } from '../bookService';
import { chapterService } from '../chapterService';
import { pageService } from '../pageService';
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
        status: 'PUBLISHED',
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
// 2. SERIES SERVICE (Centralized Backend Integration)
// ==========================================
export const adminSeriesService = seriesService;
export { seriesService };

// ==========================================
// 3. VOLUME SERVICE (DECOUPLED FROM BOOKS)
// ==========================================
export const adminVolumeService = volumeService;
export { volumeService };

// ==========================================
// 4. BOOK SERVICE (FULL CATALOG WORKSPACE)
// ==========================================
export interface BookFilterParams {
    seriesId?: string;
    volumeId?: string;
    authorId?: string;
    artistId?: string;
    languageId?: string;
    categoryId?: string;
    genreId?: string;
    tagId?: string;
    status?: string;
    language?: string;
    category?: string;
    pricingModel?: string;
    isPremium?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}

export const adminBookService = bookService;
export { bookService };

// ==========================================
// 5. CHAPTER SERVICE
// ==========================================
export const adminChapterService = chapterService;
export { chapterService };

// ==========================================
// 6. PAGE SERVICE (WITH DETERMINISTIC REORDERING)
// ==========================================
export const adminPageService = pageService;
export { pageService };

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
