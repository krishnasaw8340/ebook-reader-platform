import { api } from './api';
import type {
    BookSeries,
    CreateSeriesPayload,
    UpdateSeriesPayload,
    QuerySeriesParams,
    PaginatedSeriesResponse,
    SeriesStatus,
} from '../types';
import { initialBookSeries } from './mockData';

const LS_SERIES = 'ky_book_series';

/**
 * Standard slug generator matching backend slug generation logic
 */
export const generateSlug = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Normalizes backend series entity into frontend BookSeries with backward compatibility
 */
export const mapSeriesFromApi = (item: any): BookSeries => {
    const name = item.name || item.title || 'Untitled Series';
    const createdAt = item.createdAt || item.created_at || new Date().toISOString();
    const updatedAt = item.updatedAt || item.updated_at;

    return {
        id: item.id,
        name,
        title: name,
        slug: item.slug || generateSlug(name),
        description: item.description ?? null,
        cover_image: item.cover_image || item.coverImage || item.mediaAssets?.[0]?.url || null,
        status: (item.status as SeriesStatus) || 'DRAFT',
        created_at: createdAt,
        updated_at: updatedAt,
        createdAt,
        updatedAt,
        volumes: item.volumes || [],
    };
};

/**
 * Helper to retrieve mock/cached series from localStorage if backend is unreachable
 */
const getFallbackSeries = (search?: string): BookSeries[] => {
    try {
        const saved = localStorage.getItem(LS_SERIES);
        let list: BookSeries[] = saved ? JSON.parse(saved) : initialBookSeries;
        if (search && search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter(
                (s) =>
                    (s.title && s.title.toLowerCase().includes(q)) ||
                    (s.description && s.description.toLowerCase().includes(q)) ||
                    (s.slug && s.slug.toLowerCase().includes(q))
            );
        }
        return list.map(mapSeriesFromApi);
    } catch {
        return initialBookSeries.map(mapSeriesFromApi);
    }
};

/**
 * Helper to update localStorage cache
 */
const saveFallbackSeries = (list: BookSeries[]) => {
    try {
        localStorage.setItem(LS_SERIES, JSON.stringify(list));
    } catch {
        // Ignore localStorage quota errors gracefully
    }
};

/**
 * Frontend Series Service integrating backend /series endpoints
 * - POST   /series       (Admin only, JWT authenticated)
 * - GET    /series       (Public / Authenticated with visibility scoping)
 * - GET    /series/:id   (Public / Authenticated by UUID or slug)
 * - PATCH  /series/:id   (Admin only, JWT authenticated)
 * - DELETE /series/:id   (Admin only, JWT authenticated)
 */
