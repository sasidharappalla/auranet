"""AuraNet API Gateway — FastAPI entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    users, communities, posts, comments, votes,
    profile, notifications, saved, search, reports,
    comment_votes, community_members,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("🚀 AuraNet API is starting up...")
    yield
    print("👋 AuraNet API is shutting down...")


app = FastAPI(
    title="AuraNet API",
    description="A Reddit-style platform with AI-powered image analysis and aura scoring.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users.router)
app.include_router(communities.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(votes.router)
app.include_router(profile.router)
app.include_router(notifications.router)
app.include_router(saved.router)
app.include_router(search.router)
app.include_router(reports.router)
app.include_router(comment_votes.router)
app.include_router(community_members.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "auranet-api", "version": "2.0.0"}
