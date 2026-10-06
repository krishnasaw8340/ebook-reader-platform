import axios from 'axios';
import { api } from './api';
import type {
    Chapter,
    CreateChapterPayload,
    UpdateChapterPayload,
    QueryChapterParams,
    PaginatedChapterResponse,
    ChapterPricingModel,
    ChapterPdfUploadUrlPayload,
    ChapterPdfUploadUrlResponse,
    ChapterPdfUploadInitPayload,
    ChapterPdfUploadInitResponse,
    ChapterPdfUploadCompletePayload,
} from '../types';

const LS_CHAPTERS = 'ky_chapters';

/**
 * Normalizes backend Chapter entity into frontend Chapter with Chapter PDF metadata
 */
export const mapChapterFromApi = (item: any): Chapter => {
    const bookId = item.bookId || item.book_id || '';
    const chapterNumber = Number(item.chapterNumber ?? item.chapter_no ?? 1);
    const title = item.title || `Chapter ${chapterNumber}`;
    const sortOrder = Number(item.sortOrder ?? item.sort_order ?? (chapterNumber * 10));
    const pricingModel = (item.pricingModel || item.pricing_model || item.access_type || 'FREE') === 'PAID' ? 'PAID' : 'FREE';
    const coinCost = Number(item.coinCost ?? item.coin_cost ?? 0);
    const published = item.published !== undefined ? Boolean(item.published) : true;
    const createdAt = item.createdAt || item.created_at || new Date().toISOString();
    const updatedAt = item.updatedAt || item.updated_at;

    const pdfStorageKey = item.pdfStorageKey || item.pdf_storage_key || null;
    const pdfFileName = item.pdfFileName || item.pdf_file_name || null;
    const pdfFileSize = item.pdfFileSize ?? item.pdf_file_size ?? null;
    const pdfPageCount = item.pdfPageCount ?? item.pdf_page_count ?? null;
    const pdfChecksum = item.pdfChecksum || item.pdf_checksum || null;
    const contentStatus = item.contentStatus || item.content_status || (pdfStorageKey ? 'READY' : 'PENDING');

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
        coin_cost: coinCost,
        coinCost: coinCost,
        pdf_storage_key: pdfStorageKey,
        pdfStorageKey: pdfStorageKey,
        pdf_file_name: pdfFileName,
        pdfFileName: pdfFileName,
        pdf_file_size: pdfFileSize,
        pdfFileSize: pdfFileSize,
        pdf_page_count: pdfPageCount,
        pdfPageCount: pdfPageCount,
        pdf_checksum: pdfChecksum,
        pdfChecksum: pdfChecksum,
        content_status: contentStatus,
        contentStatus: contentStatus,
        published: published,
        publishedAt: item.publishedAt || item.published_at || null,
        created_at: createdAt,
        updated_at: updatedAt,
        createdAt: createdAt,
        updatedAt: updatedAt,
        book: item.book,
    };
};

const getFallbackChapters = (_bookId?: string, _search?: string): Chapter[] => {
    return [];
};

const saveFallbackChapters = (_chapters: Chapter[]) => {
    // No-op: only real database data is maintained
};

