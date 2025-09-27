import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'],              // Error rate must be below 10%
  },
};

const BASE_URL = 'https://trendankara.com';

export default function () {
  // Test scenario: Typical user journey
  const responses = {};

  // 1. Homepage
  responses.homepage = http.get(`${BASE_URL}/`);
  check(responses.homepage, {
    'Homepage status 200': (r) => r.status === 200,
    'Homepage load time < 2s': (r) => r.timings.duration < 2000,
  });
  errorRate.add(responses.homepage.status !== 200);
  successRate.add(responses.homepage.status === 200);
  sleep(1);

  // 2. Get news
  responses.news = http.get(`${BASE_URL}/api/news?page=1&limit=12`);
  check(responses.news, {
    'News API status 200': (r) => r.status === 200,
    'News API response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(responses.news.status !== 200);
  sleep(0.5);

  // 3. Get active polls
  responses.polls = http.get(`${BASE_URL}/api/polls/active`);
  check(responses.polls, {
    'Polls API status 200': (r) => r.status === 200,
    'Polls API response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(responses.polls.status !== 200);
  sleep(0.5);

  // 4. Get radio config
  responses.radio = http.get(`${BASE_URL}/api/radio`);
  check(responses.radio, {
    'Radio API status 200': (r) => r.status === 200,
    'Radio API response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(responses.radio.status !== 200);
  sleep(2);

  // 5. Navigate to polls page
  responses.pollsPage = http.get(`${BASE_URL}/polls`);
  check(responses.pollsPage, {
    'Polls page status 200': (r) => r.status === 200,
    'Polls page load time < 2s': (r) => r.timings.duration < 2000,
  });
  errorRate.add(responses.pollsPage.status !== 200);
  sleep(1);

  // 6. Navigate to news page
  responses.newsPage = http.get(`${BASE_URL}/news`);
  check(responses.newsPage, {
    'News page status 200': (r) => r.status === 200,
    'News page load time < 2s': (r) => r.timings.duration < 2000,
  });
  errorRate.add(responses.newsPage.status !== 200);
  sleep(2);
}