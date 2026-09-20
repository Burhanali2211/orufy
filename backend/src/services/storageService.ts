import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { db } from '../db/db';
import { site_settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { saveOptimizedImage } from './imageOptimizer';

export interface R2Config {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string;
  enabled?: boolean;
}

/**
 * Fetch storage configuration for a tenant store from site_settings table
 */
export async function getStoreStorageConfig(storeId: string): Promise<R2Config & { provider: string }> {
  try {
    const settings = await db
      .select()
      .from(site_settings)
      .where(eq(site_settings.store_id, storeId));

    const map: Record<string, string> = {};
    for (const item of settings) {
      if (item.setting_key && item.setting_value) {
        map[item.setting_key] = item.setting_value;
      }
    }

    const provider = map['storage_provider'] || process.env.STORAGE_PROVIDER || 'local';
    const accountId = map['r2_account_id'] || process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
    const bucketName = map['r2_bucket_name'] || process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    const accessKeyId = map['r2_access_key_id'] || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
    const secretAccessKey = map['r2_secret_access_key'] || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
    const publicUrl = map['r2_public_url'] || process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

    return {
      provider,
      accountId,
      bucketName,
      accessKeyId,
      secretAccessKey,
      publicUrl,
      enabled: provider === 'cloudflare_r2' && Boolean(accountId && bucketName && accessKeyId && secretAccessKey)
    };
  } catch (err) {
    console.error('Error reading store storage config:', err);
    return {
      provider: 'local',
      accountId: '',
      bucketName: '',
      accessKeyId: '',
      secretAccessKey: '',
      publicUrl: '',
      enabled: false
    };
  }
}

/**
 * Create S3 Client configured for Cloudflare R2
 */
export function createR2Client(config: { accountId: string; accessKeyId: string; secretAccessKey: string }): S3Client {
  const cleanAccountId = config.accountId.trim();
  const endpoint = `https://${cleanAccountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId.trim(),
      secretAccessKey: config.secretAccessKey.trim(),
    },
  });
}

/**
 * Test Cloudflare R2 connection by listing objects in the specified bucket
 */
export async function testR2Connection(config: R2Config): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!config.accountId || !config.bucketName || !config.accessKeyId || !config.secretAccessKey) {
    return {
      success: false,
      error: 'Missing required parameters: Account ID, Bucket Name, Access Key ID, and Secret Access Key are required.'
    };
  }

  try {
    const s3 = createR2Client(config);
    const command = new ListObjectsV2Command({
      Bucket: config.bucketName.trim(),
      MaxKeys: 1,
    });

    await s3.send(command);

    return {
      success: true,
      message: `Successfully connected to Cloudflare R2 bucket "${config.bucketName.trim()}"!`
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('R2 Connection test failed:', err);
    return {
      success: false,
      error: err?.message || 'Failed to authenticate with Cloudflare R2 bucket. Please check credentials.'
    };
  }
}

/**
 * Upload a file buffer to storage (Cloudflare R2 if configured, or local fallback)
 */
export async function uploadFileToStorage(params: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  storeId: string;
  folder?: string;
}): Promise<{ url: string; thumbnailUrl?: string; provider: string; size: number }> {
  const { buffer, mimeType, originalName, storeId, folder = 'branding' } = params;
  
  const config = await getStoreStorageConfig(storeId);

  if (config.provider === 'cloudflare_r2' && config.enabled) {
    try {
      const s3 = createR2Client(config);
      const cleanName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      const ext = originalName.split('.').pop() || 'png';
      const objectKey = `stores/${storeId}/${folder}/${cleanName}-${Date.now()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: config.bucketName.trim(),
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
      });

      await s3.send(command);

      const baseUrl = config.publicUrl.trim().replace(/\/$/, '');
      const publicFileUrl = `${baseUrl}/${objectKey}`;

      return {
        url: publicFileUrl,
        thumbnailUrl: publicFileUrl,
        provider: 'cloudflare_r2',
        size: buffer.length
      };
    } catch (err) {
      console.error('Cloudflare R2 upload failed, falling back to local storage:', err);
    }
  }

  // Fallback to local storage
  const outputDir = 'uploads';
  const localResult = await saveOptimizedImage(buffer, outputDir, originalName);
  
  return {
    url: localResult.url,
    thumbnailUrl: localResult.thumbnailUrl,
    provider: 'local',
    size: localResult.size
  };
}
