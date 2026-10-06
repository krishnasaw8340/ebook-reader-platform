import { api } from './api';
import type {
    Book,
    CreateBookPayload,
    UpdateBookPayload,
    QueryBookParams,
    PaginatedBookResponse,
    BookStatus,
    PricingModel,
    BookCoverUploadUrlResponse,
} from '../types';
import axios from 'axios';
import { generateSlug } from './seriesService';

const LS_BOOKS = 'ky_books';

/**
 * Normalizes backend Book entity into frontend Book
 */
export const mapBookFromApi = (item: any): Book => {
    const seriesId = item.seriesId || item.series_id || '';
    const volumeId = item.volumeId !== undefined ? item.volumeId : (item.volume_id !== undefined ? item.volume_id : null);
    const title = item.title || 'Untitled Book';
    const createdAt = item.createdAt || item.created_at || new Date().toISOString();
    const updatedAt = item.updatedAt || item.updated_at;
    const releaseDate = item.releaseDate || item.release_date || null;
    const pricingModel = (item.pricingModel || item.pricing_model || (item.coinPrice > 0 || item.coin_price > 0 ? 'PER_CHAPTER' : 'FREE')) as PricingModel;
    const coinPrice = Number(item.coinPrice ?? item.coin_price ?? 0);
    const defaultChapterCoinCost = Number(item.defaultChapterCoinCost ?? item.default_chapter_coin_cost ?? 0);
    const defaultFreeChapters = Number(item.defaultFreeChapters ?? item.default_free_chapters ?? 0);
    const totalChapters = Number(item.totalChapters ?? item.chapter_count ?? 0);

    const coverImage = item.coverUrl || null;
    const bannerImage = item.banner_image || item.bannerImage || coverImage;
    const thumbnailImage = item.thumbnail_image || item.thumbnailImage || coverImage;

    return {
        id: item.id,
        series_id: seriesId,
        seriesId: seriesId,
        volume_id: volumeId,
        volumeId: volumeId,
        title: title,
        japanese_title: item.japaneseTitle || item.japanese_title || null,
        japaneseTitle: item.japaneseTitle || item.japanese_title || null,
        slug: item.slug || generateSlug(title),
        summary: item.description ?? item.summary ?? null,
        description: item.description ?? item.summary ?? null,
        language: item.language?.name || item.language || null,
        languageId: item.languageId || item.language_id || '',
        author: item.author?.name || item.author || null,
        authorId: item.authorId || null,
        artist: item.artist?.name || item.artist || null,
        artistId: item.artistId || null,
        category: item.category?.name || item.category || null,
        categoryId: item.categoryId || item.category_id || '',
        genres: Array.isArray(item.genres) ? item.genres.map((g: any) => typeof g === 'string' ? g : g.name) : (item.genreIds || []),
        genreIds: Array.isArray(item.genres) ? item.genres.map((g: any) => typeof g === 'string' ? g : g.id) : (item.genreIds || []),
        tags: Array.isArray(item.tags) ? item.tags.map((t: any) => typeof t === 'string' ? t : t.name) : (item.tagIds || []),
        tagIds: Array.isArray(item.tags) ? item.tags.map((t: any) => typeof t === 'string' ? t : t.id) : (item.tagIds || []),
        cover_image: coverImage,
        coverImage: coverImage,
        coverUrl: item.coverUrl || null,
        coverFileName: item.coverFileName || null,
        coverFileSize: item.coverFileSize ?? null,
        coverContentType: item.coverContentType || null,
        banner_image: bannerImage,
        bannerImage: bannerImage,
        thumbnail_image: thumbnailImage,
        thumbnailImage: thumbnailImage,
        release_date: releaseDate,
        releaseDate: releaseDate,
        publishedAt: item.publishedAt || null,

        pricing_model: pricingModel,
        pricingModel: pricingModel,
        coin_price: coinPrice,
        coinPrice: coinPrice,
        default_chapter_coin_cost: defaultChapterCoinCost,
        defaultChapterCoinCost: defaultChapterCoinCost,
        default_free_chapters: defaultFreeChapters,
        defaultFreeChapters: defaultFreeChapters,
        is_premium: Boolean(item.isPremium ?? item.is_premium),
        isPremium: Boolean(item.isPremium ?? item.is_premium),

        status: (item.status as BookStatus) || 'DRAFT',
        chapter_count: totalChapters,
        totalChapters: totalChapters,

        averageRating: Number(item.averageRating || 0),
        totalViews: Number(item.totalViews || 0),
        created_at: createdAt,
        updated_at: updatedAt,
        createdAt: createdAt,
        updatedAt: updatedAt,
        series: item.series,
        volume: item.volume
    };
};

