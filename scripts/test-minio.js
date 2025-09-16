#!/usr/bin/env node

/**
 * MinIO Test Script
 * Tests MinIO connection and bucket creation
 */

const { Client } = require('minio');

async function testMinIO() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });

    console.log('🔄 Connecting to MinIO...');
    console.log(`   Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);

    // Create MinIO client
    const minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
    });

    const bucketName = process.env.MINIO_BUCKET || 'media';

    // Check if bucket exists
    console.log(`🔄 Checking if bucket '${bucketName}' exists...`);
    const exists = await minioClient.bucketExists(bucketName);

    if (!exists) {
      console.log(`📦 Bucket '${bucketName}' does not exist. Creating...`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket '${bucketName}' created successfully`);
    } else {
      console.log(`✅ Bucket '${bucketName}' already exists`);
    }

    // List all buckets
    console.log('\n📊 Available buckets:');
    const buckets = await minioClient.listBuckets();
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (created: ${bucket.creationDate})`);
    });

    // Test upload
    console.log('\n🔄 Testing file upload...');
    const testContent = Buffer.from('Hello MinIO! This is a test file.');
    const testFileName = 'test-file.txt';

    await minioClient.putObject(bucketName, testFileName, testContent, testContent.length, {
      'Content-Type': 'text/plain'
    });
    console.log(`✅ Test file '${testFileName}' uploaded successfully`);

    // Test file exists
    console.log('🔄 Checking if test file exists...');
    const stat = await minioClient.statObject(bucketName, testFileName);
    console.log(`✅ Test file found (size: ${stat.size} bytes)`);

    // Generate presigned URL
    console.log('🔄 Generating presigned URL...');
    const url = await minioClient.presignedGetObject(bucketName, testFileName, 7 * 24 * 60 * 60);
    console.log(`✅ Presigned URL: ${url.split('?')[0]}...`);

    // Clean up test file
    console.log('🔄 Cleaning up test file...');
    await minioClient.removeObject(bucketName, testFileName);
    console.log('✅ Test file removed');

    console.log('\n✨ MinIO is working correctly!');
    console.log('\nAccess MinIO Console:');
    console.log('   URL: http://localhost:9001');
    console.log('   Username: minioadmin');
    console.log('   Password: minioadmin123');

    return true;

  } catch (error) {
    console.error('❌ MinIO test failed:', error.message);
    console.error('   Make sure MinIO is running: docker ps | grep minio');
    return false;
  }
}

// Run test
testMinIO().then(success => {
  process.exit(success ? 0 : 1);
});