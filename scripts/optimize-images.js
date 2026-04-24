/**
 * Image Optimization Script
 * 
 * This script compresses large images in src/assets/images to reduce bundle size
 * Uses sharp library for high-quality image compression
 * 
 * Usage: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '../src/assets/images');
const MAX_WIDTH = 1920; // Max width for images
const MAX_HEIGHT = 1080; // Max height for images
const QUALITY = 85; // JPEG quality (1-100)
const TARGET_SIZE_KB = 200; // Target max size in KB

// Image extensions to process
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

/**
 * Get all image files recursively
 */
function getImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getImageFiles(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Format bytes to KB
 */
function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2);
}

/**
 * Optimize a single image
 */
async function optimizeImage(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const originalSizeKB = stats.size / 1024;

    // Skip if already small enough
    if (originalSizeKB < TARGET_SIZE_KB) {
      console.log(`✓ Skipping ${path.basename(filePath)} (${formatBytes(stats.size)} KB - already optimized)`);
      return { skipped: true, originalSize: stats.size, newSize: stats.size };
    }

    console.log(`\n📸 Processing: ${path.basename(filePath)}`);
    console.log(`   Original size: ${formatBytes(stats.size)} KB`);

    // Create backup
    const backupPath = filePath + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(filePath, backupPath);
    }

    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);

    // Calculate new dimensions while maintaining aspect ratio
    let newWidth = metadata.width;
    let newHeight = metadata.height;

    if (newWidth > MAX_WIDTH || newHeight > MAX_HEIGHT) {
      const widthRatio = MAX_WIDTH / newWidth;
      const heightRatio = MAX_HEIGHT / newHeight;
      const ratio = Math.min(widthRatio, heightRatio);

      newWidth = Math.round(newWidth * ratio);
      newHeight = Math.round(newHeight * ratio);
    }

    // Optimize image
    await sharp(filePath)
      .resize(newWidth, newHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: QUALITY, progressive: true })
      .toFile(filePath + '.tmp');

    // Replace original with optimized
    fs.unlinkSync(filePath);
    fs.renameSync(filePath + '.tmp', filePath);

    const newStats = fs.statSync(filePath);
    const newSizeKB = newStats.size / 1024;
    const savings = ((stats.size - newStats.size) / stats.size * 100).toFixed(1);

    console.log(`   ✅ New size: ${formatBytes(newStats.size)} KB`);
    console.log(`   💾 Saved: ${formatBytes(stats.size - newStats.size)} KB (${savings}%)`);
    console.log(`   📐 New dimensions: ${newWidth}x${newHeight}`);

    return {
      skipped: false,
      originalSize: stats.size,
      newSize: newStats.size,
      savings: stats.size - newStats.size
    };
  } catch (error) {
    console.error(`   ❌ Error optimizing ${path.basename(filePath)}:`, error.message);
    return { skipped: true, error: true };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('================================\n');
  console.log(`Target directory: ${IMAGES_DIR}`);
  console.log(`Max dimensions: ${MAX_WIDTH}x${MAX_HEIGHT}`);
  console.log(`JPEG quality: ${QUALITY}`);
  console.log(`Target size: ${TARGET_SIZE_KB} KB\n`);

  const imageFiles = getImageFiles(IMAGES_DIR);
  console.log(`Found ${imageFiles.length} images to process\n`);

  let totalOriginalSize = 0;
  let totalNewSize = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const filePath of imageFiles) {
    const result = await optimizeImage(filePath);
    
    if (!result.error) {
      totalOriginalSize += result.originalSize;
      totalNewSize += result.newSize;
      
      if (result.skipped) {
        skippedCount++;
      } else {
        processedCount++;
      }
    }
  }

  console.log('\n================================');
  console.log('📊 Optimization Summary');
  console.log('================================');
  console.log(`Total images: ${imageFiles.length}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Original total size: ${formatBytes(totalOriginalSize)} KB`);
  console.log(`New total size: ${formatBytes(totalNewSize)} KB`);
  console.log(`Total savings: ${formatBytes(totalOriginalSize - totalNewSize)} KB`);
  console.log(`Percentage saved: ${((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1)}%`);
  console.log('\n✅ Optimization complete!');
  console.log('\n💡 Tip: Backup files (.backup) have been created. Delete them after verifying the optimized images.');
}

main().catch(console.error);

