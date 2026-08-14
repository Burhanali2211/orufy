import { supabase } from '../lib/legacyDb';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const BUCKET_NAME = 'images';

export class StorageService {
  static async initializeBucket(): Promise<void> {
    return Promise.resolve();
  }

  static async uploadImage(
    file: File,
    folder: string = 'uploads',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Declare outside try so it can be cleared in both success and error paths
    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      // Normalise content type — camera captures can return "" (some Android) or
      // "image/heic"/"image/heif" (iOS). Default both to JPEG so Supabase accepts them.
      let contentType = file.type;
      let fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();

      if (!contentType || contentType === 'image/heic' || contentType === 'image/heif') {
        contentType = 'image/jpeg';
        fileExt = 'jpg';
      }

      // Simulate progress up to 90% max — jumps to 100% only when upload actually finishes
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

      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const path = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '31536000',
          contentType,
          upsert: false,
        });

      // Upload finished — clear the simulation and report 100%
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw new Error(error.message || 'Failed to upload image to storage');
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      // Always clear the interval on failure so the UI doesn't stay stuck
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      console.error('Image upload error:', error);
      throw error instanceof Error ? error : new Error('Failed to upload image');
    }
  }

  static async deleteImage(path: string): Promise<void> {
    try {
      const url = new URL(path);
      const pathSegments = url.pathname.split('/storage/v1/object/public/images/');
      if (pathSegments.length > 1) {
        const filePath = pathSegments[1];
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  static getPublicUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    if (path.startsWith('/uploads')) {
      return path;
    }
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return data.publicUrl;
  }
}
