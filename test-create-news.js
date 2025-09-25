const fetch = require('node-fetch');
const FormData = require('form-data');

async function createNewsWithImage() {
  const form = new FormData();
  form.append('title', 'Test Article with Image');
  form.append('slug', 'test-article-image-' + Date.now());
  form.append('summary', 'This is a test article with an image URL');
  form.append('content', 'Test content for article with featured image');
  form.append('featured_image', 'http://82.29.169.180:9002/media/uploads/1758306513135-Trendankara2.png');
  form.append('is_featured', 'false');
  form.append('is_breaking', 'false');
  form.append('is_hot', 'true');
  form.append('is_active', 'true');

  const response = await fetch('http://localhost:3001/api/admin/news', {
    method: 'POST',
    headers: {
      'Cookie': 'authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiNmFpNjhBRUlIdmlNc00zUGNDYnE1eEdQV25PM2Jod0tWeEFKTEg5VEV3Z3N5VUt2ZVFYWkFmZm9HWGt4Qkd0bjRxdHNtRDJiUUVIcjIxYnBUdDJ2S2cifQ..OLkBxwTFS2LNG9KemUeeHg.ySIe5_cUWcVi-sTDMjXlP9zmBN9VrfR16vsTDgItMxCGDspXOFol4SuGeub_8fP1aArjjZTNhLh5lg9euZ_kLDJzw4mxGWp4nEsbiEvmzmu-jo03o08JKYh-BkzTEZghrgVRJU5C3QtuSCcRZ40dwD8VHduWYZVChlN-jGfB-w5cJAWKR1U-z0LflTtGeLZO5i-OcGgvWnqljG5Ed3hm_w.IRp1XTy67lfG4nPTiiEsrVh3KzmG0zfQpmJhb8d98ZA'
    },
    body: form
  });

  const result = await response.json();
  console.log('Response:', result);
  if (result.data && result.data.featured_image) {
    console.log('✅ Image URL saved successfully:', result.data.featured_image);
  } else {
    console.log('❌ Image URL not saved');
  }
}

createNewsWithImage().catch(console.error);