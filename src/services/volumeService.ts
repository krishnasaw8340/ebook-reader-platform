import { api } from './api';
import type {
    Volume,
    CreateVolumePayload,
    UpdateVolumePayload,
    QueryVolumeParams,
    PaginatedVolumeResponse,
    VolumeStatus,
} from '../types';
import { generateSlug } from './seriesService';

const LS_VOLUMES = 'ky_volumes';

export const initialVolumes: Volume[] = [
    {
        id: 'vol-shatterfirst-1',
        series_id: 'series-shatterfirst',
        seriesId: 'series-shatterfirst',
        volume_no: 1,
        volumeNumber: 1,
        title: 'Volume 1: Reality Cracks',
        slug: 'shatterfirst-vol-1',
        description: 'First official compilation collecting Chapters 1 through 10.',
        cover_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400',
        status: 'PUBLISHED',
        sortOrder: 1,
        release_date: '2026-07-10',
        releaseDate: '2026-07-10',
        created_at: '2026-07-10T00:00:00Z',
        createdAt: '2026-07-10T00:00:00Z'
    },
    {
        id: 'vol-shatterfirst-2',
        series_id: 'series-shatterfirst',
        seriesId: 'series-shatterfirst',
        volume_no: 2,
        volumeNumber: 2,
        title: 'Volume 2: Corporate Arena',
        slug: 'shatterfirst-vol-2',
        description: 'Collecting the tournament arc and underground matches.',
        cover_image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&width=400',
        status: 'ONGOING',
        sortOrder: 2,
        release_date: '2026-07-18',
        releaseDate: '2026-07-18',
        created_at: '2026-07-18T00:00:00Z',
        createdAt: '2026-07-18T00:00:00Z'
    },
    {
        id: 'vol-cyberpunk-1',
        series_id: 'series-cyberpunk-neotokyo',
        seriesId: 'series-cyberpunk-neotokyo',
        volume_no: 1,
        volumeNumber: 1,
        title: 'Volume 1: Interface Protocol',
        slug: 'cyberpunk-vol-1',
        description: 'Introduction to Neo-Tokyo underground netrunners.',
        cover_image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&width=400',
        status: 'ONGOING',
        sortOrder: 1,
        release_date: '2026-07-01',
        releaseDate: '2026-07-01',
        created_at: '2026-07-01T00:00:00Z',
        createdAt: '2026-07-01T00:00:00Z'
    }
];

/**
 * Normalizes backend Volume entity into frontend Volume with full backward compatibility
 */
export const mapVolumeFromApi = (item: any): Volume => {
    const seriesId = item.seriesId || item.series_id || '';
    const volumeNumber = Number(item.volumeNumber ?? item.volume_no ?? 1);
    const title = item.title || `Volume ${volumeNumber}`;
    const createdAt = item.createdAt || item.created_at || new Date().toISOString();
    const updatedAt = item.updatedAt || item.updated_at;
    const releaseDate = item.releaseDate || item.release_date || null;
    const sortOrder = Number(item.sortOrder ?? item.sort_order ?? volumeNumber);

    return {
        id: item.id,
        series_id: seriesId,
        seriesId: seriesId,
        volume_no: volumeNumber,
        volumeNumber: volumeNumber,
        title: title,
        slug: item.slug || generateSlug(title),
        description: item.description ?? null,
        cover_image: item.cover_image || item.coverImage || null,
        status: (item.status as VolumeStatus) || 'DRAFT',
        sortOrder: sortOrder,
        sort_order: sortOrder,
        release_date: releaseDate,
        releaseDate: releaseDate,
        publishedAt: item.publishedAt || null,
        created_at: createdAt,
        updated_at: updatedAt,
        createdAt: createdAt,
        updatedAt: updatedAt,
        series: item.series,
        books: item.books
    };
};

const getFallbackVolumes = (seriesId?: string, search?: string): Volume[] => {
    try {
        const saved = localStorage.getItem(LS_VOLUMES);
        let list: Volume[] = saved ? JSON.parse(saved) : initialVolumes;
        if (seriesId) {
            list = list.filter((v) => (v.seriesId === seriesId || v.series_id === seriesId));
        }
        if (search && search.trim()) {
            const q = search.toLowerCase().trim();
            list = list.filter(
                (v) =>
                    (v.title && v.title.toLowerCase().includes(q)) ||
                    (v.description && v.description.toLowerCase().includes(q)) ||
                    (v.slug && v.slug.toLowerCase().includes(q))
            );
        }
        return list.map(mapVolumeFromApi);
    } catch {
        return initialVolumes.map(mapVolumeFromApi);
    }
};

const saveFallbackVolumes = (list: Volume[]) => {
    try {
        localStorage.setItem(LS_VOLUMES, JSON.stringify(list));
    } catch {
        // Ignore localStorage quota errors
    }
};

/**
 * Volume API Service
 * - GET    /volumes
 * - GET    /volumes/:id
 * - POST   /volumes (Admin)
 * - PATCH  /volumes/:id (Admin)
 * - DELETE /volumes/:id (Admin)
 */
