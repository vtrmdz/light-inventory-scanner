/**
 * Compress an image file client-side before upload.
 *
 * Strategy: resize so the longest side is at most MAX_DIMENSION,
 * then re-encode as JPEG at QUALITY. This keeps small printed text
 * (SKUs, part numbers) readable while cutting file size ~90%.
 *
 * Typical results:
 *   4032×3024 phone photo (4MB) → 1600×1200 JPEG @ 75% → ~180KB
 *   1920×1080 scan capture       → unchanged res        → ~120KB
 */

const MAX_DIMENSION = 1600; // px — longest side
const QUALITY = 0.75;       // JPEG quality (0.0–1.0)

/**
 * @param {File|Blob} file — original image file
 * @returns {Promise<File>} — compressed JPEG file
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only downscale, never upscale
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // Use better quality interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback: return original if compression fails
            resolve(file);
            return;
          }

          // Preserve original filename but change extension
          const name = (file.name || 'photo')
            .replace(/\.[^.]+$/, '') + '.jpg';

          const compressed = new File([blob], name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve(compressed);
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // If we can't load the image, just return the original
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Compress multiple files. Returns array in same order.
 * @param {File[]} files
 * @returns {Promise<File[]>}
 */
export async function compressImages(files) {
  return Promise.all(files.map(compressImage));
}
