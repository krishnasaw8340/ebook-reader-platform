import { api } from '../api';
import { seriesService } from '../seriesService';
import { volumeService } from '../volumeService';
import { bookService } from '../bookService';
import { chapterService } from '../chapterService';
import type {
    Book,
    BookSeries,
    Volume,
    Chapter,
    User,
    CoinPackage,
    UploadJob,
} from '../../types';

// Local storage keys
const LS_SERIES = 'ky_book_series';
const LS_VOLUMES = 'ky_volumes';
const LS_BOOKS = 'ky_books';
const LS_CHAPTERS = 'ky_chapters';
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
            const series = getFromLS<BookSeries[]>(LS_SERIES, []);
            const volumes = getFromLS<Volume[]>(LS_VOLUMES, []);
            const books = getFromLS<Book[]>(LS_BOOKS, []);
            const chapters = getFromLS<Chapter[]>(LS_CHAPTERS, []);
            const uploads = getFromLS<UploadJob[]>(LS_UPLOADS, []);

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
                    coverImage: b.cover_image || null,
                    status: b.status,
                    pricingModel: b.pricing_model || (b.coin_price > 0 ? 'PER_BOOK' : 'FREE'),
                    chapterCount: chapters.filter(c => c.book_id === b.id).length || b.chapter_count || 0,
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
                totalPages: chapters.reduce((acc, c) => acc + (c.pdf_page_count || 0), 0),
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

// Page service removed for V1 (Chapter-PDF architecture)

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
            return getFromLS<UploadJob[]>(LS_UPLOADS, []);
        }
    },

    getJobById: async (id: string): Promise<UploadJob | undefined> => {
        try {
            const res = await api.get<UploadJob>(`/admin/uploads/${id}`);
            return res.data;
        } catch {
            const jobs = getFromLS<UploadJob[]>(LS_UPLOADS, []);
            return jobs.find(j => j.id === id);
        }
    },

    createJob: async (payload: CreateUploadJobPayload): Promise<UploadJob> => {
        try {
            const res = await api.post<UploadJob>('/admin/uploads', payload);
            return res.data;
        } catch {
            const jobs = getFromLS<UploadJob[]>(LS_UPLOADS, []);
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
                pdf_pages_detected: 0,
                started_at: new Date().toISOString(),
                warnings: [],
                detected_structure: {
                    series_title: payload.seriesTitle,
                    volume_title: payload.volumeTitle || null,
                    book_title: payload.bookTitle,
                    chapters: []
                }
            };
            const updated = [newJob, ...jobs];
            saveToLS(LS_UPLOADS, updated);
            return newJob;
        }
    },

    updateJob: async (id: string, partial: Partial<UploadJob>): Promise<UploadJob> => {
        const jobs = getFromLS<UploadJob[]>(LS_UPLOADS, []);
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
            series_id: job.series_id,
            volume_id: job.volume_id,
            title: job.book_title || 'Uploaded Book',
            summary: `Automated ingest from ${job.file_name}`,
            coin_price: 0,
            status: 'PUBLISHED',
            chapter_count: job.chapters_detected || 0,
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
            // Return empty list when API is unreachable — no mock users
            return [];
        }
    },

    updateStatus: async (userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { status });
        } catch {
            const users = getFromLS<User[]>(LS_USERS, []);
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
            return getFromLS<CoinPackage[]>(LS_PACKAGES, []);
        }
    },

    updatePackage: async (id: string, payload: Partial<CoinPackage>): Promise<CoinPackage> => {
        try {
            const res = await api.put<CoinPackage>(`/admin/pricing/packages/${id}`, payload);
            return res.data;
        } catch {
            const list = getFromLS<CoinPackage[]>(LS_PACKAGES, []);
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