export const chapterService = {
    /**
     * GET /chapters with filters
     */
    getAll: async (params?: QueryChapterParams): Promise<Chapter[]> => {
        const query = params || {};
        try {
            const res = await api.get<any>('/chapters', {
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

            return rawList.map(mapChapterFromApi);
        } catch (error) {
            console.warn('[chapterService.getAll] API request failed:', error);
            return [];
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
            return {
                data: [],
                meta: {
                    total: 0,
                    page: 1,
                    limit: 20,
                    totalPages: 0,
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
            console.warn(`[chapterService.getById] Chapter "${id}" not found:`, error);
            return undefined;
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
        const pricingModel = (data.pricingModel || data.pricing_model || data.access_type || 'FREE') === 'PAID' ? 'PAID' : 'FREE';

        const payload: CreateChapterPayload = {
            bookId,
            chapterNumber,
            title,
            sortOrder,
            pricingModel,
            coinCost: pricingModel === 'PAID' ? Number(data.coinCost ?? data.coin_cost ?? 1) : 0,
            pdfStorageKey: data.pdfStorageKey || data.pdf_storage_key,
            pdfFileName: data.pdfFileName || data.pdf_file_name,
            pdfFileSize: data.pdfFileSize ?? data.pdf_file_size,
            pdfPageCount: data.pdfPageCount ?? data.pdf_page_count,
            pdfChecksum: data.pdfChecksum || data.pdf_checksum,
            contentStatus: data.contentStatus || data.content_status || 'PENDING',
            published: data.published !== undefined ? Boolean(data.published) : true,
            publishedAt: data.publishedAt
        };

        const res = await api.post<any>('/chapters', payload);
        return mapChapterFromApi(res.data);
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
            payload.pricingModel = pricingModel === 'PAID' ? 'PAID' : 'FREE';
            if (payload.pricingModel === 'FREE') {
                payload.coinCost = 0;
            } else if (payload.pricingModel === 'PAID') {
                payload.coinCost = Number(data.coinCost ?? data.coin_cost ?? 1);
            }
        }

        if (data.coinCost !== undefined || data.coin_cost !== undefined) payload.coinCost = Number(data.coinCost ?? data.coin_cost);
        if (data.pdfStorageKey !== undefined) payload.pdfStorageKey = data.pdfStorageKey;
        if (data.pdfFileName !== undefined) payload.pdfFileName = data.pdfFileName;
        if (data.pdfFileSize !== undefined) payload.pdfFileSize = data.pdfFileSize;
        if (data.pdfPageCount !== undefined) payload.pdfPageCount = data.pdfPageCount;
        if (data.pdfChecksum !== undefined) payload.pdfChecksum = data.pdfChecksum;
        if (data.contentStatus !== undefined) payload.contentStatus = data.contentStatus;
        if (data.published !== undefined) payload.published = Boolean(data.published);
        if (data.publishedAt !== undefined) payload.publishedAt = data.publishedAt;

        const res = await api.patch<any>(`/chapters/${encodeURIComponent(id)}`, payload);
        return mapChapterFromApi(res.data);
    },

    /**
     * POST /chapters/:chapterId/content/upload-url
     * Requests presigned S3 PUT URL and versioned object key from NestJS backend
     */
    getUploadUrl: async (
        chapterId: string,
        data: { fileName: string; contentType?: string; fileSize: number }
    ): Promise<ChapterPdfUploadUrlResponse> => {
        const payload = {
            fileName: data.fileName,
            contentType: data.contentType || 'application/pdf',
            fileSize: data.fileSize,
        };
        const res = await api.post<ChapterPdfUploadUrlResponse>(
            `/chapters/${encodeURIComponent(chapterId)}/content/upload-url`,
            payload
        );
        return res.data;
    },

    /**
     * Uploads the PDF file DIRECTLY to AWS S3 via presigned PUT URL.
     * CRITICAL: Uses native XMLHttpRequest without Authorization header so S3 presigned signature is not invalidated.
     * Reports live upload progress.
     */
    uploadPdfToS3: async (
        uploadUrl: string,
        file: File,
        onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
    ): Promise<void> => {
        if (!uploadUrl) {
            throw new Error('Chapter storage upload URL is missing or empty.');
        }

        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

            if (onProgress && xhr.upload) {
                xhr.upload.onprogress = (progressEvent) => {
                    if (progressEvent.lengthComputable && progressEvent.total > 0) {
                        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress({
                            loaded: progressEvent.loaded,
                            total: progressEvent.total,
                            percentage,
                        });
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (onProgress) {
                        onProgress({
                            loaded: file.size,
                            total: file.size,
                            percentage: 100,
                        });
                    }
                    resolve();
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        message: `PDF storage upload rejected with status ${xhr.status}: ${xhr.statusText || 'Forbidden / Bad Request'}`,
                    });
                }
            };

            xhr.onerror = () => {
                reject({
                    status: 0,
                    message: 'Network error occurred during PDF storage upload. Please check S3 CORS and network connection.',
                });
            };

            xhr.send(file);
        });
    },

    /**
     * POST /chapters/:chapterId/content/upload-init
     * Backward-compatible alias for getUploadUrl
     */
    uploadInit: async (chapterId: string, data: ChapterPdfUploadInitPayload): Promise<ChapterPdfUploadInitResponse> => {
        return chapterService.getUploadUrl(chapterId, {
            fileName: data.fileName,
            contentType: data.mimeType || 'application/pdf',
            fileSize: data.fileSize,
        });
    },

    /**
     * POST /chapters/:chapterId/content/complete
     * Informs backend that S3 direct upload succeeded and verifies S3 object
     */
    uploadComplete: async (chapterId: string, data: ChapterPdfUploadCompletePayload): Promise<Chapter> => {
        const res = await api.post<any>(
            `/chapters/${encodeURIComponent(chapterId)}/content/complete`,
            data
        );
        return mapChapterFromApi(res.data);
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
    }
};
