"""User profile endpoints — public profiles, stats, and settings."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Post, Comment
from app.schemas import UserProfileResponse, UserUpdateRequest, PasswordChangeRequest, UserResponse
from app.auth import get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/{username}", response_model=UserProfileResponse)
async def get_user_profile(username: str, db: AsyncSession = Depends(get_db)):
    """Get a public user profile by username."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Count posts and comments
    post_count_result = await db.execute(
        select(func.count()).where(Post.user_id == user.id, Post.is_deleted == False)
    )
    post_count = post_count_result.scalar() or 0

    comment_count_result = await db.execute(
        select(func.count()).where(Comment.user_id == user.id, Comment.is_deleted == False)
    )
    comment_count = comment_count_result.scalar() or 0

    return UserProfileResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        banner_url=user.banner_url,
        bio=user.bio,
        karma=user.karma,
        role=user.role,
        created_at=user.created_at,
        post_count=post_count,
        comment_count=comment_count,
    )


@router.get("/{username}/posts")
async def get_user_posts(
    username: str,
    limit: int = 25,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Get posts by a specific user."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.models import Community, Vote
    from app.schemas import PostResponse

    posts_result = await db.execute(
        select(Post)
        .where(Post.user_id == user.id, Post.is_deleted == False)
        .order_by(Post.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    posts = posts_result.scalars().all()

    response = []
    for post in posts:
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
            author_username=user.username, author_avatar=user.avatar_url,
            community_name=community.name if community else None,
            community_id=post.community_id, user_id=post.user_id,
            upvotes=up.scalar() or 0, downvotes=down.scalar() or 0,
            comment_count=cc.scalar() or 0,
        ))

    return response


@router.put("/settings", response_model=UserResponse)
async def update_profile(
    payload: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's profile."""
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.banner_url is not None:
        current_user.banner_url = payload.banner_url

    await db.flush()
    return UserResponse.model_validate(current_user)


@router.put("/settings/password")
async def change_password(
    payload: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the current user's password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(payload.new_password)
    await db.flush()
    return {"message": "Password changed successfully"}
