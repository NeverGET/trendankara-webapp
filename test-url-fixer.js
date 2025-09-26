#!/usr/bin/env node

/**
 * Test script for URL fixer utility
 */

const { fixMediaUrl, fixMediaUrlsInObject, fixMediaUrlsInHtml } = require('./.next/server/chunks/7514.js');

// Test data with MinIO URLs
const testData = {
  featured_image: 'http://82.29.169.180:9002/media/uploads/test-image.jpg',
  thumbnail: 'http://82.29.169.180:9002/media/uploads/thumb.png',
  content: 'Check out this image: http://82.29.169.180:9002/media/files/doc.pdf',
  nested: {
    logo: 'http://82.29.169.180:9002/media/logos/brand.svg',
    backgroundImage: 'http://82.29.169.180:9002/media/bg/pattern.jpg'
  },
  normalUrl: 'https://example.com/image.jpg',
  alreadyFixed: '/api/media/already-fixed.jpg'
};

const testHtml = `
  <div>
    <img src="http://82.29.169.180:9002/media/uploads/photo1.jpg" alt="Photo 1">
    <a href="http://82.29.169.180:9002/media/docs/file.pdf">Download</a>
    <div style="background-image: url('http://82.29.169.180:9002/media/bg/hero.jpg')"></div>
    <img src="https://example.com/external.jpg" alt="External">
  </div>
`;

console.log('Testing URL Fixer Utility\n');
console.log('=========================\n');

// Test single URL fixing
console.log('1. Testing single URL fixing:');
console.log('   Input:', testData.featured_image);
console.log('   Output:', fixMediaUrl(testData.featured_image));
console.log('');

// Test object fixing
console.log('2. Testing object URL fixing:');
console.log('   Input:', JSON.stringify(testData, null, 2));
const fixedObject = fixMediaUrlsInObject(testData);
console.log('   Output:', JSON.stringify(fixedObject, null, 2));
console.log('');

// Test HTML fixing
console.log('3. Testing HTML URL fixing:');
console.log('   Input HTML:', testHtml);
const fixedHtml = fixMediaUrlsInHtml(testHtml);
console.log('   Output HTML:', fixedHtml);
console.log('');

// Verify results
console.log('Verification:');
console.log('=============');
const allFixed =
  fixedObject.featured_image === '/api/media/uploads/test-image.jpg' &&
  fixedObject.thumbnail === '/api/media/uploads/thumb.png' &&
  fixedObject.nested.logo === '/api/media/logos/brand.svg' &&
  fixedObject.normalUrl === 'https://example.com/image.jpg' &&
  fixedObject.alreadyFixed === '/api/media/already-fixed.jpg' &&
  fixedHtml.includes('src="/api/media/uploads/photo1.jpg"') &&
  fixedHtml.includes('href="/api/media/docs/file.pdf"') &&
  !fixedHtml.includes('http://82.29.169.180:9002');

if (allFixed) {
  console.log('✅ All tests passed! URL fixer is working correctly.');
} else {
  console.log('❌ Some tests failed. Please check the output above.');
  process.exit(1);
}