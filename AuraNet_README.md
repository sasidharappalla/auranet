<div align="center">

# 🌐 AuraNet

### A Distributed Social Platform with AI-Powered Image Analysis

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![MinIO](https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white)](https://min.io/)

<p align="center">
  <strong>6 Microservices</strong> · <strong>40+ Async Endpoints</strong> · <strong>Sub-200ms Latency</strong> · <strong>1,000+ Concurrent Users</strong>
</p>

---

</div>

## 🎯 What is AuraNet?

AuraNet is a full-stack social platform built with a **microservices architecture** that combines community engagement with AI-powered image analysis. Think Reddit meets Instagram — with an intelligent content scoring pipeline that surfaces the best content automatically.

The platform uses an **event-driven architecture** with RabbitMQ message queues and async Python workers to process and score images in real-time, while a time-decay hot-ranking algorithm keeps feeds fresh and engaging.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Next.js    │────▶│    Nginx     │────▶│   FastAPI Core   │
│  Frontend    │     │ Reverse Proxy│     │   (12 Routers)   │
└─────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                    ┌──────────────────────────────┤
                    │                              │
              ┌─────▼──────┐              ┌───────▼────────┐
              │ PostgreSQL  │              │   RabbitMQ     │
              │  Database   │              │ Message Queue  │
              └─────────────┘              └───────┬────────┘
                                                   │
              ┌─────────────┐              ┌───────▼────────┐
              │    MinIO     │◀─────────── │  Async Python  │
              │ Object Store │              │   AI Workers   │
              └─────────────┘              └────────────────┘
```

## ✨ Key Features

### Backend & API
- **40+ async REST endpoints** across 12 routers with full CRUD operations
- **JWT authentication** with secure token refresh flow
- **Community system** — create, join, manage communities with role-based access
- **Nested comments** with recursive thread support
- **Full-text search** across posts, communities, and users

### AI & Content Pipeline
- **Event-driven image scoring** via RabbitMQ message queues
- **Async Python workers** for non-blocking AI inference
- **Time-decay hot-ranking** using PostgreSQL materialized views
- **Automatic content moderation** pipeline

### Data & Infrastructure
- **Soft-delete patterns** preserving data integrity across the platform
- **PostgreSQL views** for computed rankings and analytics
- **MinIO object storage** for scalable image/media handling
- **Docker Compose** orchestrating 6 services with health checks

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)

### Run Everything

```bash
# Clone the repository
git clone https://github.com/sasidharappalla/auranet.git
cd auranet

# Start all services
docker compose up --build

# The app will be available at:
# Frontend:  http://localhost:3000
# API:       http://localhost:8000
# API Docs:  http://localhost:8000/docs
# RabbitMQ:  http://localhost:15672
# MinIO:     http://localhost:9001
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js, React, TypeScript, TailwindCSS |
| **Backend** | FastAPI, Python 3.11+, Pydantic |
| **Database** | PostgreSQL 15, SQLAlchemy (async) |
| **Message Queue** | RabbitMQ with aio-pika |
| **Object Storage** | MinIO (S3-compatible) |
| **Auth** | JWT (access + refresh tokens) |
| **Reverse Proxy** | Nginx |
| **Containerization** | Docker, Docker Compose |

## 📊 Performance

| Metric | Value |
|--------|-------|
| API Response (p95) | < 200ms |
| Concurrent Users | 1,000+ |
| Service Uptime | 99%+ |
| Async Endpoints | 40+ |
| Microservices | 6 |

## 📁 Project Structure

```
auranet/
├── backend/
│   ├── app/
│   │   ├── routers/          # 12 API routers
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── workers/          # RabbitMQ consumers
│   │   └── core/             # Config, auth, deps
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   └── lib/              # API client, utils
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit PRs.

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/sasidharappalla">Sasidhar Appalla</a></p>
</div>
