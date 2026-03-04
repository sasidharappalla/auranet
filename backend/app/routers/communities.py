"""Community CRUD endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Community, User
from app.schemas import CommunityCreate, CommunityResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/communities", tags=["communities"])


@router.get("/", response_model=list[CommunityResponse])
async def list_communities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community).order_by(Community.name))
    communities = result.scalars().all()
    return [CommunityResponse.model_validate(c) for c in communities]


@router.get("/{name}", response_model=CommunityResponse)
async def get_community(name: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community).where(Community.name == name))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return CommunityResponse.model_validate(community)


@router.post("/", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    payload: CommunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(select(Community).where(Community.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Community name already taken")

    community = Community(
        name=payload.name,
        description=payload.description,
        creator_id=current_user.id,
    )
    db.add(community)
    await db.flush()
    return CommunityResponse.model_validate(community)
