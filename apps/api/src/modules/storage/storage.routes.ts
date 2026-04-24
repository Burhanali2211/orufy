import { Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { uploadFile, deleteFile, validateMagicBytes } from '../../lib/storage';
import { logger } from '../../lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Variables } from '../../types/context';

const storage = new Hono<any>();

// All storage routes require tenant resolution and authentication
storage.use('*', resolveTenant);
storage.use('*', requireAuth);

/**
 * POST /api/dashboard/storage/upload
 * Multi-tenant aware file upload
 */
storage.post('/upload', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.parseBody();
  const file = body['file'] as any;

  if (!file) {
    return c.json({ error: 'No file uploaded' }, 400);
  }

  // 1. Size validation (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ error: 'File size exceeds 5MB limit' }, 400);
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Magic-byte validation
    if (!validateMagicBytes(buffer)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, 400);
    }

    const folder = (body['folder'] as string) || 'uploads';
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `${tenant?.id}/${folder}/${uuidv4()}.${ext}`;

    const result = await uploadFile({
      key,
      body: buffer,
      contentType: file.type || 'image/jpeg',
      size: file.size,
    });

    return c.json(result);
  } catch (error) {
    logger.error({ error, tenantId: tenant?.id }, 'File upload failed');
    return c.json({ error: 'Upload failed' }, 500);
  }
});

/**
 * DELETE /api/dashboard/storage/delete
 * Delete file with ownership check (must belong to tenant)
 */
storage.delete('/delete', async (c) => {
  const tenant = c.get('tenant');
  const body = await c.req.json();
  const key = body.key;

  if (!key) {
    return c.json({ error: 'Key is required' }, 400);
  }

  // Ownership check: Key must start with tenantId
  if (!key.startsWith(`${tenant?.id}/`)) {
    logger.warn({ key, tenantId: tenant?.id }, 'Unauthorized delete attempt');
    return c.json({ error: 'Unauthorized: File does not belong to this tenant' }, 403);
  }

  try {
    await deleteFile(key);
    return c.json({ success: true });
  } catch (error) {
    logger.error({ error, key, tenantId: tenant?.id }, 'File deletion failed');
    return c.json({ error: 'Deletion failed' }, 500);
  }
});

export default storage;
