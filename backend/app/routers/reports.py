"""Report and content moderation endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Report, User, Post, Comment, CommunityMember, ModAction
from app.schemas import ReportCreate, ReportResponse, ModActionCreate, ModActionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["reports", "moderation"])


# ── Reports ────────────────────────────────────────────────

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a report for a post, comment, or user."""
    if not payload.post_id and not payload.comment_id and not payload.reported_user:
        raise HTTPException(status_code=400, detail="Must report a post, comment, or user")

    # Validate targets exist
    if payload.post_id:
        result = await db.execute(select(Post).where(Post.id == payload.post_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Post not found")

    if payload.comment_id:
        result = await db.execute(select(Comment).where(Comment.id == payload.comment_id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Comment not found")

    report = Report(
        reporter_id=current_user.id,
        post_id=payload.post_id,
        comment_id=payload.comment_id,
        reported_user=payload.reported_user,
        reason=payload.reason,
        description=payload.description,
    )
    db.add(report)
    await db.flush()
    return ReportResponse.model_validate(report)


@router.get("/reports", response_model=list[ReportResponse])
async def list_reports(
    community_id: UUID | None = None,
    status_filter: str = "pending",
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List reports (mod-only). Optionally filter by community."""
    # Check user is a moderator or admin
    if current_user.role not in ("admin", "moderator"):
        # Check if they're a community mod
        if community_id:
            member_result = await db.execute(
                select(CommunityMember).where(
                    CommunityMember.user_id == current_user.id,
                    CommunityMember.community_id == community_id,
                    CommunityMember.role.in_(["moderator", "owner"]),
                )
            )
            if not member_result.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="Not authorized")
        else:
            raise HTTPException(status_code=403, detail="Not authorized")

    query = select(Report).where(Report.status == status_filter)
    if community_id:
        # Filter reports for posts in this community
        query = query.join(Post, Report.post_id == Post.id, isouter=True).where(
            Post.community_id == community_id
        )
    query = query.order_by(Report.created_at.desc()).limit(limit)

    result = await db.execute(query)
    reports = result.scalars().all()
    return [ReportResponse.model_validate(r) for r in reports]


@router.put("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: UUID,
    action: str = "dismissed",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resolve a report (mod-only)."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = action  # "resolved" or "dismissed"
    report.reviewed_by = current_user.id
    await db.flush()
    return {"message": f"Report {action}"}


# ── Mod Actions ────────────────────────────────────────────

@router.post("/mod/actions", response_model=ModActionResponse, status_code=status.HTTP_201_CREATED)
async def create_mod_action(
    payload: ModActionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Perform a moderation action (remove post, lock, pin, ban user, etc.)."""
    # Execute the action
    if payload.action_type == "remove_post" and payload.target_post:
        post_result = await db.execute(select(Post).where(Post.id == payload.target_post))
        post = post_result.scalar_one_or_none()
        if post:
            post.is_deleted = True

    elif payload.action_type == "lock_post" and payload.target_post:
        post_result = await db.execute(select(Post).where(Post.id == payload.target_post))
        post = post_result.scalar_one_or_none()
        if post:
            post.is_locked = True

    elif payload.action_type == "unlock_post" and payload.target_post:
        post_result = await db.execute(select(Post).where(Post.id == payload.target_post))
        post = post_result.scalar_one_or_none()
        if post:
            post.is_locked = False

    elif payload.action_type == "pin_post" and payload.target_post:
        post_result = await db.execute(select(Post).where(Post.id == payload.target_post))
        post = post_result.scalar_one_or_none()
        if post:
            post.is_pinned = True

    elif payload.action_type == "remove_comment" and payload.target_comment:
        comment_result = await db.execute(select(Comment).where(Comment.id == payload.target_comment))
        comment = comment_result.scalar_one_or_none()
        if comment:
            comment.is_deleted = True
            comment.content = "[removed by moderator]"

    elif payload.action_type == "lock_comment" and payload.target_comment:
        comment_result = await db.execute(select(Comment).where(Comment.id == payload.target_comment))
        comment = comment_result.scalar_one_or_none()
        if comment:
            comment.is_locked = True

    elif payload.action_type == "ban_user" and payload.target_user:
        user_result = await db.execute(select(User).where(User.id == payload.target_user))
        user = user_result.scalar_one_or_none()
        if user:
            user.status = "banned"

    # Log the mod action
    community_id = None
    if payload.target_post:
        post_result = await db.execute(select(Post).where(Post.id == payload.target_post))
        post = post_result.scalar_one_or_none()
        if post:
            community_id = post.community_id

    mod_action = ModAction(
        moderator_id=current_user.id,
        community_id=community_id,
        action_type=payload.action_type,
        target_post=payload.target_post,
        target_comment=payload.target_comment,
        target_user=payload.target_user,
        reason=payload.reason,
    )
    db.add(mod_action)
    await db.flush()
    return ModActionResponse.model_validate(mod_action)


@router.get("/mod/actions", response_model=list[ModActionResponse])
async def list_mod_actions(
    community_id: UUID | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List moderation audit log."""
    query = select(ModAction)
    if community_id:
        query = query.where(ModAction.community_id == community_id)
    query = query.order_by(ModAction.created_at.desc()).limit(limit)

    result = await db.execute(query)
    actions = result.scalars().all()
    return [ModActionResponse.model_validate(a) for a in actions]
