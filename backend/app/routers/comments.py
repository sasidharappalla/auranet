"""Nested comment endpoints with voting, editing, soft deletes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Comment, Post, User, CommentVote
from app.schemas import CommentCreate, CommentResponse, CommentEditRequest
from app.auth import get_current_user

router = APIRouter(prefix="/api/posts/{post_id}/comments", tags=["comments"])


def _build_comment_tree(comments: list[Comment], parent_id=None) -> list[CommentResponse]:
    """Recursively build a nested comment tree from a flat list."""
    tree = []
    for comment in comments:
        if comment.parent_comment_id == parent_id:
            replies = _build_comment_tree(comments, parent_id=comment.id)

            content = comment.content
            author_username = comment.author.username if comment.author else None
            author_avatar = comment.author.avatar_url if comment.author else None

            if comment.is_deleted:
                content = "[deleted]"
                author_username = "[deleted]"
                author_avatar = None

            tree.append(
                CommentResponse(
                    id=comment.id,
                    post_id=comment.post_id,
                    user_id=comment.user_id,
                    parent_comment_id=comment.parent_comment_id,
                    content=content,
                    score=comment.score,
                    is_edited=comment.is_edited,
                    is_deleted=comment.is_deleted,
                    created_at=comment.created_at,
                    author_username=author_username,
                    author_avatar=author_avatar,
                    replies=replies,
                )
            )
    return tree


@router.get("/", response_model=list[CommentResponse])
async def get_comments(post_id: UUID, db: AsyncSession = Depends(get_db)):
    """Return the full nested comment tree for a post."""
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    if not post_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Post not found")

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    )
    comments = result.scalars().all()

    return _build_comment_tree(list(comments), parent_id=None)


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a top-level or nested reply comment."""
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.is_locked:
        raise HTTPException(status_code=403, detail="Post is locked")

    if payload.parent_comment_id:
        parent_result = await db.execute(
            select(Comment).where(
                Comment.id == payload.parent_comment_id,
                Comment.post_id == post_id,
            )
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent.is_locked:
            raise HTTPException(status_code=403, detail="Parent comment is locked")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        parent_comment_id=payload.parent_comment_id,
        content=payload.content,
    )
    db.add(comment)
    await db.flush()

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        score=0,
        is_edited=False,
        is_deleted=False,
        created_at=comment.created_at,
        author_username=current_user.username,
        author_avatar=current_user.avatar_url,
        replies=[],
    )


@router.put("/{comment_id}", response_model=CommentResponse)
async def edit_comment(
    post_id: UUID,
    comment_id: UUID,
    payload: CommentEditRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit a comment (author only)."""
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if comment.is_deleted:
        raise HTTPException(status_code=400, detail="Cannot edit deleted comment")

    comment.content = payload.content
    comment.is_edited = True
    await db.flush()

    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        score=comment.score,
        is_edited=True,
        is_deleted=False,
        created_at=comment.created_at,
        author_username=current_user.username,
        author_avatar=current_user.avatar_url,
        replies=[],
    )


@router.delete("/{comment_id}")
async def delete_comment(
    post_id: UUID,
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a comment (author only)."""
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.post_id == post_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not authorized")

    comment.is_deleted = True
    comment.content = "[deleted]"
    await db.flush()
    return {"message": "Comment deleted"}
