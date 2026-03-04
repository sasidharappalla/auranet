"""Search endpoints — posts, communities, users with pg_trgm."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import SearchResults, PostResponse, CommunityResponse, UserProfileResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/", response_model=SearchResults)
async def search_all(
    q: str = Query(..., min_length=1, max_length=200),
    type: str = Query("all", pattern="^(all|posts|communities|users)$"),
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """Search posts, communities, and users using trigram similarity."""
    results = SearchResults()

    if type in ("all", "posts"):
        post_query = text("""
            SELECT p.*, u.username as author_username, u.avatar_url as author_avatar,
                   c.name as community_name,
                   COALESCE(SUM(CASE WHEN v.vote_direction = 1 THEN 1 ELSE 0 END), 0) as upvotes,
                   COALESCE(SUM(CASE WHEN v.vote_direction = -1 THEN 1 ELSE 0 END), 0) as downvotes,
                   (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) as comment_count
            FROM posts p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN communities c ON p.community_id = c.id
            LEFT JOIN votes v ON v.post_id = p.id
            WHERE p.is_deleted = false
              AND (p.title ILIKE '%' || :q || '%' OR p.body ILIKE '%' || :q || '%')
            GROUP BY p.id, u.username, u.avatar_url, c.name
            ORDER BY p.score DESC
            LIMIT :limit
        """)
        result = await db.execute(post_query, {"q": q, "limit": limit})
        for r in result.mappings().all():
            results.posts.append(PostResponse(
                id=r["id"], title=r["title"], body=r["body"],
                image_url=r["image_url"], ai_roast=r["ai_roast"],
                ai_status=r["ai_status"], score=r["score"],
                is_nsfw=r["is_nsfw"], is_spoiler=r["is_spoiler"],
                is_locked=r["is_locked"], is_pinned=r["is_pinned"],
                flair=r["flair"],
                created_at=r["created_at"], updated_at=r["updated_at"],
                author_username=r["author_username"],
                author_avatar=r["author_avatar"],
                community_name=r["community_name"],
                community_id=r["community_id"], user_id=r["user_id"],
                upvotes=r["upvotes"], downvotes=r["downvotes"],
                comment_count=r["comment_count"],
            ))

    if type in ("all", "communities"):
        comm_query = text("""
            SELECT * FROM communities
            WHERE name ILIKE '%' || :q || '%'
               OR description ILIKE '%' || :q || '%'
            ORDER BY member_count DESC
            LIMIT :limit
        """)
        result = await db.execute(comm_query, {"q": q, "limit": limit})
        for r in result.mappings().all():
            results.communities.append(CommunityResponse(
                id=r["id"], name=r["name"], description=r["description"],
                banner_url=r["banner_url"], icon_url=r["icon_url"],
                creator_id=r["creator_id"], is_private=r["is_private"],
                member_count=r["member_count"], created_at=r["created_at"],
            ))

    if type in ("all", "users"):
        user_query = text("""
            SELECT id, username, display_name, avatar_url, banner_url, bio,
                   karma, role, created_at
            FROM users
            WHERE status = 'active'
              AND (username ILIKE '%' || :q || '%'
                   OR display_name ILIKE '%' || :q || '%')
            ORDER BY karma DESC
            LIMIT :limit
        """)
        result = await db.execute(user_query, {"q": q, "limit": limit})
        for r in result.mappings().all():
            results.users.append(UserProfileResponse(
                id=r["id"], username=r["username"],
                display_name=r["display_name"], avatar_url=r["avatar_url"],
                banner_url=r["banner_url"], bio=r["bio"],
                karma=r["karma"], role=r["role"],
                created_at=r["created_at"],
            ))

    return results
