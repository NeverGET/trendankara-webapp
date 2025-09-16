#!/usr/bin/env node

/**
 * Test Upload Script
 * Tests the complete media upload functionality
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function createTestImage() {
  // Create a simple test image using Canvas (if available) or use a pre-made base64 image
  const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhFBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9k=';

  const imageBuffer = Buffer.from(base64Image, 'base64');
  const imagePath = path.join(__dirname, 'test-image.jpg');
  fs.writeFileSync(imagePath, imageBuffer);

  console.log('✅ Test image created:', imagePath);
  return imagePath;
}

async function testUpload() {
  try {
    // Check if axios is installed
    try {
      require('axios');
    } catch {
      console.log('Installing axios...');
      require('child_process').execSync('npm install axios form-data', { stdio: 'inherit' });
    }

    const axios = require('axios');
    const FormData = require('form-data');

    // Create test image
    const imagePath = await createTestImage();

    // Test 1: Get upload configuration
    console.log('\n🔄 Testing GET /api/media/upload...');
    const configResponse = await axios.get('http://localhost:3000/api/media/upload');
    console.log('✅ Upload configuration:', configResponse.data);

    // Test 2: Upload image
    console.log('\n🔄 Testing POST /api/media/upload...');
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));  // Changed from 'image' to 'file'

    const uploadResponse = await axios.post('http://localhost:3000/api/media/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });

    console.log('✅ Upload successful!');
    console.log('   Upload result:', JSON.stringify(uploadResponse.data, null, 2));

    // Clean up test image
    fs.unlinkSync(imagePath);
    console.log('🧹 Test image cleaned up');

    return true;

  } catch (error) {
    if (error.response) {
      console.error('❌ Upload test failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Upload test failed:', error.message);
    }
    return false;
  }
}

// Run test
console.log('🚀 Starting upload test...\n');
testUpload().then(success => {
  if (success) {
    console.log('\n✨ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed');
  }
  process.exit(success ? 0 : 1);
});