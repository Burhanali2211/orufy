import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { query } from '../db/connection';
import path from 'path';

const router = Router();

// Check if we're in serverless mode (Netlify Functions)
// Netlify Functions set AWS_LAMBDA_FUNCTION_NAME or we can check for read-only filesystem
import { isServerless } from '../utils/serverless';

const isServerlessEnv = isServerless();

/**
 * POST /api/upload/image
 * Upload an image (base64 or file)
 * Accepts base64 data URLs and returns them validated
 */
router.post(
  '/image',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { file, folder = 'uploads' } = req.body;

    if (!file) {
      throw createError('No file provided', 400, 'VALIDATION_ERROR');
    }

    // Validate base64 data URL format
    if (typeof file !== 'string') {
      throw createError('Invalid file format. Expected base64 data URL.', 400, 'VALIDATION_ERROR');
    }

    // Check if it's a valid base64 data URL
    const base64DataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i;
    if (!base64DataUrlPattern.test(file)) {
      throw createError('Invalid image format. Expected base64 data URL with image type.', 400, 'VALIDATION_ERROR');
    }

    // Validate base64 data
    const base64Data = file.split(',')[1];
    if (!base64Data) {
      throw createError('Invalid base64 data', 400, 'VALIDATION_ERROR');
    }

    // Check file size (max 5MB for base64)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (sizeInBytes > maxSize) {
      throw createError('Image size exceeds 5MB limit', 400, 'VALIDATION_ERROR');
    }

    // Extract image type from data URL
    const imageTypeMatch = file.match(/^data:image\/(\w+);base64,/i);
    const imageType = imageTypeMatch ? imageTypeMatch[1] : 'png';
    const extension = imageType === 'jpeg' ? 'jpg' : imageType;
    const mimeType = `image/${imageType}`;

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}.${extension}`;
    const urlPath = `/uploads/${folder}/${filename}`;

    // In serverless mode, store in database instead of filesystem
    if (isServerless) {
      // Store image in database
      const result = await query(
        `INSERT INTO public.uploaded_files 
         (filename, folder, mime_type, file_size, file_data, url_path, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, url_path, created_at`,
        [filename, folder, mimeType, sizeInBytes, base64Data, urlPath, req.userId || null]
      );

      const uploadedFile = result.rows[0];

      res.json({
        success: true,
        data: {
          url: urlPath, // Return the URL path that will be served from database
          path: `${folder}/${filename}`, // Storage path
          size: sizeInBytes,
          id: uploadedFile.id
        }
      });
    } else {
      // Development mode: save to filesystem
      const fs = await import('fs/promises');
      const { fileURLToPath } = await import('url');
      
      let __dirname: string;
      if (typeof import.meta !== 'undefined' && import.meta.url) {
        const __filename = fileURLToPath(import.meta.url);
        __dirname = path.dirname(__filename);
      } else {
        __dirname = process.cwd();
      }

      const uploadsDir = path.join(__dirname, '../../uploads');
      const folderPath = path.join(uploadsDir, folder);
      await fs.mkdir(folderPath, { recursive: true });
      const filePath = path.join(folderPath, filename);

      // Convert base64 to buffer and save to disk
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(filePath, buffer);

      // Also store in database for consistency
      await query(
        `INSERT INTO public.uploaded_files 
         (filename, folder, mime_type, file_size, file_data, url_path, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [filename, folder, mimeType, sizeInBytes, base64Data, urlPath, req.userId || null]
      );

      res.json({
        success: true,
        data: {
          url: urlPath,
          path: `${folder}/${filename}`,
          size: sizeInBytes
        }
      });
    }
  })
);

/**
 * POST /api/upload/images
 * Upload multiple images
 */
router.post(
  '/images',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { files, folder = 'uploads' } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw createError('No files provided', 400, 'VALIDATION_ERROR');
    }

    if (files.length > 10) {
      throw createError('Maximum 10 images allowed per upload', 400, 'VALIDATION_ERROR');
    }

    const base64DataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i;
    const maxSize = 5 * 1024 * 1024; // 5MB

    const timestamp = Date.now();
    const uploadedImages = await Promise.all(
      files.map(async (file: string, index: number) => {
        if (typeof file !== 'string') {
          throw createError(`Invalid file format at index ${index}. Expected base64 data URL.`, 400, 'VALIDATION_ERROR');
        }

        if (!base64DataUrlPattern.test(file)) {
          throw createError(`Invalid image format at index ${index}. Expected base64 data URL with image type.`, 400, 'VALIDATION_ERROR');
        }

        const base64Data = file.split(',')[1];
        if (!base64Data) {
          throw createError(`Invalid base64 data at index ${index}`, 400, 'VALIDATION_ERROR');
        }

        const sizeInBytes = (base64Data.length * 3) / 4;
        if (sizeInBytes > maxSize) {
          throw createError(`Image at index ${index} exceeds 5MB limit`, 400, 'VALIDATION_ERROR');
        }

        // Extract image type
        const imageTypeMatch = file.match(/^data:image\/(\w+);base64,/i);
        const imageType = imageTypeMatch ? imageTypeMatch[1] : 'png';
        const extension = imageType === 'jpeg' ? 'jpg' : imageType;
        const mimeType = `image/${imageType}`;

        // Generate unique filename
        const randomString = Math.random().toString(36).substring(2, 15);
        const filename = `${timestamp}-${index}-${randomString}.${extension}`;
        const urlPath = `/uploads/${folder}/${filename}`;

        // In serverless mode, store in database
        if (isServerless) {
          await query(
            `INSERT INTO public.uploaded_files 
             (filename, folder, mime_type, file_size, file_data, url_path, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [filename, folder, mimeType, sizeInBytes, base64Data, urlPath, req.userId || null]
          );
        } else {
          // Development mode: save to filesystem
          const fs = await import('fs/promises');
          const { fileURLToPath } = await import('url');
          
          let __dirname: string;
          if (typeof import.meta !== 'undefined' && import.meta.url) {
            const __filename = fileURLToPath(import.meta.url);
            __dirname = path.dirname(__filename);
          } else {
            __dirname = process.cwd();
          }

          const uploadsDir = path.join(__dirname, '../../uploads');
          const folderPath = path.join(uploadsDir, folder);
          await fs.mkdir(folderPath, { recursive: true });
          const filePath = path.join(folderPath, filename);

          const buffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(filePath, buffer);

          // Also store in database
          await query(
            `INSERT INTO public.uploaded_files 
             (filename, folder, mime_type, file_size, file_data, url_path, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [filename, folder, mimeType, sizeInBytes, base64Data, urlPath, req.userId || null]
          );
        }

        return {
          url: urlPath,
          path: `${folder}/${filename}`,
          size: sizeInBytes
        };
      })
    );

    res.json({
      success: true,
      data: {
        images: uploadedImages
      }
    });
  })
);

export default router;

