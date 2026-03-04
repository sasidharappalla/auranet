"""Pydantic request/response schemas for API validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Auth & Users ───────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: str = ""
    karma: int = 0
    role: str = "user"
    status: str = "active"
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserProfileResponse(BaseModel):
    id: UUID
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    bio: str = ""
    karma: int = 0
    role: str = "user"
    created_at: datetime
    post_count: int = 0
    comment_count: int = 0

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# ── Communities ────────────────────────────────────────────

class CommunityCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: str = ""
    is_private: bool = False


class CommunityResponse(BaseModel):
    id: UUID
    name: str
    description: str
    rules: Optional[list] = []
    banner_url: Optional[str] = None
    icon_url: Optional[str] = None
    creator_id: Optional[UUID] = None
    is_private: bool = False
    member_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CommunityMemberResponse(BaseModel):
    user_id: UUID
    username: str
    role: str
    joined_at: datetime


# ── Posts ──────────────────────────────────────────────────

class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    body: str = ""
    community_id: UUID
    is_nsfw: bool = False
    is_spoiler: bool = False
    flair: Optional[str] = None


class PostResponse(BaseModel):
    id: UUID
    title: str
    body: str
    image_url: Optional[str] = None
    ai_roast: Optional[dict] = None
    ai_status: str = "none"
    score: int
    is_nsfw: bool = False
    is_spoiler: bool = False
    is_locked: bool = False
    is_pinned: bool = False
    flair: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    community_name: Optional[str] = None
    community_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    upvotes: int = 0
    downvotes: int = 0
    comment_count: int = 0
    user_vote: Optional[int] = None
    is_saved: bool = False

    class Config:
        from_attributes = True


# ── Comments ───────────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    parent_comment_id: Optional[UUID] = None


class CommentResponse(BaseModel):
    id: UUID
    post_id: UUID
    user_id: UUID
    parent_comment_id: Optional[UUID] = None
    content: str
    score: int = 0
    is_edited: bool = False
    is_deleted: bool = False
    created_at: datetime
    author_username: Optional[str] = None
    author_avatar: Optional[str] = None
    user_vote: Optional[int] = None
    replies: list["CommentResponse"] = []

    class Config:
        from_attributes = True


class CommentEditRequest(BaseModel):
    content: str = Field(..., min_length=1)


# ── Votes ──────────────────────────────────────────────────

class VoteCreate(BaseModel):
    vote_direction: int = Field(..., ge=-1, le=1)


class VoteResponse(BaseModel):
    post_id: UUID
    new_score: int
    user_vote: int


class CommentVoteResponse(BaseModel):
    comment_id: UUID
    new_score: int
    user_vote: int


# ── Saved Posts ────────────────────────────────────────────

class SavedPostResponse(BaseModel):
    id: UUID
    post_id: UUID
    saved_at: datetime
    post: Optional[PostResponse] = None


# ── Notifications ─────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: UUID
    type: str
    message: str
    is_read: bool
    post_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None
    actor_username: Optional[str] = None
    actor_avatar: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCountResponse(BaseModel):
    unread_count: int


# ── Reports ────────────────────────────────────────────────

class ReportCreate(BaseModel):
    post_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None
    reported_user: Optional[UUID] = None
    reason: str
    description: str = ""


class ReportResponse(BaseModel):
    id: UUID
    reporter_id: UUID
    post_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None
    reported_user: Optional[UUID] = None
    reason: str
    description: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Mod Actions ────────────────────────────────────────────

class ModActionCreate(BaseModel):
    action_type: str
    target_post: Optional[UUID] = None
    target_comment: Optional[UUID] = None
    target_user: Optional[UUID] = None
    reason: str = ""


class ModActionResponse(BaseModel):
    id: UUID
    moderator_id: UUID
    community_id: Optional[UUID] = None
    action_type: str
    target_post: Optional[UUID] = None
    target_comment: Optional[UUID] = None
    target_user: Optional[UUID] = None
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Search ─────────────────────────────────────────────────

class SearchResults(BaseModel):
    posts: list[PostResponse] = []
    communities: list[CommunityResponse] = []
    users: list[UserProfileResponse] = []