export const volumeService = {
    /**
     * GET /volumes
     * Lists volumes with optional series filtering, search, and sorting
     */
    getAll: async (params?: QueryVolumeParams | string): Promise<Volume[]> => {
        const query: QueryVolumeParams = typeof params === 'string' ? { seriesId: params } : params || {};

        try {
            const res = await api.get<PaginatedVolumeResponse | Volume[]>('/volumes', {
                params: {
                    seriesId: query.seriesId || undefined,
                    search: query.search || undefined,
                    status: query.status || undefined,
                    page: query.page || 1,
                    limit: query.limit || 50,
                    sortBy: query.sortBy || 'sortOrder',
                    sortOrder: query.sortOrder || 'ASC',
                },
            });

            const rawList = Array.isArray(res.data)
                ? res.data
                : (res.data && Array.isArray((res.data as any).data))
                ? (res.data as any).data
                : [];

            const normalized = rawList.map(mapVolumeFromApi);

            if (normalized.length > 0 && !query.search && !query.seriesId) {
                saveFallbackVolumes(normalized);
            }

            return normalized;
        } catch (error) {
            console.warn('[volumeService.getAll] Falling back to cached volumes:', error);
            return getFallbackVolumes(query.seriesId, query.search);
        }
    },

    /**
     * GET /volumes with pagination metadata
     */
    getPaginated: async (params?: QueryVolumeParams): Promise<PaginatedVolumeResponse> => {
        const query = params || {};
        try {
            const res = await api.get<PaginatedVolumeResponse>('/volumes', {
                params: {
                    seriesId: query.seriesId || undefined,
                    search: query.search || undefined,
                    status: query.status || undefined,
                    page: query.page || 1,
                    limit: query.limit || 20,
                    sortBy: query.sortBy || 'sortOrder',
                    sortOrder: query.sortOrder || 'ASC',
                },
            });

            const rawList = Array.isArray(res.data?.data) ? res.data.data : [];
            return {
                data: rawList.map(mapVolumeFromApi),
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
            console.warn('[volumeService.getPaginated] API request failed:', error);
            const fallback = getFallbackVolumes(query.seriesId, query.search);
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
     * GET /volumes/:id
     * Resolves volume by UUID or slug
     */
    getById: async (idOrSlug: string): Promise<Volume | undefined> => {
        try {
            const res = await api.get<any>(`/volumes/${encodeURIComponent(idOrSlug)}`);
            return mapVolumeFromApi(res.data);
        } catch (error) {
            console.warn(`[volumeService.getById] Failed fetching volume "${idOrSlug}":`, error);
            const fallbackList = getFallbackVolumes();
            return fallbackList.find((v) => v.id === idOrSlug || v.slug === idOrSlug);
        }
    },

    /**
     * POST /volumes (ADMIN)
     * Creates a new volume compilation
     */
    create: async (data: CreateVolumePayload | Omit<Volume, 'id' | 'created_at'>): Promise<Volume> => {
        const seriesId = ('seriesId' in data && data.seriesId) ? data.seriesId : ('series_id' in data ? (data as any).series_id : '');
        const volumeNumber = Number(('volumeNumber' in data && data.volumeNumber !== undefined) ? data.volumeNumber : ('volume_no' in data ? (data as any).volume_no : 1));
        const title = data.title ? data.title.trim() : `Volume ${volumeNumber}`;
        const slug = data.slug ? data.slug.trim().toLowerCase() : generateSlug(title);

        const payload: CreateVolumePayload = {
            seriesId,
            volumeNumber,
            title,
            slug,
            description: data.description ? data.description.trim() : undefined,
            sortOrder: data.sortOrder !== undefined ? data.sortOrder : ('sort_order' in data ? (data as any).sort_order : volumeNumber),
            releaseDate: data.releaseDate || ('release_date' in data ? (data as any).release_date : undefined),
            status: data.status || 'DRAFT',
            publishedAt: data.publishedAt ?? undefined
        };

        const res = await api.post<any>('/volumes', payload);
        const created = mapVolumeFromApi(res.data);

        // Update local cache
        const currentList = getFallbackVolumes();
        saveFallbackVolumes([created, ...currentList.filter((v) => v.id !== created.id)]);

        return created;
    },

    /**
     * PATCH /volumes/:id (ADMIN)
     * Updates volume details
     */
    update: async (id: string, data: UpdateVolumePayload | Partial<Volume>): Promise<Volume> => {
        const payload: UpdateVolumePayload = {};

        if ('seriesId' in data && data.seriesId) payload.seriesId = data.seriesId;
        else if ('series_id' in data && (data as any).series_id) payload.seriesId = (data as any).series_id;

        if ('volumeNumber' in data && data.volumeNumber !== undefined) payload.volumeNumber = Number(data.volumeNumber);
        else if ('volume_no' in data && (data as any).volume_no !== undefined) payload.volumeNumber = Number((data as any).volume_no);

        if (data.title !== undefined) payload.title = data.title.trim();
        if (data.slug !== undefined) payload.slug = data.slug.trim().toLowerCase();
        if (data.description !== undefined) payload.description = data.description ? data.description.trim() : '';
        if (data.sortOrder !== undefined) payload.sortOrder = Number(data.sortOrder);
        else if ('sort_order' in data && (data as any).sort_order !== undefined) payload.sortOrder = Number((data as any).sort_order);

        if (data.releaseDate !== undefined) payload.releaseDate = data.releaseDate || undefined;
        else if ('release_date' in data && (data as any).release_date !== undefined) payload.releaseDate = (data as any).release_date || undefined;

        if (data.status !== undefined) payload.status = data.status;
        if (data.publishedAt !== undefined) payload.publishedAt = data.publishedAt ?? undefined;

        const res = await api.patch<any>(`/volumes/${encodeURIComponent(id)}`, payload);
        const updated = mapVolumeFromApi(res.data);

        // Update local cache
        const currentList = getFallbackVolumes();
        saveFallbackVolumes(currentList.map((v) => (v.id === id ? updated : v)));

        return updated;
    },

    /**
     * DELETE /volumes/:id (ADMIN)
     * Soft-deletes a volume
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/volumes/${encodeURIComponent(id)}`);

        // Update local cache
        const currentList = getFallbackVolumes();
        saveFallbackVolumes(currentList.filter((v) => v.id !== id));
    }
};