const getFallbackBooks = (_params?: QueryBookParams): Book[] => {
    return [];
};

const saveFallbackBooks = (_list: Book[]) => {
    // No-op: only real database data is maintained
};

/**
 * Book API Service
 * - GET    /books
 * - GET    /books/:id
 * - POST   /books (Admin)
 * - PATCH  /books/:id (Admin)
 * - DELETE /books/:id (Admin)
 */

const isUUID = (val: any): boolean =>
    typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const DEFAULT_LANGUAGES: Record<string, string> = {
    english: 'aa47e99c-8a1a-4d5e-970c-db916528b199',
    en: 'aa47e99c-8a1a-4d5e-970c-db916528b199',
    japanese: '830f6493-88c4-4fd0-b922-c96d459f844e',
    ja: '830f6493-88c4-4fd0-b922-c96d459f844e',
    french: 'c7c3a0d9-f32d-4968-bdec-092f05c09d23',
    fr: 'c7c3a0d9-f32d-4968-bdec-092f05c09d23',
    german: 'cd418489-4799-4606-a0b6-6d8e958c7959',
    de: 'cd418489-4799-4606-a0b6-6d8e958c7959',
};

const DEFAULT_CATEGORIES: Record<string, string> = {
    manga: '00142c6a-cf97-4d2f-ab9f-7ad6499f6e26',
    manhwa: 'bc94a884-e419-4022-aec6-c3579a20f8d5',
    manhua: '45af38b8-eb85-442f-92e8-440d3abba462',
    novel: '8899aeb1-e17e-479f-89aa-51d348af3cf7',
    'light novel': '0d480761-e69f-48a4-9e84-d0e9b1e053c4',
    'light-novel': '0d480761-e69f-48a4-9e84-d0e9b1e053c4',
    shonen: '00142c6a-cf97-4d2f-ab9f-7ad6499f6e26',
    seinen: '00142c6a-cf97-4d2f-ab9f-7ad6499f6e26',
    shojo: '00142c6a-cf97-4d2f-ab9f-7ad6499f6e26',
    josei: '00142c6a-cf97-4d2f-ab9f-7ad6499f6e26',
    webtoon: 'bc94a884-e419-4022-aec6-c3579a20f8d5',
};

const DEFAULT_GENRES: Record<string, string> = {
    action: '5d3ab5fb-19eb-40c2-9922-a1d5846578ed',
    adventure: 'abd96397-6387-4c2d-a451-f0fb7744aa51',
    comedy: '5cf3a7e8-21a5-4da8-9b19-ae34df65e991',
    drama: '67cbe159-2168-417c-964a-2b3d064c8e7c',
    fantasy: '70f3900f-42eb-43da-94f7-7ae3405c829c',
    romance: '2b9d22d9-412d-42ac-a824-a9bf9d47e348',
    horror: 'b86ae00d-f34d-44ca-bd3e-85677f61dd3c',
    mystery: '70c88542-b603-448e-84f6-ba1665e9484a',
    'sci-fi': 'db2fb621-a540-4cc0-9701-64441881c1bc',
    scifi: 'db2fb621-a540-4cc0-9701-64441881c1bc',
};

const DEFAULT_TAGS: Record<string, string> = {
    school: 'b1ab7696-dda1-49e2-a035-264a2972ced9',
    magic: '962adf53-a653-4b19-97f4-dedbb9019d6f',
    revenge: '2d624a75-b2e4-404d-97fd-d25d268ca921',
    'time travel': '0144c50e-0c27-462a-9235-d22dc0bee967',
    timetravel: '0144c50e-0c27-462a-9235-d22dc0bee967',
    pirates: '3895728e-86bc-48a8-a3c4-03a9ce87f0f4',
    supernatural: '22709ac7-527a-4991-a743-73f5c07dc33a',
};

