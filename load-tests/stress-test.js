import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Stress test - find breaking point
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '1m', target: 150 },  // Ramp up to 150 users
    { duration: '2m', target: 150 },  // Stay at 150 users
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '2m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.3'],     // Error rate below 30%
  },
};

const BASE_URL = 'https://trendankara.com';

export default function () {
  const responses = {};

  // Simplified user journey for stress testing

  // 1. Homepage (heaviest page)
  responses.homepage = http.get(`${BASE_URL}/`, {
    timeout: '10s',
  });
  check(responses.homepage, {
    'Homepage available': (r) => r.status === 200,
  });
  errorRate.add(responses.homepage.status !== 200);

  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);

  // 2. API calls (simulate real user behavior)
  const endpoints = [
    '/api/news?page=1&limit=12',
    '/api/polls/active',
    '/api/radio',
  ];

  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  responses.api = http.get(`${BASE_URL}${randomEndpoint}`, {
    timeout: '5s',
  });
  check(responses.api, {
    'API available': (r) => r.status === 200,
  });
  errorRate.add(responses.api.status !== 200);

  sleep(Math.random() * 2 + 0.5);
}