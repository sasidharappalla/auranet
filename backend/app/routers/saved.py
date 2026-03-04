"""Saved/bookmarked posts endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import SavedPost, Post, User, Community, Vote, Comment
from app.schemas import PostResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/saved", tags=["saved"])


@router.get("/", response_model=list[PostResponse])
async def list_saved_posts(
    limit: int = 25,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List saved posts for the current user."""
    result = await db.execute(
        select(SavedPost)
        .where(SavedPost.user_id == current_user.id)
        .order_by(SavedPost.saved_at.desc())
        .limit(limit)
        .offset(offset)
    )
    saved_entries = result.scalars().all()

    response = []
    for entry in saved_entries:
        post_result = await db.execute(
            select(Post).where(Post.id == entry.post_id, Post.is_deleted == False)
        )
        post = post_result.scalar_one_or_none()
        if not post:
            continue

        author_result = await db.execute(select(User).where(User.id == post.user_id))
        author = author_result.scalar_one_or_none()

        comm_result = await db.execute(select(Community).where(Community.id == post.community_id))
        community = comm_result.scalar_one_or_none()

        up = await db.execute(select(func.count()).where(Vote.post_id == post.id, Vote.vote_direction == 1))
        down = await db.execute(select(func.count()).where(Vote.post_id == post.id, Vote.vote_direction == -1))
        cc = await db.execute(select(func.count()).where(Comment.post_id == post.id))

        response.append(PostResponse(
            id=post.id, title=post.title, body=post.body, image_url=post.image_url,
            ai_roast=post.ai_roast, ai_status=post.ai_status, score=post.score,
            is_nsfw=post.is_nsfw, is_spoiler=post.is_spoiler, is_locked=post.is_locked,
            is_pinned=post.is_pinned, flair=post.flair,
            created_at=post.created_at, updated_at=post.updated_at,
            author_username=author.username if author else None,
            author_avatar=author.avatar_url if author else None,
            community_name=community.name if community else None,
            community_id=post.community_id, user_id=post.user_id,
            upvotes=up.scalar() or 0, downvotes=down.scalar() or 0,
            comment_count=cc.scalar() or 0,
            is_saved=True,
        ))

    return response


@router.post("/{post_id}", status_code=status.HTTP_201_CREATED)
async def save_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save/bookmark a post."""
    # Check post exists
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    if not post_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Post not found")

    # Check not already saved
    existing = await db.execute(
        select(SavedPost).where(
            SavedPost.user_id == current_user.id,
            SavedPost.post_id == post_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Post already saved")

    saved = SavedPost(user_id=current_user.id, post_id=post_id)
    db.add(saved)
    await db.flush()
    return {"message": "Post saved"}


@router.delete("/{post_id}")
async def unsave_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a saved/bookmarked post."""
    result = await db.execute(
        select(SavedPost).where(
            SavedPost.user_id == current_user.id,
            SavedPost.post_id == post_id,
        )
    )
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved post not found")

    await db.delete(saved)
    await db.flush()
    return {"message": "Post unsaved"}
