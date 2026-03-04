"""Comment voting endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CommentVote, Comment, User
from app.schemas import VoteCreate, CommentVoteResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/comments/{comment_id}/vote", tags=["comment_votes"])


@router.post("/", response_model=CommentVoteResponse)
async def vote_on_comment(
    comment_id: UUID,
    payload: VoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upvote (+1), downvote (-1), or remove vote (0) on a comment."""
    # Verify comment exists
    comment_result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = comment_result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Check for existing vote
    existing_result = await db.execute(
        select(CommentVote).where(
            CommentVote.user_id == current_user.id,
            CommentVote.comment_id == comment_id,
        )
    )
    existing_vote = existing_result.scalar_one_or_none()

    if payload.vote_direction == 0:
        if existing_vote:
            await db.delete(existing_vote)
    elif existing_vote:
        existing_vote.vote_direction = payload.vote_direction
    else:
        vote = CommentVote(
            user_id=current_user.id,
            comment_id=comment_id,
            vote_direction=payload.vote_direction,
        )
        db.add(vote)

    await db.flush()

    # Recalculate comment score
    score_result = await db.execute(
        select(func.coalesce(func.sum(CommentVote.vote_direction), 0))
        .where(CommentVote.comment_id == comment_id)
    )
    new_score = score_result.scalar()
    comment.score = new_score

    return CommentVoteResponse(
        comment_id=comment_id,
        new_score=new_score,
        user_vote=payload.vote_direction,
    )
