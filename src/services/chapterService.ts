import { api } from './api';
import type {
    Chapter,
    CreateChapterPayload,
    UpdateChapterPayload,
    QueryChapterParams,
    PaginatedChapterResponse,
    ChapterPricingModel,
} from '../types';
import { initialChapters } from './mockData';

const LS_CHAPTERS = 'ky_chapters';

/**
 * Normalizes backend Chapter entity into frontend Chapter
 */
export const mapChapterFromApi = (item: any): Chapter => {
    const bookId = item.bookId || item.book_id || '';
    const chapterNumber = Number(item.chapterNumber ?? item.chapter_no ?? 1);
    const title = item.title || `Chapter ${chapterNumber}`;
    const sortOrder = Number(item.sortOrder ?? item.sort_order ?? (chapterNumber * 10));
    const pricingModel = (item.pricingModel || item.pricing_model || item.access_type || 'FREE') as ChapterPricingModel;
    const freePageCount = Number(item.freePageCount ?? item.free_pages ?? 0);
    const coinCost = Number(item.coinCost ?? item.coin_cost ?? 0);
    const pageCount = Number(item.pageCount ?? item.page_count ?? 0);
    const published = item.published !== undefined ? Boolean(item.published) : true;
    const createdAt = item.createdAt || item.created_at || new Date().toISOString();
    const updatedAt = item.updatedAt || item.updated_at;

    return {
        id: item.id,
        book_id: bookId,
        bookId: bookId,
        chapter_no: chapterNumber,
        chapterNumber: chapterNumber,
        title: title,
        sort_order: sortOrder,
        sortOrder: sortOrder,
        access_type: pricingModel,
        pricing_model: pricingModel,
        pricingModel: pricingModel,
        free_pages: freePageCount,
        freePageCount: freePageCount,
        coin_cost: coinCost,
        coinCost: coinCost,
        page_count: pageCount,
        pageCount: pageCount,
        published: published,
        publishedAt: item.publishedAt || null,
        created_at: createdAt,
        updated_at: updatedAt,
        createdAt: createdAt,
        updatedAt: updatedAt,
        book: item.book,
        pages: item.pages
    };
};

const getFallbackChapters = (bookId?: string, search?: string): Chapter[] => {
    try {
        const saved = localStorage.getItem(LS_CHAPTERS);
        let list: Chapter[] = saved ? JSON.parse(saved) : initialChapters;
        if (bookId) {
            list = list.filter((c) => c.bookId === bookId || c.book_id === bookId);
        }
        if (search && search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter((c) => c.title && c.title.toLowerCase().includes(q));
        }
        return list.map(mapChapterFromApi).sort((a, b) => (a.sortOrder || a.chapterNumber || 0) - (b.sortOrder || b.chapterNumber || 0));
    } catch {
        return initialChapters.map(mapChapterFromApi);
    }
};

const saveFallbackChapters = (list: Chapter[]) => {
    try {
        localStorage.setItem(LS_CHAPTERS, JSON.stringify(list));
    } catch {
        // Ignore quota
    }
};

/**
 * Chapter API Service
 * - GET    /chapters
 * - GET    /chapters/:id
 * - POST   /chapters (Admin)
 * - PATCH  /chapters/:id (Admin)
 * - DELETE /chapters/:id (Admin)
 */
