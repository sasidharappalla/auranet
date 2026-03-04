"""Notification endpoints — list, count, mark read, clear."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Notification, User
from app.schemas import NotificationResponse, NotificationCountResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationResponse])
async def list_notifications(
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications for the current user."""
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    notifications = result.scalars().all()

    response = []
    for n in notifications:
        actor = None
        if n.actor_id:
            actor_result = await db.execute(select(User).where(User.id == n.actor_id))
            actor = actor_result.scalar_one_or_none()

        response.append(NotificationResponse(
            id=n.id,
            type=n.type,
            message=n.message,
            is_read=n.is_read,
            post_id=n.post_id,
            comment_id=n.comment_id,
            actor_username=actor.username if actor else None,
            actor_avatar=actor.avatar_url if actor else None,
            created_at=n.created_at,
        ))

    return response


@router.get("/count", response_model=NotificationCountResponse)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the count of unread notifications."""
    result = await db.execute(
        select(func.count()).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
        )
    )
    return NotificationCountResponse(unread_count=result.scalar() or 0)


@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.flush()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.flush()
    return {"message": "All notifications marked as read"}


@router.delete("/clear")
async def clear_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all read notifications for the current user."""
    from sqlalchemy import delete as sql_delete
    await db.execute(
        sql_delete(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == True,
        )
    )
    await db.flush()
    return {"message": "Read notifications cleared"}
