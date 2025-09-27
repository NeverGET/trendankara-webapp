import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Endurance test - sustained load over time
export const options = {
  stages: [
    { duration: '2m', target: 30 },   // Ramp up to 30 users
    { duration: '15m', target: 30 },  // Stay at 30 users for 15 minutes
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.05'],    // Error rate below 5%
    errors: ['rate<0.05'],              // Custom error rate below 5%
  },
};

const BASE_URL = 'https://trendankara.com';

export default function () {
  // Simulate realistic user behavior over extended period

  const userJourney = Math.random();

  if (userJourney < 0.4) {
    // 40% - Quick visitor (just homepage)
    const homepage = http.get(`${BASE_URL}/`);
    check(homepage, { 'Homepage loads': (r) => r.status === 200 });
    errorRate.add(homepage.status !== 200);
    sleep(Math.random() * 3 + 2);

  } else if (userJourney < 0.7) {
    // 30% - News reader
    const homepage = http.get(`${BASE_URL}/`);
    check(homepage, { 'Homepage loads': (r) => r.status === 200 });
    sleep(1);

    const news = http.get(`${BASE_URL}/api/news?page=1&limit=12`);
    check(news, { 'News API works': (r) => r.status === 200 });
    errorRate.add(news.status !== 200);
    sleep(Math.random() * 5 + 3);

    // Maybe load more news
    if (Math.random() > 0.5) {
      const moreNews = http.get(`${BASE_URL}/api/news?page=2&limit=12`);
      check(moreNews, { 'More news loads': (r) => r.status === 200 });
      sleep(2);
    }

  } else if (userJourney < 0.9) {
    // 20% - Poll participants
    const polls = http.get(`${BASE_URL}/api/polls/active`);
    check(polls, { 'Polls load': (r) => r.status === 200 });
    errorRate.add(polls.status !== 200);
    sleep(Math.random() * 4 + 2);

  } else {
    // 10% - Heavy users (multiple interactions)
    const homepage = http.get(`${BASE_URL}/`);
    sleep(1);

    const news = http.get(`${BASE_URL}/api/news?page=1&limit=12`);
    sleep(2);

    const polls = http.get(`${BASE_URL}/api/polls/active`);
    sleep(1);

    const radio = http.get(`${BASE_URL}/api/radio`);

    check(homepage, { 'Heavy user - homepage': (r) => r.status === 200 });
    check(news, { 'Heavy user - news': (r) => r.status === 200 });
    check(polls, { 'Heavy user - polls': (r) => r.status === 200 });
    check(radio, { 'Heavy user - radio': (r) => r.status === 200 });

    errorRate.add(homepage.status !== 200 || news.status !== 200);
    sleep(Math.random() * 10 + 5);
  }
}