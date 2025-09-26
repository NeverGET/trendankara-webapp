import { NextRequest, NextResponse } from 'next/server';
import { getMinioClient } from '@/lib/storage/client';

/**
 * API route to proxy MinIO media files
 * This allows serving MinIO content through the app using internal Docker network
 * instead of exposing MinIO directly to the internet
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const path = params.path.join('/');
    const bucket = process.env.MINIO_BUCKET || 'media';

    // Get MinIO client (will use internal Docker network)
    const client = getMinioClient();

    // Stream the object from MinIO
    const stream = await client.getObject(bucket, path);

    // Collect the stream into a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Determine content type based on file extension
    const ext = path.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'mp4': 'video/mp4',
      'mp3': 'audio/mpeg',
    };
    const contentType = contentTypes[ext || ''] || 'application/octet-stream';

    // Return the file with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'X-Content-Source': 'minio-proxy',
      },
    });
  } catch (error: any) {
    console.error('Error proxying media:', error);

    // Return 404 for not found
    if (error.code === 'NoSuchKey' || error.code === 'NotFound') {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Return 500 for other errors
    return NextResponse.json(
      { error: 'Failed to load media' },
      { status: 500 }
    );
  }
}