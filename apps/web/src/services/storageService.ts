import { apiClient } from '../lib/apiClient';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  key: string;
  url: string;
}

export class StorageService {
  /**
   * Initialize bucket (no-op for R2)
   */
  static async initializeBucket(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Upload image to Cloudflare R2 via backend
   */
  static async uploadImage(
    file: File,
    folder: string = 'uploads',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // Simulate progress since fetch doesn't support upload progress natively
      if (onProgress) {
        const total = file.size;
        let loaded = 0;
        progressInterval = setInterval(() => {
          loaded = Math.min(loaded + total / 15, total * 0.9);
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });
        }, 150);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const result = await apiClient.post<UploadResult>('/dashboard/storage/upload', formData);

      // Upload finished
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      return result.url;
    } catch (error) {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      console.error('Image upload error:', error);
      throw error instanceof Error ? error : new Error('Failed to upload image');
    }
  }

  /**
   * Delete image from Cloudflare R2 via backend
   */
  static async deleteImage(path: string): Promise<void> {
    try {
      // Extract key from URL
      // R2 URL format: https://public-domain/tenant-id/folder/uuid.ext
      const url = new URL(path);
      // Pathname will be /tenant-id/folder/uuid.ext
      // We want to remove the leading /
      const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

      await apiClient.delete('/dashboard/storage/delete', { key });
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  /**
   * Gets the public URL (path is already a full URL from our R2 backend)
   */
  static getPublicUrl(path: string): string {
    return path;
  }
}
