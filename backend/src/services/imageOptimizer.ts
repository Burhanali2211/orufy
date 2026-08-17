import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg';
}

/**
 * Optimizes an image buffer using Sharp:
 * - Converts to modern WebP/AVIF format
 * - Resizes proportionally if exceeds dimensions
 * - Strips bulky EXIF metadata
 * - Compresses with smart lossy encoding
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 82,
    format = 'webp'
  } = options;

  let pipeline = sharp(inputBuffer)
    .rotate() // Auto-orient based on EXIF before stripping
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    });

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality, effort: 4 });
  } else if (format === 'avif') {
    pipeline = pipeline.avif({ quality, effort: 4 });
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  return pipeline.toBuffer();
}

/**
 * Generates a square thumbnail for avatars and product cards
 */
export async function generateThumbnailBuffer(
  inputBuffer: Buffer,
  size: number = 300,
  quality: number = 80
): Promise<Buffer> {
  return sharp(inputBuffer)
    .rotate()
    .resize(size, size, {
      fit: 'cover',
      position: 'centre'
    })
    .webp({ quality })
    .toBuffer();
}

/**
 * Saves optimized image and returns relative URL
 */
export async function saveOptimizedImage(
  inputBuffer: Buffer,
  outputDir: string,
  baseFilename: string
): Promise<{ url: string; thumbnailUrl: string; size: number }> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const cleanName = baseFilename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const webpName = `${cleanName}-${Date.now()}.webp`;
  const thumbName = `${cleanName}-${Date.now()}-thumb.webp`;

  const fullOutputPath = path.join(outputDir, webpName);
  const thumbOutputPath = path.join(outputDir, thumbName);

  const [optimizedFull, optimizedThumb] = await Promise.all([
    optimizeImageBuffer(inputBuffer, { maxWidth: 1600, maxHeight: 1600, quality: 82 }),
    generateThumbnailBuffer(inputBuffer, 300, 80)
  ]);

  await Promise.all([
    fs.promises.writeFile(fullOutputPath, optimizedFull),
    fs.promises.writeFile(thumbOutputPath, optimizedThumb)
  ]);

  return {
    url: `/uploads/${webpName}`,
    thumbnailUrl: `/uploads/${thumbName}`,
    size: optimizedFull.length
  };
}
