import { api } from './api';
import type { Page, QueryPageParams } from '../types';
import { initialPages } from './mockData';

const LS_PAGES = 'ky_pages';

export const mapPageFromApi = (item: any): Page => {
    const chapterId = item.chapterId || item.chapter_id || '';
    const pageNo = Number(item.pageNumber ?? item.page_no ?? 1);
    const imageUrl = item.imageUrl || item.image_url || '';
    const createdAt = item.createdAt || item.created_at || new Date().toISOString();
    const updatedAt = item.updatedAt || item.updated_at;

    return {
        id: item.id,
        chapter_id: chapterId,
        chapterId: chapterId,
        page_no: pageNo,
        pageNumber: pageNo,
        image_url: imageUrl,
        imageUrl: imageUrl,
        is_drm_protected: Boolean(item.is_drm_protected ?? item.isDrmProtected),
        created_at: createdAt,
        updated_at: updatedAt,
        createdAt: createdAt,
        updatedAt: updatedAt
    };
};

const getFallbackPages = (chapterId?: string): Page[] => {
    try {
        const saved = localStorage.getItem(LS_PAGES);
        let list: Page[] = saved ? JSON.parse(saved) : initialPages;
        if (chapterId) {
            list = list.filter((p) => p.chapterId === chapterId || p.chapter_id === chapterId);
        }
        return list.map(mapPageFromApi).sort((a, b) => a.page_no - b.page_no);
    } catch {
        return initialPages.map(mapPageFromApi);
    }
};

const saveFallbackPages = (list: Page[]) => {
    try {
        localStorage.setItem(LS_PAGES, JSON.stringify(list));
    } catch {
        // Ignore quota
    }
};

/**
 * Page Metadata Service
 * Integrates page listing and metadata management
 */
export const pageService = {
    /**
     * GET /chapters/:chapterId/pages (or fallback)
     */
    getByChapter: async (chapterId: string): Promise<Page[]> => {
        try {
            const res = await api.get<any>(`/chapters/${encodeURIComponent(chapterId)}/pages`);
            const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            return rawList.map(mapPageFromApi);
        } catch {
            return getFallbackPages(chapterId);
        }
    },

    /**
     * GET /pages/:id
     */
    getById: async (id: string): Promise<Page | undefined> => {
        try {
            const res = await api.get<any>(`/pages/${encodeURIComponent(id)}`);
            return mapPageFromApi(res.data);
        } catch {
            const list = getFallbackPages();
            return list.find((p) => p.id === id);
        }
    },

    /**
     * Upload / Register Page scans metadata
     */
    uploadPages: async (chapterId: string, imageUrls: string[]): Promise<Page[]> => {
        try {
            const res = await api.post<any>(`/chapters/${encodeURIComponent(chapterId)}/pages`, { imageUrls });
            const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            return rawList.map(mapPageFromApi);
        } catch {
            const current = getFallbackPages();
            const existingInChapter = current.filter((p) => p.chapterId === chapterId || p.chapter_id === chapterId);
            const startNo = existingInChapter.length;

            const newPages: Page[] = imageUrls.map((url, idx) => ({
                id: `page-${Date.now()}-${idx}`,
                chapter_id: chapterId,
                chapterId: chapterId,
                page_no: startNo + idx + 1,
                pageNumber: startNo + idx + 1,
                image_url: url,
                imageUrl: url,
                is_drm_protected: true,
                created_at: new Date().toISOString(),
                createdAt: new Date().toISOString()
            }));

            const updated = [...current, ...newPages];
            saveFallbackPages(updated);
            return updated.filter((p) => p.chapterId === chapterId || p.chapter_id === chapterId);
        }
    },

    /**
     * Reorder pages in a chapter
     */
    reorder: async (chapterId: string, pageIds: string[]): Promise<Page[]> => {
        try {
            const res = await api.put<any>(`/chapters/${encodeURIComponent(chapterId)}/pages/reorder`, { pageIds });
            const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            return rawList.map(mapPageFromApi);
        } catch {
            const current = getFallbackPages();
            const updated = current.map((p) => {
                if (p.chapterId === chapterId || p.chapter_id === chapterId) {
                    const idx = pageIds.indexOf(p.id);
                    if (idx !== -1) {
                        return { ...p, page_no: idx + 1, pageNumber: idx + 1, updated_at: new Date().toISOString() };
                    }
                }
                return p;
            });
            saveFallbackPages(updated);
            return updated.filter((p) => p.chapterId === chapterId || p.chapter_id === chapterId).sort((a, b) => a.page_no - b.page_no);
        }
    },

    /**
     * DELETE /pages/:id
     */
    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/pages/${encodeURIComponent(id)}`);
        } catch {
            // Fallback
        }
        const current = getFallbackPages();
        saveFallbackPages(current.filter((p) => p.id !== id));
    }
};
