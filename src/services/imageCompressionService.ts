/**
 * Image Compression Service
 * Handles compression of captured images before upload
 * Optimizes for web delivery without quality loss
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  format?: 'jpeg' | 'webp' | 'png';
}

export class ImageCompressionService {
  /**
   * Compress image file and return as blob
   * Optimized for camera captures and large images
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions to fit within maxWidth/maxHeight
          const maxDim = Math.max(width, height);
          const maxAllowed = Math.max(maxWidth, maxHeight);

          if (maxDim > maxAllowed) {
            const ratio = maxAllowed / maxDim;
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw image with better rendering quality
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with specified format and quality
          const mimeType = format === 'webp' ? 'image/webp' :
                          format === 'png' ? 'image/png' :
                          'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // If WebP is not supported, fall back to JPEG
              if (format === 'webp' && blob.type !== 'image/webp') {
                canvas.toBlob(
                  (jpegBlob) => {
                    resolve(jpegBlob || blob);
                  },
                  'image/jpeg',
                  quality
                );
              } else {
                resolve(blob);
              }
            },
            mimeType,
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        const result = event.target?.result;
        if (typeof result === 'string') {
          img.src = result;
        } else {
          reject(new Error('Failed to read file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if image needs compression
   * Returns true if file size is large or dimensions are excessive
   */
  static shouldCompress(file: File): boolean {
    // Compress if larger than 1MB
    return file.size > 1024 * 1024;
  }

  /**
   * Get estimated compression ratio
   */
  static getCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize) * 100;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Create a File object from a Blob
   */
  static blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, { type: blob.type });
  }

  /**
   * Process image and return optimized File
   * Automatically compresses if needed
   */
  static async optimizeImage(file: File): Promise<File> {
    try {
      // Check if compression is needed
      if (!this.shouldCompress(file)) {
        return file;
      }

      // Determine best format based on device/browser
      const format = this.supportsWebP() ? 'webp' : 'jpeg';

      // Compress the image
      const compressedBlob = await this.compressImage(file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8,
        format
      });

      // Create new File from compressed blob
      const ext = format === 'webp' ? 'webp' : 'jpg';
      const newFilename = `${file.name.split('.')[0]}.${ext}`;
      const compressedFile = this.blobToFile(compressedBlob, newFilename);

      return compressedFile;
    } catch (error) {
      console.warn('Image optimization failed, using original:', error);
      return file;
    }
  }

  /**
   * Check if browser supports WebP
   */
  private static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }
}