export const seriesService = {
    /**
     * GET /series
     * Lists series with search, status filtering, and pagination
     */
    getAll: async (params?: QuerySeriesParams | string): Promise<BookSeries[]> => {
        const query: QuerySeriesParams = typeof params === 'string' ? { search: params } : params || {};

        try {
            const res = await api.get<PaginatedSeriesResponse | BookSeries[]>('/series', {
                params: {
                    search: query.search || undefined,
                    status: query.status || undefined,
                    page: query.page || 1,
                    limit: query.limit || 50,
                    sortBy: query.sortBy || 'createdAt',
                    sortOrder: query.sortOrder || 'DESC',
                },
            });

            // Backend returns { data: [...], meta: {...} }
            const rawList = Array.isArray(res.data)
                ? res.data
                : (res.data && Array.isArray((res.data as any).data))
                ? (res.data as any).data
                : [];

            const normalized = rawList.map(mapSeriesFromApi);

            // Keep local fallback updated
            if (normalized.length > 0 && !query.search && !query.status) {
                saveFallbackSeries(normalized);
            }

            return normalized;
        } catch (error) {
            console.warn('[seriesService.getAll] Falling back to cached catalog:', error);
            return getFallbackSeries(query.search);
        }
    },

    /**
     * GET /series with full pagination metadata
     */
    getPaginated: async (params?: QuerySeriesParams): Promise<PaginatedSeriesResponse> => {
        const query = params || {};
        try {
            const res = await api.get<PaginatedSeriesResponse>('/series', {
                params: {
                    search: query.search || undefined,
                    status: query.status || undefined,
                    page: query.page || 1,
                    limit: query.limit || 20,
                    sortBy: query.sortBy || 'createdAt',
                    sortOrder: query.sortOrder || 'DESC',
                },
            });

            const rawList = Array.isArray(res.data?.data) ? res.data.data : [];
            return {
                data: rawList.map(mapSeriesFromApi),
                meta: res.data.meta || {
                    total: rawList.length,
                    page: query.page || 1,
                    limit: query.limit || 20,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            };
        } catch (error) {
            console.warn('[seriesService.getPaginated] API request failed:', error);
            const fallback = getFallbackSeries(query.search);
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
     * GET /series/:id
     * Resolves series by UUID or unique URL slug
     */
    getById: async (idOrSlug: string): Promise<BookSeries | undefined> => {
        try {
            const res = await api.get<any>(`/series/${encodeURIComponent(idOrSlug)}`);
            return mapSeriesFromApi(res.data);
        } catch (error) {
            console.warn(`[seriesService.getById] Failed fetching series "${idOrSlug}":`, error);
            const fallbackList = getFallbackSeries();
            return fallbackList.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
        }
    },

    /**
     * POST /series (ADMIN)
     * Creates a new franchise series
     */
    create: async (data: CreateSeriesPayload | { title: string; description?: string; cover_image?: string; status?: SeriesStatus; slug?: string }): Promise<BookSeries> => {
        const name = ('name' in data && data.name) ? data.name : ('title' in data ? data.title : '');
        const slug = data.slug ? data.slug.trim().toLowerCase() : (name ? generateSlug(name) : undefined);

        const payload: CreateSeriesPayload = {
            name: name.trim(),
            slug: slug || undefined,
            description: data.description ? data.description.trim() : undefined,
            status: data.status || 'DRAFT',
        };

        const res = await api.post<any>('/series', payload);
        const created = mapSeriesFromApi(res.data);

        // Update local cache
        const currentList = getFallbackSeries();
        saveFallbackSeries([created, ...currentList.filter((s) => s.id !== created.id)]);

        return created;
    },

    /**
     * PATCH /series/:id (ADMIN)
     * Updates series details by UUID or slug
     */
    update: async (
        idOrSlug: string,
        data: UpdateSeriesPayload | Partial<BookSeries>
    ): Promise<BookSeries> => {
        const name = data.name !== undefined ? data.name : (data as any).title;
        const payload: UpdateSeriesPayload = {};

        if (name !== undefined) {
            payload.name = typeof name === 'string' ? name.trim() : name;
        }
        if (data.slug !== undefined) {
            payload.slug = data.slug.trim().toLowerCase();
        }
        if (data.description !== undefined) {
            payload.description = data.description ? data.description.trim() : undefined;
        }
        if (data.status !== undefined) {
            payload.status = data.status;
        }

        const res = await api.patch<any>(`/series/${encodeURIComponent(idOrSlug)}`, payload);
        const updated = mapSeriesFromApi(res.data);

        // Update local cache
        const currentList = getFallbackSeries();
        saveFallbackSeries(currentList.map((s) => (s.id === updated.id || s.slug === idOrSlug ? updated : s)));

        return updated;
    },

    /**
     * DELETE /series/:id (ADMIN)
     * Soft-deletes a series by UUID or slug
     */
    delete: async (idOrSlug: string): Promise<{ message: string; id: string }> => {
        const res = await api.delete<{ message: string; id: string }>(`/series/${encodeURIComponent(idOrSlug)}`);

        // Remove from local cache
        const currentList = getFallbackSeries();
        saveFallbackSeries(currentList.filter((s) => s.id !== idOrSlug && s.slug !== idOrSlug));

        return res.data || { message: 'Series deleted successfully', id: idOrSlug };
    },

    /**
     * Toggle Series Status helper
     */
    toggleStatus: async (idOrSlug: string): Promise<BookSeries> => {
        const current = await seriesService.getById(idOrSlug);
        if (!current) throw new Error('Series not found');

        const nextStatus: SeriesStatus =
            current.status === 'ONGOING'
                ? 'COMPLETED'
                : current.status === 'COMPLETED'
                ? 'HIATUS'
                : current.status === 'DRAFT'
                ? 'PUBLISHED'
                : 'ONGOING';

        return seriesService.update(idOrSlug, { status: nextStatus });
    },
};
