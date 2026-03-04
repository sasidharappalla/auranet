"""Community membership endpoints — join, leave, list members."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import CommunityMember, Community, User
from app.schemas import CommunityMemberResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/communities/{community_name}/members", tags=["community_members"])


@router.get("/", response_model=list[CommunityMemberResponse])
async def list_members(
    community_name: str,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List members of a community."""
    comm_result = await db.execute(select(Community).where(Community.name == community_name))
    community = comm_result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    result = await db.execute(
        select(CommunityMember, User)
        .join(User, CommunityMember.user_id == User.id)
        .where(CommunityMember.community_id == community.id)
        .order_by(CommunityMember.joined_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()

    return [
        CommunityMemberResponse(
            user_id=member.user_id,
            username=user.username,
            role=member.role,
            joined_at=member.joined_at,
        )
        for member, user in rows
    ]


@router.post("/join", status_code=status.HTTP_201_CREATED)
async def join_community(
    community_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a community."""
    comm_result = await db.execute(select(Community).where(Community.name == community_name))
    community = comm_result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Check if already a member
    existing = await db.execute(
        select(CommunityMember).where(
            CommunityMember.user_id == current_user.id,
            CommunityMember.community_id == community.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Already a member")

    member = CommunityMember(
        user_id=current_user.id,
        community_id=community.id,
        role="member",
    )
    db.add(member)

    # Increment member count
    community.member_count = community.member_count + 1

    await db.flush()
    return {"message": f"Joined a/{community_name}"}


@router.delete("/leave")
async def leave_community(
    community_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Leave a community."""
    comm_result = await db.execute(select(Community).where(Community.name == community_name))
    community = comm_result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    result = await db.execute(
        select(CommunityMember).where(
            CommunityMember.user_id == current_user.id,
            CommunityMember.community_id == community.id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Not a member")

    if member.role == "owner":
        raise HTTPException(status_code=400, detail="Owner cannot leave. Transfer ownership first.")

    await db.delete(member)
    community.member_count = max(0, community.member_count - 1)
    await db.flush()
    return {"message": f"Left a/{community_name}"}


@router.get("/status")
async def membership_status(
    community_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if the current user is a member of the community."""
    comm_result = await db.execute(select(Community).where(Community.name == community_name))
    community = comm_result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    result = await db.execute(
        select(CommunityMember).where(
            CommunityMember.user_id == current_user.id,
            CommunityMember.community_id == community.id,
        )
    )
    member = result.scalar_one_or_none()

    return {
        "is_member": member is not None,
        "role": member.role if member else None,
    }
