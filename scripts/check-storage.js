#!/usr/bin/env node

/**
 * Check MinIO storage for uploaded files
 */

const { Client } = require('minio');
require('dotenv').config({ path: '.env.local' });

async function checkStorage() {
  try {
    const minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
    });

    const bucketName = process.env.MINIO_BUCKET || 'media';

    console.log('📦 Files in MinIO bucket:', bucketName);
    console.log('=' .repeat(50));

    const stream = minioClient.listObjectsV2(bucketName, 'uploads/', true);
    const files = [];

    stream.on('data', obj => {
      files.push({
        name: obj.name,
        size: obj.size,
        modified: obj.lastModified
      });
    });

    stream.on('end', () => {
      if (files.length === 0) {
        console.log('No files found in uploads/');
      } else {
        files.forEach(file => {
          console.log(`📄 ${file.name}`);
          console.log(`   Size: ${file.size} bytes`);
          console.log(`   Modified: ${file.modified}`);
          console.log('');
        });
        console.log(`Total files: ${files.length}`);
      }
    });

    stream.on('error', err => {
      console.error('Error listing objects:', err);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStorage();