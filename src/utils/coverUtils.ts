import type { Book, BookSeries } from '../types';

/** Displays an explicit NA label when no original cover artwork is available. */
export const getFallbackCoverUrl = (title: string = 'Manga', subtitle: string = 'KuroYomi'): string => {
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460" width="320" height="460">
  <rect width="320" height="460" fill="#e5e7eb" />
  <text x="160" y="240" text-anchor="middle" dominant-baseline="middle" fill="#4b5563" font-family="Arial, sans-serif" font-size="32" font-weight="700">NA</text>
</svg>
`.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Resolves the best available cover for a Series.
 * 1. Series direct cover_image (if valid URL)
 * 2. Any child book's coverUrl / cover_image
 * 3. Explicit NA artwork placeholder
 */
export const getSeriesCover = (series?: BookSeries | null, books: Book[] = []): string => {
    if (!series) return getFallbackCoverUrl('Manga', 'Catalog');

    if (series.cover_image && series.cover_image.trim() !== '') {
        return series.cover_image;
    }

    // Try finding a cover from one of this series' books
    const bookWithCover = books.find(
        (b) => (b.series_id === series.id || (b as any).seriesId === series.id) &&
               ((b.coverUrl && b.coverUrl.trim() !== '') || (b.cover_image && b.cover_image.trim() !== ''))
    );

    if (bookWithCover) {
        return bookWithCover.coverUrl || bookWithCover.cover_image || '';
    }

    return getFallbackCoverUrl(series.title || series.name, 'Manga Series');
};

/**
 * Resolves the best available cover for a Book.
 * 1. Book's coverUrl or cover_image
 * 2. Parent series cover_image
 * 3. Explicit NA artwork placeholder
 */
export const getBookCover = (book?: Book | null, series?: BookSeries | null): string => {
    if (book?.coverUrl && book.coverUrl.trim() !== '') {
        return book.coverUrl;
    }
    if (book?.cover_image && book.cover_image.trim() !== '') {
        return book.cover_image;
    }
    if (series?.cover_image && series.cover_image.trim() !== '') {
        return series.cover_image;
    }

    const title = book?.title || series?.title || 'Manga Book';
    const sub = book?.category || series?.name || 'Volume';
    return getFallbackCoverUrl(title, sub);
};
