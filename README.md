# AuraNet

A Reddit-style platform with AI-powered image analysis and aura scoring. Built as a full-stack distributed system demonstrating asynchronous task queues, recursive data structures, and microservice orchestration.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────>│   FastAPI    │────>│  PostgreSQL  │
│   Frontend   │<────│   Gateway    │<────│   Database   │
│  (Port 3000) │     │  (Port 8000) │     │  (Port 5432) │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐     ┌──────────────┐
                     │   RabbitMQ   │────>│  AI Worker   │
                     │    Broker    │     │   (Python)   │
                     │  (Port 5672) │     └──────┬───────┘
                     └──────────────┘            │
                                          ┌──────▼───────┐
                                          │    MinIO      │
                                          │   Storage     │
                                          │  (Port 9000)  │
                                          └──────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS, TypeScript
- **API Gateway**: Python, FastAPI (async)
- **Database**: PostgreSQL 16 with UUID keys and adjacency list comments
- **Object Storage**: MinIO (S3-compatible)
- **Message Broker**: RabbitMQ
- **AI Worker**: Standalone Python consumer (mock provider, swappable for OpenAI/Groq)
- **Orchestration**: Docker Compose

## Key Features

- **Hot Feed Algorithm**: Time-decay ranking: `R = (U - D) / (T + 2)^1.8`
- **Infinite Nested Comments**: Adjacency list pattern with recursive tree building
- **Async AI Processing**: Image upload → RabbitMQ → Worker → DB update (non-blocking)
- **JWT Authentication**: Stateless auth with bcrypt password hashing
- **Double-Vote Prevention**: Unique constraint on (user_id, post_id)

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Run

```bash
# 1. Clone and enter the project
cd auranet

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services
docker compose up --build

# 4. Open the app
# Frontend:        http://localhost:3000
# API Docs:        http://localhost:8000/docs
# MinIO Console:   http://localhost:9001
# RabbitMQ UI:     http://localhost:15672
```

### Default Communities

The database is seeded with: Battlestations, Pets, Fits, Food.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Create account |
| POST | `/api/users/login` | Get JWT token |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/communities/` | List all communities |
| POST | `/api/communities/` | Create community |
| POST | `/api/posts/` | Create post (multipart + image) |
| GET | `/api/posts/hot` | Hot-ranked feed |
| GET | `/api/posts/new` | Newest posts |
| GET | `/api/posts/{id}` | Single post detail |
| POST | `/api/posts/{id}/comments/` | Add comment (supports nesting) |
| GET | `/api/posts/{id}/comments/` | Get comment tree |
| POST | `/api/posts/{id}/vote/` | Upvote/downvote/remove |

## Swapping in a Real AI Provider

Edit `worker/worker.py` and implement `analyze_image_openai()` or `analyze_image_groq()`, then set `AI_PROVIDER=openai` in `.env`.
