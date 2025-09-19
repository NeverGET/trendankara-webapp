import { Client } from 'minio';

/**
 * MinIO client configuration
 */
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'media';

/**
 * Ensure bucket exists
 */
async function ensureBucket(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`Bucket ${BUCKET_NAME} created`);
    }
  } catch (error) {
    console.error('Error ensuring bucket:', error);
  }
}

/**
 * Upload file to MinIO
 */
export async function uploadToMinio(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<{ url: string; key: string }> {
  await ensureBucket();

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `uploads/${timestamp}-${sanitizedFilename}`;

  // Upload to MinIO
  await minioClient.putObject(
    BUCKET_NAME,
    key,
    buffer,
    buffer.length,
    {
      'Content-Type': mimetype
    }
  );

  // Generate URL
  const url = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${key}`;

  return { url, key };
}

/**
 * Delete file from MinIO
 */
export async function deleteFromMinio(key: string): Promise<void> {
  try {
    await minioClient.removeObject(BUCKET_NAME, key);
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    throw error;
  }
}

/**
 * Get file from MinIO
 */
export async function getFromMinio(key: string): Promise<Buffer> {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, key);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('Error getting from MinIO:', error);
    throw error;
  }
}

/**
 * Get signed URL for temporary access
 */
export async function getSignedUrl(key: string, expiry: number = 3600): Promise<string> {
  try {
    return await minioClient.presignedGetObject(BUCKET_NAME, key, expiry);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
}