# AuraNet Deployment Guide

## Local Development (Quick Start)

```bash
# 1. Clone and enter the project
cd auranet

# 2. Create your .env file (already done if you see .env)
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Open in browser
# Frontend:     http://localhost:3000
# API Docs:     http://localhost:8000/docs
# API Health:   http://localhost:8000/health
# MinIO Console: http://localhost:9003  (minioadmin / minioadmin123)
# RabbitMQ:     http://localhost:15672  (auranet / auranet_secret)
```

**Note:** If you use the older Docker, replace `docker compose` with `docker-compose`.


## Production Deployment (VPS/Cloud)

### Prerequisites
- A Linux server (Ubuntu 22+ recommended) with Docker and Docker Compose installed
- A domain name pointing to your server's IP
- (Optional) SSL certificate via Let's Encrypt

### Step 1: Upload the project

```bash
scp -r auranet/ user@yourserver:~/auranet
ssh user@yourserver
cd auranet
```

### Step 2: Configure environment

```bash
cp .env.production.example .env
nano .env
```

**Change ALL passwords.** Generate a JWT secret:
```bash
openssl rand -hex 32
```

Set `MINIO_PUBLIC_URL` to your domain:
```
MINIO_PUBLIC_URL=https://yourdomain.com/media
```

Leave `NEXT_PUBLIC_API_URL` empty (Nginx routes `/api/` to backend):
```
NEXT_PUBLIC_API_URL=
```

### Step 3: Deploy

```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### Step 4: Add SSL with Certbot (recommended)

Install Certbot and get a free SSL certificate:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Or update `nginx/nginx.conf` to handle SSL manually.

### Step 5: Verify

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Check API health
curl http://localhost/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f worker
docker-compose -f docker-compose.prod.yml logs -f frontend
```


## Photo Upload → AI Score Flow

1. User creates a post with an image on `/post/create`
2. Frontend sends multipart form to `POST /api/posts/`
3. Backend uploads image to MinIO, creates post with `ai_status: "pending"`
4. Backend publishes `post_created` message to RabbitMQ
5. AI Worker picks up the job:
   - Sets `ai_status: "processing"`
   - Downloads image from MinIO
   - Runs analysis (mock: random score 0-100 + roast + tags)
   - Writes result to `ai_roast` JSON column
   - Sets `ai_status: "completed"`
6. Frontend displays aura score badge, roast text, and tags

### To use real AI instead of mock:

Edit `.env`:
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-real-key
```

Then implement `analyze_image_openai()` in `worker/worker.py`.


## Architecture

```
Browser → Nginx (port 80/443)
           ├── /          → Next.js Frontend (port 3000)
           ├── /api/      → FastAPI Backend (port 8000)
           └── /media/    → MinIO Storage (port 9000)

Backend → RabbitMQ → AI Worker → PostgreSQL
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port already in use | Change ports in docker-compose.yml |
| Frontend can't reach API | Check `NEXT_PUBLIC_API_URL` in .env |
| Images not loading | Check `MINIO_PUBLIC_URL` and MinIO bucket policy |
| Worker not processing | Check `docker-compose logs worker` |
| Database connection error | Wait for health check or restart: `docker-compose restart backend` |
