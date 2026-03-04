"""Post CRUD endpoints with image upload, soft deletes, and RabbitMQ integration."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Post, Vote, Comment, User, Community, SavedPost
from app.schemas import PostResponse
from app.auth import get_current_user, get_current_user_optional
from app.services.minio_service import upload_image
from app.services.rabbitmq_service import publish_post_created

router = APIRouter(prefix="/api/posts", tags=["posts"])


def _row_to_post(r) -> PostResponse:
    """Convert a hot_posts view row (RowMapping) to a PostResponse."""
    return PostResponse(
        id=r["id"], title=r["title"], body=r["body"],
        image_url=r.get("image_url"), ai_roast=r.get("ai_roast"),
        ai_status=r.get("ai_status", "none"), score=r.get("score", 0),
        is_nsfw=r.get("is_nsfw", False), is_spoiler=r.get("is_spoiler", False),
        is_locked=r.get("is_locked", False), is_pinned=r.get("is_pinned", False),
        flair=r.get("flair"),
        created_at=r["created_at"],
        updated_at=r.get("updated_at"),
        author_username=r.get("author_username"),
        author_avatar=r.get("author_avatar"),
        community_name=r.get("community_name"),
        community_id=r.get("community_id"),
        user_id=r.get("user_id"),
        upvotes=r.get("upvotes", 0), downvotes=r.get("downvotes", 0),
        comment_count=r.get("comment_count", 0),
    )


def _build_post_response(post, author, community, upvotes, downvotes, comment_count, user_vote=None, is_saved=False):
    return PostResponse(
        id=post.id,
        title=post.title,
        body=post.body,
        image_url=post.image_url,
        ai_roast=post.ai_roast,
        ai_status=post.ai_status,
        score=post.score,
        is_nsfw=post.is_nsfw,
        is_spoiler=post.is_spoiler,
        is_locked=post.is_locked,
        is_pinned=post.is_pinned,
        flair=post.flair,
        created_at=post.created_at,
        updated_at=post.updated_at,
        author_username=author.username if author else "[deleted]",
        author_avatar=author.avatar_url if author else None,
        community_name=community.name if community else None,
        community_id=post.community_id,
        user_id=post.user_id,
        upvotes=upvotes or 0,
        downvotes=downvotes or 0,
        comment_count=comment_count or 0,
        user_vote=user_vote,
        is_saved=is_saved,
    )


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str = Form(...),
    body: str = Form(""),
    community_id: str = Form(...),
    is_nsfw: bool = Form(False),
    is_spoiler: bool = Form(False),
    flair: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new post with optional image upload. Publishes to RabbitMQ for AI processing."""
    comm_result = await db.execute(select(Community).where(Community.id == UUID(community_id)))
    community = comm_result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    image_url = None
    ai_status = "none"
    if image:
        image_url = await upload_image(image)
        ai_status = "pending"

    post = Post(
        title=title,
        body=body,
        community_id=UUID(community_id),
        user_id=current_user.id,
        image_url=image_url,
        ai_status=ai_status,
        is_nsfw=is_nsfw,
        is_spoiler=is_spoiler,
        flair=flair,
    )
    db.add(post)
    await db.flush()

    if image_url:
        try:
            publish_post_created(str(post.id), image_url)
        except Exception:
            pass

    return _build_post_response(post, current_user, community, 0, 0, 0)


@router.get("/hot", response_model=list[PostResponse])
async def get_hot_posts(
    community: str | None = None,
    limit: int = 25,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Fetch the hot-ranked feed using the time-decay algorithm."""
    if community:
        query = text("SELECT * FROM hot_posts WHERE community_name = :community LIMIT :limit OFFSET :offset")
        result = await db.execute(query, {"community": community, "limit": limit, "offset": offset})
    else:
        query = text("SELECT * FROM hot_posts LIMIT :limit OFFSET :offset")
        result = await db.execute(query, {"limit": limit, "offset": offset})
    rows = result.mappings().all()

    return [_row_to_post(r) for r in rows]


@router.get("/new", response_model=list[PostResponse])
async def get_new_posts(
    community: str | None = None,
    limit: int = 25,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Fetch posts sorted by newest first."""
    if community:
        query = text("SELECT * FROM hot_posts WHERE community_name = :community ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
        result = await db.execute(query, {"community": community, "limit": limit, "offset": offset})
    else:
        query = text("SELECT * FROM hot_posts ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
        result = await db.execute(query, {"limit": limit, "offset": offset})
    rows = result.mappings().all()

    return [_row_to_post(r) for r in rows]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(post_id: UUID, db: AsyncSession = Depends(get_db)):
    """Fetch a single post by ID with vote and comment counts."""
    result = await db.execute(select(Post).where(Post.id == post_id, Post.is_deleted == False))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    author_result = await db.execute(select(User).where(User.id == post.user_id))
    author = author_result.scalar_one_or_none()

    comm_result = await db.execute(select(Community).where(Community.id == post.community_id))
    community = comm_result.scalar_one_or_none()

    up_result = await db.execute(
        select(func.count()).where(Vote.post_id == post_id, Vote.vote_direction == 1)
    )
    upvotes = up_result.scalar()

    down_result = await db.execute(
        select(func.count()).where(Vote.post_id == post_id, Vote.vote_direction == -1)
    )
    downvotes = down_result.scalar()

    comment_result = await db.execute(
        select(func.count()).where(Comment.post_id == post_id)
    )
    comment_count = comment_result.scalar()

    return _build_post_response(post, author, community, upvotes, downvotes, comment_count)


@router.delete("/{post_id}")
async def delete_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft-delete a post (author only)."""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and current_user.role not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not authorized")

    post.is_deleted = True
    await db.flush()
    return {"message": "Post deleted"}
