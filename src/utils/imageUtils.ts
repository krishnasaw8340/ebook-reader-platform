/**
 * Image processing utilities for manga chapter pages and covers.
 */

export const convertToWebp = async (file: File): Promise<{ file: File; width: number; height: number }> => {
    const bitmap = await createImageBitmap(file);
    try {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'webp') return { file, width: bitmap.width, height: bitmap.height };

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error(`Could not convert "${file.name}" to WebP.`);
        context.drawImage(bitmap, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88));
        if (!blob) throw new Error(`Could not convert "${file.name}" to WebP.`);
        const webpName = file.name.replace(/\.[^.]+$/, '.webp');
        return {
            file: new File([blob], webpName, { type: 'image/webp', lastModified: file.lastModified }),
            width: bitmap.width,
            height: bitmap.height,
        };
    } finally {
        bitmap.close();
    }
};

export const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/') || /\.(webp|jpe?g|png|avif|gif)$/i.test(file.name);
};

export const isPdfFile = (file: File): boolean => {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};
