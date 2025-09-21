import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/client';
import { uploadToMinio } from '@/lib/minio/client';
import { ResultSetHeader } from 'mysql2';

/**
 * POST /api/admin/media/upload
 * Upload media files
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedMedia = [];

    // Process each file
    for (const file of files) {
      try {
        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to MinIO
        const uploadResult = await uploadToMinio(
          buffer,
          file.name,
          file.type
        );

        // Save to database
        const result = await db.execute(
          `INSERT INTO media (filename, original_name, mime_type, size, url, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            uploadResult.key || file.name,
            file.name,
            file.type,
            file.size,
            uploadResult.url,
            session.user.id || 1
          ]
        ) as unknown as [ResultSetHeader, any];

        uploadedMedia.push({
          id: result[0].insertId,
          filename: uploadResult.key || file.name,
          original_name: file.name,
          mime_type: file.type,
          size: file.size,
          url: uploadResult.url,
          created_by: session.user.id || 1,
          created_at: new Date(),
          updated_at: new Date()
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    if (uploadedMedia.length === 0) {
      return NextResponse.json(
        { error: 'Failed to upload any files' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      media: uploadedMedia,
      message: `Successfully uploaded ${uploadedMedia.length} file(s)`
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
}