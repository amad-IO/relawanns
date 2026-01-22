import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to reduce its size for faster upload.
 * 
 * @param file The original image file
 * @param maxSizeMB Maximum size in MB (default: 1)
 * @param maxWidthOrHeight Maximum width or height in pixels (default: 1920)
 * @returns Promise resolving to the compressed File
 */
export const compressImage = async (
    file: File,
    maxSizeMB: number = 1,
    maxWidthOrHeight: number = 1920
): Promise<File> => {
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        fileType: file.type as string,
        initialQuality: 0.8
    };

    try {
        const compressedBlob = await imageCompression(file, options);

        // Convert Blob back to File to preserve name and lastModified
        const compressedFile = new File(
            [compressedBlob],
            file.name,
            {
                type: file.type,
                lastModified: Date.now()
            }
        );

        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Fallback to original if compression fails
    }
};
