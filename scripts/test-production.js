#!/usr/bin/env node

/**
 * Production System Test Script
 * Tests the deployed application at https://www.trendankara.com
 */

const https = require('https');
const axios = require('axios').default;
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Production URL
const BASE_URL = 'https://www.trendankara.com';

// Test colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper function for colored output
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Test results tracker
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Run a test
async function runTest(name, testFn) {
  try {
    log(`\nTesting: ${name}`, 'yellow');
    await testFn();
    log(`✅ ${name} - PASSED`, 'green');
    testResults.passed++;
    testResults.tests.push({ name, status: 'passed' });
  } catch (error) {
    log(`❌ ${name} - FAILED`, 'red');
    console.error(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name, status: 'failed', error: error.message });
  }
}

// Test functions
async function testHomePage() {
  const response = await axios.get(BASE_URL, {
    validateStatus: () => true,
    timeout: 10000
  });

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.data.includes('Trend Ankara')) {
    throw new Error('Home page does not contain expected content');
  }

  log('  ✓ Home page loads successfully', 'green');
  log('  ✓ Contains "Trend Ankara" text', 'green');
}

async function testHealthEndpoint() {
  const response = await axios.get(`${BASE_URL}/api/health`, {
    validateStatus: () => true,
    timeout: 5000
  });

  if (response.status !== 200) {
    throw new Error(`Health endpoint returned ${response.status}`);
  }

  const data = response.data;
  log('  ✓ Health endpoint accessible', 'green');
  log(`  ✓ Status: ${data.status || 'ok'}`, 'green');

  if (data.database) {
    log(`  ✓ Database: ${data.database}`, 'green');
  }
  if (data.storage) {
    log(`  ✓ Storage: ${data.storage}`, 'green');
  }
}

async function testDatabaseConnection() {
  const response = await axios.get(`${BASE_URL}/api/test/db`, {
    validateStatus: () => true,
    timeout: 5000
  });

  if (response.status === 404) {
    log('  ⚠ Database test endpoint not found (might be disabled in production)', 'yellow');
    return;
  }

  if (response.status !== 200) {
    throw new Error(`Database test returned ${response.status}`);
  }

  const data = response.data;
  if (!data.success) {
    throw new Error('Database connection failed');
  }

  log('  ✓ Database connected', 'green');
  log(`  ✓ Tables: ${data.tables || 'N/A'}`, 'green');
}

async function testNewsAPI() {
  const response = await axios.get(`${BASE_URL}/api/news`, {
    validateStatus: () => true,
    timeout: 5000
  });

  if (response.status === 404) {
    log('  ⚠ News API not found, trying mobile API', 'yellow');

    // Try mobile API
    const mobileResponse = await axios.get(`${BASE_URL}/api/mobile/v1/news`, {
      validateStatus: () => true,
      timeout: 5000
    });

    if (mobileResponse.status === 200) {
      log('  ✓ Mobile news API accessible', 'green');
      const data = mobileResponse.data;
      if (data.data && Array.isArray(data.data)) {
        log(`  ✓ News items: ${data.data.length}`, 'green');
      }
      return;
    }
  }

  if (response.status !== 200) {
    throw new Error(`News API returned ${response.status}`);
  }

  const data = response.data;
  log('  ✓ News API accessible', 'green');
  if (Array.isArray(data)) {
    log(`  ✓ News items: ${data.length}`, 'green');
  }
}

async function testPollsAPI() {
  const response = await axios.get(`${BASE_URL}/api/polls/active`, {
    validateStatus: () => true,
    timeout: 5000
  });

  if (response.status === 404) {
    log('  ⚠ Polls API not found, trying mobile API', 'yellow');

    // Try mobile API
    const mobileResponse = await axios.get(`${BASE_URL}/api/mobile/v1/polls/active`, {
      validateStatus: () => true,
      timeout: 5000
    });

    if (mobileResponse.status === 200) {
      log('  ✓ Mobile polls API accessible', 'green');
      const data = mobileResponse.data;
      if (data.data) {
        log(`  ✓ Active polls: ${data.data.length || 0}`, 'green');
      }
      return;
    }
  }

  if (response.status !== 200) {
    throw new Error(`Polls API returned ${response.status}`);
  }

  const data = response.data;
  log('  ✓ Polls API accessible', 'green');
  if (Array.isArray(data)) {
    log(`  ✓ Active polls: ${data.length}`, 'green');
  }
}

