import type { Book, BookSeries } from '../types';

/**
 * Generates an SVG Data URI for manga covers when no cover image has been uploaded.
 * This guarantees no broken image icons, works 100% offline, and looks like a real manga poster.
 */
export const getFallbackCoverUrl = (title: string = 'Manga', subtitle: string = 'KuroYomi'): string => {
    // Generate deterministic hue based on title
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 45) % 360;

    const safeTitle = title.length > 28 ? title.slice(0, 26) + '...' : title;
    const initial = (title.trim()[0] || 'M').toUpperCase();

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460" width="320" height="460">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue1}, 65%, 12%)" />
      <stop offset="60%" stop-color="hsl(${hue2}, 75%, 8%)" />
      <stop offset="100%" stop-color="#0a0a0c" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e63946" />
      <stop offset="100%" stop-color="#ff6b6b" />
    </linearGradient>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="320" height="460" fill="url(#bg)" />
  <rect width="320" height="460" fill="url(#grid)" />

  <!-- Poster Border / Spine Accent -->
  <rect x="0" y="0" width="8" height="460" fill="url(#accent)" />
  <rect x="18" y="18" width="284" height="424" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1" rx="4" />

  <!-- Japanese KuroYomi Kanji Watermark -->
  <text x="160" y="220" font-family="'Noto Sans JP', sans-serif" font-size="120" font-weight="900" fill="rgba(255,255,255,0.035)" text-anchor="middle" dominant-baseline="middle">黒読</text>

  <!-- Giant Stylized Initial -->
  <circle cx="160" cy="180" r="54" fill="rgba(230, 57, 70, 0.15)" stroke="rgba(230, 57, 70, 0.4)" stroke-width="2" />
  <text x="160" y="196" font-family="'Outfit', sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">${initial}</text>

  <!-- Top Brand Tag -->
  <rect x="30" y="32" width="76" height="20" rx="3" fill="rgba(255,255,255,0.08)" />
  <text x="68" y="46" font-family="'Outfit', sans-serif" font-size="9" font-weight="800" fill="#ff6b6b" text-anchor="middle" letter-spacing="1">KUROYOMI</text>

  <!-- Bottom Title Block -->
  <rect x="24" y="340" width="272" height="88" rx="6" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
  <text x="40" y="375" font-family="'Outfit', sans-serif" font-size="16" font-weight="800" fill="#ffffff">${escapeXml(safeTitle)}</text>
  <text x="40" y="398" font-family="'Outfit', sans-serif" font-size="11" font-weight="600" fill="#9ca3af">${escapeXml(subtitle)}</text>
  <circle cx="270" cy="384" r="10" fill="#e63946" />
  <polygon points="268,379 274,384 268,389" fill="#ffffff" />
</svg>
`.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

/**
 * Resolves the best available cover for a Series.
 * 1. Series direct cover_image (if valid URL)
 * 2. Any child book's coverUrl / cover_image
 * 3. Graceful SVG manga poster fallback
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
 * 3. Graceful SVG manga poster fallback
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