export const chapterService = {
    /**
     * GET /chapters
     * Lists chapters with optional book filtering and search
     */
    getAll: async (params?: QueryChapterParams | string): Promise<Chapter[]> => {
        const query: QueryChapterParams = typeof params === 'string' ? { bookId: params } : params || {};

        try {
            const res = await api.get<PaginatedChapterResponse | Chapter[]>('/chapters', {
                params: {
                    bookId: query.bookId || undefined,
                    pricingModel: query.pricingModel || undefined,
                    published: query.published !== undefined ? query.published : undefined,
                    search: query.search || undefined,
                    page: query.page || 1,
                    limit: query.limit || 100,
                    sortBy: query.sortBy || 'sortOrder',
                    sortOrder: query.sortOrder || 'ASC',
                },
            });

            const rawList = Array.isArray(res.data)
                ? res.data
                : (res.data && Array.isArray((res.data as any).data))
                ? (res.data as any).data
                : [];

            const normalized = rawList.map(mapChapterFromApi);

            if (normalized.length > 0 && !query.search && !query.bookId) {
                saveFallbackChapters(normalized);
            }

            return normalized;
        } catch (error) {
            console.warn('[chapterService.getAll] Falling back to cached chapters:', error);
            return getFallbackChapters(query.bookId, query.search);
        }
    },

    /**
     * GET /chapters with pagination metadata
     */
    getPaginated: async (params?: QueryChapterParams): Promise<PaginatedChapterResponse> => {
        const query = params || {};
        try {
            const res = await api.get<PaginatedChapterResponse>('/chapters', {
                params: {
                    bookId: query.bookId || undefined,
                    pricingModel: query.pricingModel || undefined,
                    published: query.published !== undefined ? query.published : undefined,
                    search: query.search || undefined,
                    page: query.page || 1,
                    limit: query.limit || 20,
                    sortBy: query.sortBy || 'sortOrder',
                    sortOrder: query.sortOrder || 'ASC',
                },
            });

            const rawList = Array.isArray(res.data?.data) ? res.data.data : [];
            return {
                data: rawList.map(mapChapterFromApi),
                meta: res.data?.meta || {
                    total: rawList.length,
                    page: query.page || 1,
                    limit: query.limit || 20,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
        } catch (error) {
            console.warn('[chapterService.getPaginated] API request failed:', error);
            const fallback = getFallbackChapters(query.bookId, query.search);
            return {
                data: fallback,
                meta: {
                    total: fallback.length,
                    page: 1,
                    limit: 20,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
        }
    },

    /**
     * GET /chapters/:id
     * Resolves single chapter by UUID
     */
    getById: async (id: string): Promise<Chapter | undefined> => {
        try {
            const res = await api.get<any>(`/chapters/${encodeURIComponent(id)}`);
            return mapChapterFromApi(res.data);
        } catch (error) {
            console.warn(`[chapterService.getById] Failed fetching chapter "${id}":`, error);
            const fallbackList = getFallbackChapters();
            return fallbackList.find((c) => c.id === id);
        }
    },

    /**
     * POST /chapters (ADMIN)
     * Creates a new chapter for a book
     */
    create: async (data: CreateChapterPayload | any): Promise<Chapter> => {
        const bookId = data.bookId || data.book_id;
        const chapterNumber = Number(data.chapterNumber ?? data.chapter_no ?? 1);
        const title = data.title ? data.title.trim() : `Chapter ${chapterNumber}`;
        const sortOrder = Number(data.sortOrder ?? data.sort_order ?? (chapterNumber * 10));
        const pricingModel = (data.pricingModel || data.pricing_model || data.access_type || 'FREE') as ChapterPricingModel;

        const payload: CreateChapterPayload = {
            bookId,
            chapterNumber,
            title,
            sortOrder,
            pricingModel,
            freePageCount: pricingModel === 'PARTIAL_FREE' || pricingModel === 'PARTIAL' ? Number(data.freePageCount ?? data.free_pages ?? 1) : 0,
            coinCost: pricingModel === 'PAID' ? Number(data.coinCost ?? data.coin_cost ?? 1) : 0,
            pageCount: Number(data.pageCount ?? data.page_count ?? 0),
            published: data.published !== undefined ? Boolean(data.published) : true,
            publishedAt: data.publishedAt
        };

        const res = await api.post<any>('/chapters', payload);
        const created = mapChapterFromApi(res.data);

        // Update local cache
        const currentList = getFallbackChapters();
        saveFallbackChapters([created, ...currentList.filter((c) => c.id !== created.id)]);

        return created;
    },

    /**
     * PATCH /chapters/:id (ADMIN)
     * Updates chapter details and pricing
     */
    update: async (id: string, data: UpdateChapterPayload | any): Promise<Chapter> => {
        const payload: UpdateChapterPayload = {};

        if (data.bookId !== undefined || data.book_id !== undefined) payload.bookId = data.bookId || data.book_id;
        if (data.chapterNumber !== undefined || data.chapter_no !== undefined) payload.chapterNumber = Number(data.chapterNumber ?? data.chapter_no);
        if (data.title !== undefined) payload.title = data.title.trim();
        if (data.sortOrder !== undefined || data.sort_order !== undefined) payload.sortOrder = Number(data.sortOrder ?? data.sort_order);

        const pricingModel = data.pricingModel || data.pricing_model || data.access_type;
        if (pricingModel !== undefined) {
            payload.pricingModel = pricingModel as ChapterPricingModel;
            if (pricingModel === 'FREE') {
                payload.coinCost = 0;
                payload.freePageCount = 0;
            } else if (pricingModel === 'PARTIAL_FREE' || pricingModel === 'PARTIAL') {
                payload.freePageCount = Number(data.freePageCount ?? data.free_pages ?? 1);
            } else if (pricingModel === 'PAID') {
                payload.coinCost = Number(data.coinCost ?? data.coin_cost ?? 1);
            }
        }

        if (data.coinCost !== undefined || data.coin_cost !== undefined) payload.coinCost = Number(data.coinCost ?? data.coin_cost);
        if (data.freePageCount !== undefined || data.free_pages !== undefined) payload.freePageCount = Number(data.freePageCount ?? data.free_pages);
        if (data.pageCount !== undefined || data.page_count !== undefined) payload.pageCount = Number(data.pageCount ?? data.page_count);
        if (data.published !== undefined) payload.published = Boolean(data.published);
        if (data.publishedAt !== undefined) payload.publishedAt = data.publishedAt;

        const res = await api.patch<any>(`/chapters/${encodeURIComponent(id)}`, payload);
        const updated = mapChapterFromApi(res.data);

        // Update local cache
        const currentList = getFallbackChapters();
        saveFallbackChapters(currentList.map((c) => (c.id === id ? updated : c)));

        return updated;
    },

    /**
     * Quick Toggle Publish
     */
    togglePublish: async (id: string): Promise<Chapter> => {
        const existing = await chapterService.getById(id);
        const nextState = !existing?.published;
        return chapterService.update(id, { published: nextState, publishedAt: nextState ? new Date().toISOString() : null });
    },

    /**
     * DELETE /chapters/:id (ADMIN)
     * Soft-deletes a chapter
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/chapters/${encodeURIComponent(id)}`);

        // Update local cache
        const currentList = getFallbackChapters();
        saveFallbackChapters(currentList.filter((c) => c.id !== id));
    }
};
