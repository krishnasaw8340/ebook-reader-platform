import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, ImageOff, RefreshCw } from 'lucide-react';
import { bookService } from '../../services/bookService';
import type { Book } from '../../types';
import uiStyles from '../components/AdminUI.module.css';

export const COVER_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// UX-only pre-check; the backend (MAX_BOOK_COVER_SIZE_MB) is the final authority.
const COVER_MAX_MB = Number(import.meta.env.VITE_MAX_BOOK_COVER_SIZE_MB || 10);

export const validateCoverFile = (file: File): string | null => {
    if (!COVER_ALLOWED_TYPES.includes(file.type)) {
        return 'Unsupported image type. Please choose a JPEG, PNG or WebP image.';
    }
    if (file.size <= 0) return 'The selected file is empty.';
    if (file.size > COVER_MAX_MB * 1024 * 1024) {
        return `Cover image is too large. Maximum size is ${COVER_MAX_MB} MB.`;
    }
    return null;
};

export const extractApiError = (err: any, fallback: string): string => {
    const msg = err?.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return fallback;
};

/**
 * React -> NestJS (presigned URL) -> React -> S3 (direct PUT) -> NestJS (complete).
 * Image bytes never pass through NestJS.
 */
export const uploadBookCover = async (
    bookId: string,
    file: File,
    onProgress?: (pct: number) => void
): Promise<Book> => {
    const invalid = validateCoverFile(file);
    if (invalid) throw new Error(invalid);

    const { uploadUrl, contentType } = await bookService.getCoverUploadUrl(bookId, {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
    });

    try {
        await bookService.uploadCoverToS3(uploadUrl, file, contentType, onProgress);
    } catch (err: any) {
        const status = err?.response?.status;
        throw new Error(
            status === 403
                ? 'Upload link expired or was rejected by storage. Please try again.'
                : 'Upload to storage failed. Please check your connection and try again.'
        );
    }

    return bookService.completeCoverUpload(bookId, file.name);
};

const formatSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface BookCoverUploaderProps {
    /** When set, uploads immediately (edit/replace). When omitted, the picked file is handed to the parent. */
    bookId?: string;
    /** Real, API-provided cover URL (presigned GET). */
    coverUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    /** Pending mode: the file chosen before the book exists. */
    pendingFile?: File | null;
    onFileSelected?: (file: File | null) => void;
    onUploaded?: (book: Book) => void;
    onError?: (message: string) => void;
    onSuccess?: (message: string) => void;
}

export const BookCoverUploader: React.FC<BookCoverUploaderProps> = ({
    bookId, coverUrl, fileName, fileSize, pendingFile, onFileSelected, onUploaded, onError, onSuccess
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState<number | null>(null);
    const [pendingPreview, setPendingPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!pendingFile) { setPendingPreview(null); return; }
        const url = URL.createObjectURL(pendingFile);
        setPendingPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingFile]);

    const handleChoose = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (inputRef.current) inputRef.current.value = '';
        if (!file) return;

        const invalid = validateCoverFile(file);
        if (invalid) { onError?.(invalid); return; }

        if (!bookId) { onFileSelected?.(file); return; }

        setProgress(0);
        try {
            const updated = await uploadBookCover(bookId, file, setProgress);
            onUploaded?.(updated);
            onSuccess?.('Cover image uploaded successfully.');
        } catch (err: any) {
            onError?.(extractApiError(err, err?.message || 'Failed to upload cover image.'));
        } finally {
            setProgress(null);
        }
    };

    const preview = pendingPreview || coverUrl || null;
    const shownName = pendingFile?.name || fileName;
    const shownSize = pendingFile ? pendingFile.size : fileSize;
    const uploading = progress !== null;

    return (
        <div className={uiStyles.formGroup}>
            <label className={uiStyles.formLabel}>Cover Image</label>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div
                    style={{
                        width: '150px', height: '210px', borderRadius: '8px', overflow: 'hidden',
                        border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}
                >
                    {preview ? (
                        <img src={preview} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                            <ImageOff size={28} style={{ marginBottom: '6px' }} />
                            <div>No cover</div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
                    {shownName && (
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>File</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{shownName}</div>
                            {shownSize ? <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatSize(shownSize)}</div> : null}
                        </div>
                    )}

                    <input
                        ref={inputRef}
                        id="book-cover-input"
                        type="file"
                        accept={COVER_ALLOWED_TYPES.join(',')}
                        style={{ display: 'none' }}
                        onChange={handleChoose}
                    />
                    <button
                        type="button"
                        id="book-cover-upload-btn"
                        className={uiStyles.btnSecondary}
                        onClick={() => inputRef.current?.click()}
                        disabled={uploading}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
                    >
                        {preview ? <RefreshCw size={14} /> : <UploadCloud size={14} />}
                        {preview ? 'Replace Cover' : 'Upload Cover'}
                    </button>

                    {uploading && (
                        <div style={{ width: '240px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                {progress >= 100 ? 'Finalizing...' : 'Uploading...'}
                            </div>
                            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.15s' }} />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{progress}%</div>
                        </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        JPEG, PNG or WebP, up to {COVER_MAX_MB} MB.
                    </div>
                </div>
            </div>
        </div>
    );
};
