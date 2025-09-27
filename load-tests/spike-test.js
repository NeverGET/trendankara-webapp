import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Spike test - sudden traffic surge
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Baseline load
    { duration: '10s', target: 200 },  // Sudden spike to 200 users
    { duration: '1m', target: 200 },   // Stay at spike level
    { duration: '10s', target: 10 },   // Quick drop back
    { duration: '30s', target: 10 },   // Recovery period
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s during spike
    http_req_failed: ['rate<0.4'],     // Error rate below 40% during spike
  },
};

const BASE_URL = 'https://trendankara.com';

export default function () {
  // Simulate urgent traffic (e.g., breaking news event)

  // Most users hitting the homepage
  const homepage = http.get(`${BASE_URL}/`, {
    timeout: '15s',
  });

  check(homepage, {
    'Page loads during spike': (r) => r.status === 200,
    'Response time acceptable': (r) => r.timings.duration < 5000,
  });

  errorRate.add(homepage.status !== 200);

  // Quick API call
  if (Math.random() > 0.3) { // 70% of users check news
    const news = http.get(`${BASE_URL}/api/news?page=1&limit=6`, {
      timeout: '10s',
    });
    check(news, {
      'News API responds': (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 1 + 0.5);
}