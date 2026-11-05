/**
 * Image helper for resizing and compressing uploaded avatars.
 * Prevents LocalStorage QuotaExceededError by resizing large camera/desktop photos
 * (which can be 5MB - 15MB) into lightweight 240x240 JPEG thumbnails (~15KB - 30KB).
 */

export const compressImageFile = (
  file: File,
  maxWidth = 240,
  maxHeight = 240,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not running in a browser environment, fallback to raw read
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = readerEvent => {
      const rawDataUrl = readerEvent.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      const img = new (window as any).Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        // Draw image onto canvas and convert to lightweight JPEG thumbnail
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (e) {
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        // Fallback to raw data url if image failed to load in element
        resolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
};
