#!/usr/bin/env node

/**
 * Create a real test image using Sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createTestImage() {
  try {
    const imagePath = path.join(__dirname, 'test-image.jpg');

    // Create a simple red square image
    await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg({ quality: 90 })
    .toFile(imagePath);

    console.log('✅ Test image created:', imagePath);

    // Now test the upload
    const axios = require('axios');
    const FormData = require('form-data');

    console.log('\n🔄 Testing upload...');
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const uploadResponse = await axios.post('http://localhost:3000/api/media/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });

    console.log('✅ Upload successful!');
    console.log('\nFull Response:', JSON.stringify(uploadResponse.data, null, 2));

    // Clean up
    fs.unlinkSync(imagePath);
    console.log('\n🧹 Test image cleaned up');

    return true;
  } catch (error) {
    if (error.response) {
      console.error('❌ Upload failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
    return false;
  }
}

createTestImage().then(success => {
  process.exit(success ? 0 : 1);
});