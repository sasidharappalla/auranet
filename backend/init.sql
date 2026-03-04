-- AuraNet Database Schema v2.0
-- Full-featured social platform with AI scoring

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For search

-- ── Users ─────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(50) UNIQUE NOT NULL,
    display_name  VARCHAR(100),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url    VARCHAR(512),
    banner_url    VARCHAR(512),
    bio           TEXT DEFAULT '',
    karma         INT DEFAULT 0,
    role          VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deactivated')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_username_trgm ON users USING gin(username gin_trgm_ops);

-- ── Communities ───────────────────────────────────────────
CREATE TABLE communities (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(50) UNIQUE NOT NULL,
    description  TEXT DEFAULT '',
    rules        JSONB DEFAULT '[]'::jsonb,
    banner_url   VARCHAR(512),
    icon_url     VARCHAR(512),
    creator_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    is_private   BOOLEAN DEFAULT FALSE,
    member_count INT DEFAULT 0,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_communities_name ON communities(name);
CREATE INDEX idx_communities_name_trgm ON communities USING gin(name gin_trgm_ops);

-- ── Community Memberships ─────────────────────────────────
CREATE TABLE community_members (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    role         VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'owner')),
    joined_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, community_id)
);

CREATE INDEX idx_cm_user ON community_members(user_id);
CREATE INDEX idx_cm_community ON community_members(community_id);

-- ── Posts ──────────────────────────────────────────────────
CREATE TABLE posts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id  UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    title         VARCHAR(300) NOT NULL,
    body          TEXT DEFAULT '',
    image_url     VARCHAR(512),
    ai_roast      JSONB DEFAULT NULL,
    ai_status     VARCHAR(20) DEFAULT 'none' CHECK (ai_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
    score         INT DEFAULT 0,
    is_nsfw       BOOLEAN DEFAULT FALSE,
    is_spoiler    BOOLEAN DEFAULT FALSE,
    is_locked     BOOLEAN DEFAULT FALSE,
    is_pinned     BOOLEAN DEFAULT FALSE,
    is_deleted    BOOLEAN DEFAULT FALSE,
    deleted_at    TIMESTAMP WITH TIME ZONE,
    flair         VARCHAR(50),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_score ON posts(score DESC);
CREATE INDEX idx_posts_title_trgm ON posts USING gin(title gin_trgm_ops);

-- ── Comments (Adjacency List for infinite nesting) ────────
CREATE TABLE comments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id           UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    score             INT DEFAULT 0,
    is_edited         BOOLEAN DEFAULT FALSE,
    is_deleted        BOOLEAN DEFAULT FALSE,
    is_locked         BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- ── Post Votes ────────────────────────────────────────────
CREATE TABLE votes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    vote_direction  SMALLINT NOT NULL CHECK (vote_direction IN (-1, 1)),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_votes_post ON votes(post_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- ── Comment Votes ─────────────────────────────────────────
CREATE TABLE comment_votes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id      UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    vote_direction  SMALLINT NOT NULL CHECK (vote_direction IN (-1, 1)),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_votes_comment ON comment_votes(comment_id);

-- ── Saved Posts (Bookmarks) ───────────────────────────────
CREATE TABLE saved_posts (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    saved_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_saved_user ON saved_posts(user_id);

-- ── Notifications ─────────────────────────────────────────
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    type        VARCHAR(30) NOT NULL CHECK (type IN (
        'post_reply', 'comment_reply', 'post_upvote', 'mention',
        'ai_complete', 'mod_action', 'welcome'
    )),
    post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
    message     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ── Reports (Content Moderation) ──────────────────────────
CREATE TABLE reports (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id        UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id     UUID REFERENCES comments(id) ON DELETE CASCADE,
    reported_user  UUID REFERENCES users(id) ON DELETE CASCADE,
    reason         VARCHAR(30) NOT NULL CHECK (reason IN (
        'spam', 'harassment', 'hate', 'nsfw', 'copyright',
        'misinformation', 'other'
    )),
    description    TEXT DEFAULT '',
    status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at    TIMESTAMP WITH TIME ZONE,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);

-- ── Mod Actions (Audit Log) ──────────────────────────────
CREATE TABLE mod_actions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moderator_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id   UUID REFERENCES communities(id) ON DELETE CASCADE,
    action_type    VARCHAR(30) NOT NULL CHECK (action_type IN (
        'remove_post', 'remove_comment', 'lock_post', 'pin_post',
        'ban_user', 'unban_user', 'warn_user', 'edit_rules'
    )),
    target_post    UUID REFERENCES posts(id) ON DELETE SET NULL,
    target_comment UUID REFERENCES comments(id) ON DELETE SET NULL,
    target_user    UUID REFERENCES users(id) ON DELETE SET NULL,
    reason         TEXT DEFAULT '',
    previous_state JSONB,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mod_actions_community ON mod_actions(community_id);

-- ── Post Drafts ───────────────────────────────────────────
CREATE TABLE post_drafts (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    community_id  UUID REFERENCES communities(id) ON DELETE SET NULL,
    title         VARCHAR(300) DEFAULT '',
    body          TEXT DEFAULT '',
    image_url     VARCHAR(512),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drafts_user ON post_drafts(user_id);

-- ── Hot Feed View (Time-Decay Ranking) ────────────────────
CREATE OR REPLACE VIEW hot_posts AS
SELECT
    p.*,
    u.username AS author_username,
    u.avatar_url AS author_avatar,
    c.name AS community_name,
    COALESCE(v.upvotes, 0) AS upvotes,
    COALESCE(v.downvotes, 0) AS downvotes,
    COALESCE(cm.comment_count, 0) AS comment_count,
    (COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0))::FLOAT
        / POWER(
            EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 + 2,
            1.8
          ) AS hot_rank
FROM posts p
JOIN users u ON p.user_id = u.id
JOIN communities c ON p.community_id = c.id
LEFT JOIN (
    SELECT
        post_id,
        COUNT(*) FILTER (WHERE vote_direction = 1)  AS upvotes,
        COUNT(*) FILTER (WHERE vote_direction = -1) AS downvotes
    FROM votes
    GROUP BY post_id
) v ON v.post_id = p.id
LEFT JOIN (
    SELECT post_id, COUNT(*) AS comment_count
    FROM comments
    GROUP BY post_id
) cm ON cm.post_id = p.id
WHERE p.is_deleted = FALSE
ORDER BY hot_rank DESC;

-- ── Seed data ─────────────────────────────────────────────
INSERT INTO communities (name, description, rules) VALUES
    ('Battlestations', 'Show off your desk setup and get roasted by AI',
     '[{"rule":"Post your own setup only"},{"rule":"Be constructive"},{"rule":"No reposts"}]'::jsonb),
    ('Pets', 'Post your pets and let AI judge their aura',
     '[{"rule":"Pets only"},{"rule":"Be kind"},{"rule":"No wild animals"}]'::jsonb),
    ('Fits', 'Outfit checks with AI aura scoring',
     '[{"rule":"OC only"},{"rule":"Full fit visible"},{"rule":"No brand spam"}]'::jsonb),
    ('Food', 'Rate my plate — AI edition',
     '[{"rule":"Food you made or ordered"},{"rule":"Include description"},{"rule":"No gross-out posts"}]'::jsonb),
    ('Nature', 'Landscapes, sunsets, and outdoor vibes',
     '[{"rule":"Original photos"},{"rule":"Include location if possible"}]'::jsonb),
    ('Memes', 'AI rates your meme aura',
     '[{"rule":"Original or credited"},{"rule":"No hate memes"},{"rule":"Keep it fun"}]'::jsonb);
