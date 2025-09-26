#!/usr/bin/env node

/**
 * Test script to verify Date objects are preserved correctly
 */

// Simple version of fixMediaUrlsInObject for testing
function fixMediaUrlsInObject(obj) {
  if (!obj) return obj;

  // Handle strings
  if (typeof obj === 'string') {
    if (obj.includes('82.29.169.180:9002/media/')) {
      const parts = obj.split('/media/');
      const key = parts[parts.length - 1];
      return `/api/media/${key}`;
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => fixMediaUrlsInObject(item));
  }

  // Handle Date objects - return as is
  if (obj instanceof Date) {
    return obj;
  }

  // Handle objects
  if (typeof obj === 'object' && obj !== null) {
    const fixed = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Fix common image-related property names
        if (
          key === 'url' ||
          key === 'src' ||
          key === 'image' ||
          key === 'backgroundImage' ||
          key === 'thumbnail' ||
          key === 'featured_image' ||
          key === 'imageUrl' ||
          key === 'image_url' ||
          key === 'logo'
        ) {
          fixed[key] = typeof obj[key] === 'string' && obj[key].includes('82.29.169.180:9002/media/')
            ? obj[key].replace('http://82.29.169.180:9002/media/', '/api/media/')
            : obj[key];
        } else {
          fixed[key] = fixMediaUrlsInObject(obj[key]);
        }
      }
    }
    return fixed;
  }

  return obj;
}

// Test data
const testPoll = {
  id: 1,
  title: 'Test Poll',
  start_date: new Date('2025-01-01'),
  end_date: new Date('2025-12-31'),
  items: [
    {
      id: 1,
      title: 'Option 1',
      image_url: 'http://82.29.169.180:9002/media/uploads/test.png'
    }
  ]
};

console.log('Testing Date preservation in URL fixer\n');
console.log('======================================\n');

console.log('Original poll object:');
console.log(JSON.stringify(testPoll, null, 2));
console.log('\nOriginal start_date type:', typeof testPoll.start_date);
console.log('Original start_date instanceof Date:', testPoll.start_date instanceof Date);

const fixedPoll = fixMediaUrlsInObject(testPoll);

console.log('\n\nFixed poll object:');
console.log(JSON.stringify(fixedPoll, null, 2));
console.log('\nFixed start_date type:', typeof fixedPoll.start_date);
console.log('Fixed start_date instanceof Date:', fixedPoll.start_date instanceof Date);

// Verify results
console.log('\n\nVerification:');
console.log('=============');

const datesPreserved =
  fixedPoll.start_date instanceof Date &&
  fixedPoll.end_date instanceof Date;

const urlsFixed =
  fixedPoll.items[0].image_url === '/api/media/uploads/test.png';

if (datesPreserved && urlsFixed) {
  console.log('✅ Test passed! Dates are preserved and URLs are fixed.');
} else {
  if (!datesPreserved) {
    console.log('❌ Date preservation failed!');
  }
  if (!urlsFixed) {
    console.log('❌ URL fixing failed!');
  }
  process.exit(1);
}