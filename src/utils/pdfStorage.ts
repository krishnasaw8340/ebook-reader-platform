/**
 * IndexedDB storage for Chapter PDF files.
 * Allows instant local viewing of uploaded PDFs in Reader even if offline or before remote processing.
 */

const DB_NAME = 'ky_pdf_store';
const STORE_NAME = 'chapter_pdfs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const getDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'chapterId' });
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    return dbPromise;
};

export interface StoredPdfRecord {
    chapterId: string;
    blob: Blob;
    fileName: string;
    fileSize: number;
    updatedAt: number;
}

/**
 * Stores a PDF file or Blob for a chapter in IndexedDB.
 */
export const storeChapterPdf = async (chapterId: string, file: File | Blob, fileName?: string): Promise<void> => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record: StoredPdfRecord = {
            chapterId,
            blob: file,
            fileName: fileName || (file instanceof File ? file.name : 'chapter.pdf'),
            fileSize: file.size,
            updatedAt: Date.now()
        };

        store.put(record);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('[pdfStorage] Failed to save PDF to IndexedDB:', err);
    }
};

/**
 * Retrieves the stored PDF Blob URL for a chapter if available.
 */
export const getChapterPdfUrl = async (chapterId: string): Promise<string | null> => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(chapterId);

        return new Promise((resolve) => {
            req.onsuccess = () => {
                const record = req.result as StoredPdfRecord | undefined;
                if (record && record.blob) {
                    const url = URL.createObjectURL(record.blob);
                    resolve(url);
                } else {
                    resolve(null);
                }
            };
            req.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
};
