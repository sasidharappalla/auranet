import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://localhost:8000";

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "2m", target: 1000 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<200"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const health = http.get(`${baseUrl}/health`);
  check(health, {
    "health returns 200": (response) => response.status === 200,
  });

  const feed = http.get(`${baseUrl}/api/posts/hot`);
  check(feed, {
    "hot feed returns 200": (response) => response.status === 200,
  });

  sleep(1);
}
