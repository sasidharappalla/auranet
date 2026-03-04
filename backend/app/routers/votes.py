"""Voting endpoints with double-vote prevention."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Vote, Post, User
from app.schemas import VoteCreate, VoteResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/posts/{post_id}/vote", tags=["votes"])


@router.post("/", response_model=VoteResponse)
async def vote_on_post(
    post_id: UUID,
    payload: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upvote (+1), downvote (-1), or remove vote (0) on a post.
    Prevents double-voting via the UNIQUE constraint.
    """
    # Verify post exists
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check for existing vote
    existing_result = await db.execute(
        select(Vote).where(Vote.user_id == current_user.id, Vote.post_id == post_id)
    )
    existing_vote = existing_result.scalar_one_or_none()

    if payload.vote_direction == 0:
        # Remove vote
        if existing_vote:
            await db.delete(existing_vote)
    elif existing_vote:
        # Update existing vote
        existing_vote.vote_direction = payload.vote_direction
    else:
        # Create new vote
        vote = Vote(
            user_id=current_user.id,
            post_id=post_id,
            vote_direction=payload.vote_direction,
        )
        db.add(vote)

    await db.flush()

    # Recalculate post score
    score_result = await db.execute(
        select(func.coalesce(func.sum(Vote.vote_direction), 0)).where(Vote.post_id == post_id)
    )
    new_score = score_result.scalar()
    post.score = new_score

    return VoteResponse(
        post_id=post_id,
        new_score=new_score,
        user_vote=payload.vote_direction,
    )