export const bookService = {
    /**
     * GET /books
     * Lists books with rich query filters, search, and pagination
     */
    getAll: async (params?: QueryBookParams): Promise<Book[]> => {
        const query = params || {};
        try {
            const res = await api.get<PaginatedBookResponse | Book[]>('/books', {
                params: {
                    seriesId: query.seriesId || undefined,
                    volumeId: query.volumeId || undefined,
                    authorId: query.authorId || undefined,
                    artistId: query.artistId || undefined,
                    languageId: query.languageId || undefined,
                    categoryId: query.categoryId || undefined,
                    genreId: query.genreId || undefined,
                    tagId: query.tagId || undefined,
                    status: query.status || undefined,
                    pricingModel: query.pricingModel || undefined,
                    isPremium: query.isPremium !== undefined ? query.isPremium : undefined,
                    search: query.search || undefined,
                    page: query.page || 1,
                    limit: query.limit || 50,
                    sortBy: query.sortBy || 'createdAt',
                    sortOrder: query.sortOrder || 'DESC',
                },
            });

            const rawList = Array.isArray(res.data)
                ? res.data
                : (res.data && Array.isArray((res.data as any).data))
                ? (res.data as any).data
                : [];

            const normalized = rawList.map(mapBookFromApi);
            return normalized;
        } catch (error) {
            console.warn('[bookService.getAll] API request failed:', error);
            return [];
        }
    },

    /**
     * GET /books with pagination metadata
     */
    getPaginated: async (params?: QueryBookParams): Promise<PaginatedBookResponse> => {
        const query = params || {};
        try {
            const res = await api.get<PaginatedBookResponse>('/books', {
                params: {
                    seriesId: query.seriesId || undefined,
                    volumeId: query.volumeId || undefined,
                    authorId: query.authorId || undefined,
                    artistId: query.artistId || undefined,
                    languageId: query.languageId || undefined,
                    categoryId: query.categoryId || undefined,
                    genreId: query.genreId || undefined,
                    tagId: query.tagId || undefined,
                    status: query.status || undefined,
                    pricingModel: query.pricingModel || undefined,
                    isPremium: query.isPremium !== undefined ? query.isPremium : undefined,
                    search: query.search || undefined,
                    page: query.page || 1,
                    limit: query.limit || 20,
                    sortBy: query.sortBy || 'createdAt',
                    sortOrder: query.sortOrder || 'DESC',
                },
            });

            const rawList = Array.isArray(res.data?.data) ? res.data.data : [];
            return {
                data: rawList.map(mapBookFromApi),
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
            console.warn('[bookService.getPaginated] API request failed:', error);
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
     * GET /books/:id
     * Resolves book by UUID or unique slug with joined relations
     */
    getById: async (idOrSlug: string): Promise<Book | undefined> => {
        try {
            const res = await api.get<any>(`/books/${encodeURIComponent(idOrSlug)}`);
            return mapBookFromApi(res.data);
        } catch (error) {
            console.warn(`[bookService.getById] Book "${idOrSlug}" not found in database:`, error);
            return undefined;
        }
    },

    /**
     * POST /books (ADMIN)
     * Creates a new catalog book
     */
    create: async (data: CreateBookPayload | any): Promise<Book> => {
        const seriesId = data.seriesId || data.series_id;
        const rawVolId = data.volumeId !== undefined ? data.volumeId : data.volume_id;
        const volumeId = isUUID(rawVolId) ? rawVolId : undefined;
        const title = data.title ? data.title.trim() : '';
        const slug = data.slug ? data.slug.trim().toLowerCase() : generateSlug(title);

        // Resolve languageId (ensure valid UUID v4)
        let languageId = data.languageId || data.language_id;
        if (!isUUID(languageId)) {
            const rawLang = String(data.language || languageId || 'English').toLowerCase().trim();
            languageId = DEFAULT_LANGUAGES[rawLang] || 'aa47e99c-8a1a-4d5e-970c-db916528b199';
        }

        // Resolve categoryId (ensure valid UUID v4)
        let categoryId = data.categoryId || data.category_id;
        if (!isUUID(categoryId)) {
            const rawCat = String(data.category || categoryId || 'Manga').toLowerCase().trim();
            categoryId = DEFAULT_CATEGORIES[rawCat] || '00142c6a-cf97-4d2f-ab9f-7ad6499f6e26';
        }

        // Resolve genreIds (ensure all are valid UUID v4)
        const rawGenres = data.genreIds || data.genres || [];
        const genreIds: string[] = [];
        if (Array.isArray(rawGenres)) {
            for (const item of rawGenres) {
                if (isUUID(item)) {
                    if (!genreIds.includes(item)) genreIds.push(item);
                } else if (typeof item === 'string') {
                    const mapped = DEFAULT_GENRES[item.toLowerCase().trim()];
                    if (mapped && !genreIds.includes(mapped)) genreIds.push(mapped);
                }
            }
        }

        // Resolve tagIds (ensure all are valid UUID v4)
        const rawTags = data.tagIds || data.tags || [];
        const tagIds: string[] = [];
        if (Array.isArray(rawTags)) {
            for (const item of rawTags) {
                if (isUUID(item)) {
                    if (!tagIds.includes(item)) tagIds.push(item);
                } else if (typeof item === 'string') {
                    const mapped = DEFAULT_TAGS[item.toLowerCase().trim()];
                    if (mapped && !tagIds.includes(mapped)) tagIds.push(mapped);
                }
            }
        }

        const authorId = isUUID(data.authorId) ? data.authorId : undefined;
        const artistId = isUUID(data.artistId) ? data.artistId : undefined;

        const payload: CreateBookPayload = {
            seriesId,
            volumeId,
            title,
            japaneseTitle: data.japaneseTitle || data.japanese_title || undefined,
            slug,
            description: data.description || data.summary || undefined,
            authorId,
            artistId,
            languageId,
            categoryId,
            genreIds: genreIds.length > 0 ? genreIds : undefined,
            tagIds: tagIds.length > 0 ? tagIds : undefined,
            status: data.status || 'DRAFT',
            pricingModel: data.pricingModel || data.pricing_model || 'FREE',
            defaultChapterCoinCost: data.defaultChapterCoinCost !== undefined ? data.defaultChapterCoinCost : data.default_chapter_coin_cost,
            defaultFreeChapters: data.defaultFreeChapters !== undefined ? data.defaultFreeChapters : data.default_free_chapters,
            isPremium: data.isPremium !== undefined ? data.isPremium : Boolean(data.is_premium),
            releaseDate: data.releaseDate || data.release_date || undefined,
            publishedAt: data.publishedAt
        };

        const res = await api.post<any>('/books', payload);
        return mapBookFromApi(res.data);
    },

    /**
     * PATCH /books/:id (ADMIN)
     * Updates book details and relations
     */
    update: async (id: string, data: UpdateBookPayload | any): Promise<Book> => {
        const payload: UpdateBookPayload = {};

        if (data.seriesId !== undefined || data.series_id !== undefined) payload.seriesId = data.seriesId || data.series_id;
        if (data.volumeId !== undefined || data.volume_id !== undefined) payload.volumeId = data.volumeId !== undefined ? data.volumeId : data.volume_id;
        if (data.title !== undefined) payload.title = data.title.trim();
        if (data.japaneseTitle !== undefined || data.japanese_title !== undefined) payload.japaneseTitle = data.japaneseTitle || data.japanese_title;
        if (data.slug !== undefined) payload.slug = data.slug.trim().toLowerCase();
        if (data.description !== undefined || data.summary !== undefined) payload.description = data.description ?? data.summary;
        if (data.authorId !== undefined) payload.authorId = data.authorId;
        if (data.artistId !== undefined) payload.artistId = data.artistId;
        if (data.languageId !== undefined) payload.languageId = data.languageId;
        if (data.categoryId !== undefined) payload.categoryId = data.categoryId;
        if (data.genreIds !== undefined || data.genres !== undefined) payload.genreIds = data.genreIds || data.genres;
        if (data.tagIds !== undefined || data.tags !== undefined) payload.tagIds = data.tagIds || data.tags;
        if (data.status !== undefined) payload.status = data.status;
        if (data.pricingModel !== undefined || data.pricing_model !== undefined) payload.pricingModel = data.pricingModel || data.pricing_model;
        if (data.defaultChapterCoinCost !== undefined || data.default_chapter_coin_cost !== undefined) payload.defaultChapterCoinCost = data.defaultChapterCoinCost ?? data.default_chapter_coin_cost;
        if (data.defaultFreeChapters !== undefined || data.default_free_chapters !== undefined) payload.defaultFreeChapters = data.defaultFreeChapters ?? data.default_free_chapters;
        if (data.isPremium !== undefined || data.is_premium !== undefined) payload.isPremium = data.isPremium !== undefined ? data.isPremium : data.is_premium;
        if (data.releaseDate !== undefined || data.release_date !== undefined) payload.releaseDate = data.releaseDate || data.release_date;
        if (data.publishedAt !== undefined) payload.publishedAt = data.publishedAt;

        const res = await api.patch<any>(`/books/${encodeURIComponent(id)}`, payload);
        return mapBookFromApi(res.data);
    },

    /**
     * POST /books/:bookId/cover/upload-url (ADMIN)
     * Backend validates type/size and generates the object key.
     */
    getCoverUploadUrl: async (
        bookId: string,
        data: { fileName: string; fileSize: number; contentType: string }
    ): Promise<BookCoverUploadUrlResponse> => {
        const res = await api.post<any>(
            `/books/${encodeURIComponent(bookId)}/cover/upload-url`,
            data
        );
        const raw = res.data?.data || res.data || {};
        return {
            bookId: raw.bookId || raw.book_id || bookId,
            objectKey: raw.objectKey || raw.object_key || raw.key || '',
            uploadUrl: raw.uploadUrl || raw.upload_url || raw.url || '',
            contentType: raw.contentType || raw.content_type || data.contentType || 'image/jpeg',
            expiresIn: Number(raw.expiresIn || raw.expires_in || 3600),
        };
    },

    /**
     * Uploads the image DIRECTLY to S3 (no Authorization headers; exact Content-Type as signed).
     * Uses native XMLHttpRequest to avoid Axios interceptor pollution and track real upload progress.
     */
    uploadCoverToS3: async (
        uploadUrl: string,
        file: File,
        contentType: string,
        onProgress?: (percentage: number) => void
    ): Promise<void> => {
        if (!uploadUrl) {
            throw new Error('Storage upload URL is missing or empty.');
        }

        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', contentType || file.type || 'image/jpeg');

            if (onProgress && xhr.upload) {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable && e.total > 0) {
                        onProgress(Math.round((e.loaded * 100) / e.total));
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (onProgress) onProgress(100);
                    resolve();
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        message: `S3 storage upload rejected with status ${xhr.status}: ${xhr.statusText || 'Forbidden / Bad Request'}`,
                    });
                }
            };

            xhr.onerror = () => {
                reject({
                    status: 0,
                    message: 'Network error occurred while uploading cover to storage. Check S3 CORS and network connection.',
                });
            };

            xhr.send(file);
        });
    },

    /**
     * POST /books/:bookId/cover/complete (ADMIN)
     */
    completeCoverUpload: async (bookId: string, fileName: string): Promise<Book> => {
        const res = await api.post<any>(`/books/${encodeURIComponent(bookId)}/cover/complete`, { fileName });
        return mapBookFromApi(res.data);
    },

    /**
     * Quick Toggle Publish Status
     */
    togglePublish: async (id: string): Promise<Book> => {
        const existing = await bookService.getById(id);
        const nextStatus = existing?.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        return bookService.update(id, { status: nextStatus, publishedAt: nextStatus === 'PUBLISHED' ? new Date().toISOString() : undefined });
    },

    /**
     * Archive Book
     */
    archive: async (id: string): Promise<Book> => {
        return bookService.update(id, { status: 'ARCHIVED' });
    },

    /**
     * DELETE /books/:id (ADMIN)
     * Soft-deletes a book
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/books/${encodeURIComponent(id)}`);
    }
};