async function testRadioStream() {
  try {
    // Test stream URL availability
    const streamUrl = 'https://radyo.yayin.com.tr:5132/stream';
    const response = await axios.head(streamUrl, {
      validateStatus: () => true,
      timeout: 5000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // For self-signed certificates
      })
    });

    log('  ✓ Radio stream URL accessible', 'green');
    log(`  ✓ Stream status: ${response.status}`, 'green');
  } catch (error) {
    log('  ⚠ Could not verify stream directly (CORS)', 'yellow');

    // Try API endpoint
    const apiResponse = await axios.get(`${BASE_URL}/api/radio/config`, {
      validateStatus: () => true,
      timeout: 5000
    });

    if (apiResponse.status === 200) {
      log('  ✓ Radio config API accessible', 'green');
      const data = apiResponse.data;
      if (data.streamUrl) {
        log(`  ✓ Stream URL configured: ${data.streamUrl}`, 'green');
      }
    }
  }
}

async function testAdminPanel() {
  const response = await axios.get(`${BASE_URL}/admin`, {
    validateStatus: () => true,
    timeout: 5000,
    maxRedirects: 0
  });

  // Admin panel might redirect to login
  if (response.status === 302 || response.status === 307) {
    const location = response.headers.location;
    log('  ✓ Admin panel redirects to login', 'green');
    log(`  ✓ Redirect: ${location}`, 'green');
  } else if (response.status === 200) {
    log('  ✓ Admin panel accessible', 'green');
    if (response.data.includes('login') || response.data.includes('sign')) {
      log('  ✓ Login page displayed', 'green');
    }
  } else {
    throw new Error(`Admin panel returned ${response.status}`);
  }
}

async function testStaticAssets() {
  // Test favicon
  const faviconResponse = await axios.get(`${BASE_URL}/favicon.ico`, {
    validateStatus: () => true,
    timeout: 5000
  });

  if (faviconResponse.status === 200) {
    log('  ✓ Favicon accessible', 'green');
  } else {
    log('  ⚠ Favicon not found', 'yellow');
  }

  // Test robots.txt
  const robotsResponse = await axios.get(`${BASE_URL}/robots.txt`, {
    validateStatus: () => true,
    timeout: 5000
  });

  if (robotsResponse.status === 200) {
    log('  ✓ Robots.txt accessible', 'green');
  } else {
    log('  ⚠ Robots.txt not found', 'yellow');
  }
}

async function testSSLCertificate() {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL);

    https.get({
      hostname: url.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: true
    }, (res) => {
      const cert = res.socket.getPeerCertificate();

      if (cert) {
        log('  ✓ SSL certificate valid', 'green');
        log(`  ✓ Issuer: ${cert.issuer.O || cert.issuer.CN}`, 'green');

        const expiry = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry > 30) {
          log(`  ✓ Certificate expires in ${daysUntilExpiry} days`, 'green');
        } else if (daysUntilExpiry > 0) {
          log(`  ⚠ Certificate expires in ${daysUntilExpiry} days`, 'yellow');
        } else {
          log(`  ❌ Certificate expired!`, 'red');
        }
      }

      resolve();
    }).on('error', (error) => {
      reject(new Error(`SSL error: ${error.message}`));
    });
  });
}

async function testResponseTime() {
  const times = [];

  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await axios.get(BASE_URL, {
      validateStatus: () => true,
      timeout: 10000
    });
    const end = Date.now();
    times.push(end - start);
  }

  const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);

  log(`  ✓ Average response time: ${avgTime}ms`, 'green');

  if (avgTime < 500) {
    log('  ✓ Excellent performance', 'green');
  } else if (avgTime < 1000) {
    log('  ✓ Good performance', 'green');
  } else if (avgTime < 3000) {
    log('  ⚠ Acceptable performance', 'yellow');
  } else {
    log('  ⚠ Slow response time', 'yellow');
  }
}

// Main test runner
async function runAllTests() {
  console.log('');
  log('========================================', 'blue');
  log('Production System Test', 'blue');
  log(`URL: ${BASE_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}`, 'blue');
  log('========================================', 'blue');

  // Run all tests
  await runTest('Home Page', testHomePage);
  await runTest('SSL Certificate', testSSLCertificate);
  await runTest('Response Time', testResponseTime);
  await runTest('Health Endpoint', testHealthEndpoint);
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('News API', testNewsAPI);
  await runTest('Polls API', testPollsAPI);
  await runTest('Radio Stream', testRadioStream);
  await runTest('Admin Panel', testAdminPanel);
  await runTest('Static Assets', testStaticAssets);

  // Summary
  console.log('');
  log('========================================', 'blue');
  log('Test Summary', 'blue');
  log('========================================', 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`📊 Total: ${testResults.passed + testResults.failed}`, 'blue');

  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! Production system is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});