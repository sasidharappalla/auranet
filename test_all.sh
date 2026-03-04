#!/bin/bash
# ═══════════════════════════════════════════════════════════
# AuraNet Full Feature Dry Run
# Tests every API endpoint before deployment
# Compatible with macOS (BSD) and Linux (GNU)
# ═══════════════════════════════════════════════════════════

API="http://localhost:8000"
PASS=0
FAIL=0
WARN=0
TMP_BODY="/tmp/auranet_test_body.txt"

green() { echo -e "\033[32m✅ PASS: $1\033[0m"; PASS=$((PASS+1)); }
red()   { echo -e "\033[31m❌ FAIL: $1\033[0m — $2"; FAIL=$((FAIL+1)); }
yellow(){ echo -e "\033[33m⚠️  WARN: $1\033[0m — $2"; WARN=$((WARN+1)); }

# Cross-platform curl helper: writes body to TMP_BODY, prints HTTP status code
do_curl() {
    curl -s -o "$TMP_BODY" -w "%{http_code}" "$@"
}

check() {
    local desc="$1"
    local status="$2"
    local expect_status="$3"

    if [ "$status" = "$expect_status" ]; then
        green "$desc (HTTP $status)"
    else
        red "$desc" "Expected HTTP $expect_status, got $status"
        echo "    Response: $(head -c 200 "$TMP_BODY")"
    fi
}

echo ""
echo "══════════════════════════════════════════════════"
echo "  AuraNet API Dry Run — Testing All Features"
echo "══════════════════════════════════════════════════"
echo ""

# ── 1. Health Check ──────────────────────────────────────
echo "── 1. Health Check ──"
STATUS=$(do_curl "$API/health")
check "Health check" "$STATUS" "200"
echo ""

# ── 2. User Registration ────────────────────────────────
echo "── 2. User Registration ──"
STATUS=$(do_curl -X POST "$API/api/users/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}')
check "Register user" "$STATUS" "201"

TOKEN=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('access_token',''))" 2>/dev/null)
USER_ID=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('user',{}).get('id',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    red "Extract token" "Could not extract JWT token from register response"
    # Try registering with different name in case user already exists
    STATUS=$(do_curl -X POST "$API/api/users/register" \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser2","email":"test2@example.com","password":"testpass123"}')
    TOKEN=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('access_token',''))" 2>/dev/null)
    USER_ID=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('user',{}).get('id',''))" 2>/dev/null)

    if [ -z "$TOKEN" ]; then
        # Last resort: login with testuser
        STATUS=$(do_curl -X POST "$API/api/users/login" \
            -H "Content-Type: application/json" \
            -d '{"username":"testuser","password":"testpass123"}')
        TOKEN=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('access_token',''))" 2>/dev/null)
        USER_ID=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('user',{}).get('id',''))" 2>/dev/null)
    fi
fi

if [ -n "$TOKEN" ]; then
    green "Token extracted successfully"
else
    red "Token extraction" "FATAL: Cannot continue without auth token"
    echo ""
    echo "══════════════════════════════════════════════════"
    echo -e "  \033[31m⛔ Cannot run tests without authentication\033[0m"
    echo "══════════════════════════════════════════════════"
    exit 1
fi

AUTH="Authorization: Bearer $TOKEN"
echo ""

# ── 3. User Login ────────────────────────────────────────
echo "── 3. User Login ──"
STATUS=$(do_curl -X POST "$API/api/users/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"testpass123"}')
check "Login user" "$STATUS" "200"
echo ""

# ── 4. Get Current User ─────────────────────────────────
echo "── 4. Get Current User ──"
STATUS=$(do_curl "$API/api/users/me" -H "$AUTH")
check "Get /me" "$STATUS" "200"
echo ""

# ── 5. List Communities ──────────────────────────────────
echo "── 5. Communities ──"
STATUS=$(do_curl "$API/api/communities/")
check "List communities" "$STATUS" "200"

# Get first community name for later tests
COMMUNITY_NAME=$(python3 -c "import sys,json; d=json.load(open('$TMP_BODY')); print(d[0]['name'] if d else '')" 2>/dev/null)
COMMUNITY_ID=$(python3 -c "import sys,json; d=json.load(open('$TMP_BODY')); print(d[0]['id'] if d else '')" 2>/dev/null)

if [ -z "$COMMUNITY_NAME" ]; then
    yellow "No seed communities" "Creating one..."
    STATUS=$(do_curl -X POST "$API/api/communities/" \
        -H "Content-Type: application/json" -H "$AUTH" \
        -d '{"name":"TestCommunity","description":"A test community"}')
    check "Create community" "$STATUS" "201"
    COMMUNITY_NAME=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('name',''))" 2>/dev/null)
    COMMUNITY_ID=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('id',''))" 2>/dev/null)
else
    green "Seed communities found ($COMMUNITY_NAME)"
fi

# Get single community
STATUS=$(do_curl "$API/api/communities/$COMMUNITY_NAME")
check "Get community by name" "$STATUS" "200"
echo ""

# ── 6. Community Membership ──────────────────────────────
echo "── 6. Community Membership ──"
STATUS=$(do_curl -X POST "$API/api/communities/$COMMUNITY_NAME/members/join" -H "$AUTH")
# 201 = joined, 409 = already member — both OK
if [ "$STATUS" = "201" ] || [ "$STATUS" = "409" ]; then
    green "Join community (HTTP $STATUS)"
else
    red "Join community" "Expected 201 or 409, got $STATUS"
fi

STATUS=$(do_curl "$API/api/communities/$COMMUNITY_NAME/members/status" -H "$AUTH")
check "Membership status" "$STATUS" "200"

STATUS=$(do_curl "$API/api/communities/$COMMUNITY_NAME/members/?limit=10")
check "List members" "$STATUS" "200"
echo ""

# ── 7. Create Post (text only) ──────────────────────────
echo "── 7. Create Post ──"
STATUS=$(do_curl -X POST "$API/api/posts/" \
    -H "$AUTH" \
    -F "title=Test Post from Dry Run" \
    -F "body=This is an automated test post." \
    -F "community_id=$COMMUNITY_ID")
check "Create text post" "$STATUS" "201"

POST_ID=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('id',''))" 2>/dev/null)
echo ""

# ── 8. Create Post with Image ───────────────────────────
echo "── 8. Create Post with Image (AI Pipeline) ──"
# Create a small test image
python3 -c "
import struct, zlib
def create_png(w, h):
    raw = b''
    for y in range(h):
        raw += b'\x00' + bytes([int(255*y/h), 100, int(255*(1-y/h))]) * w
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
open('/tmp/test_image.png', 'wb').write(create_png(50, 50))
" 2>/dev/null

STATUS=$(do_curl -X POST "$API/api/posts/" \
    -H "$AUTH" \
    -F "title=Image Post - AI Test" \
    -F "body=Testing the AI pipeline" \
    -F "community_id=$COMMUNITY_ID" \
    -F "image=@/tmp/test_image.png")
check "Create image post" "$STATUS" "201"

IMAGE_POST_ID=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('id',''))" 2>/dev/null)
AI_STATUS=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('ai_status',''))" 2>/dev/null)

if [ "$AI_STATUS" = "pending" ]; then
    green "AI status set to 'pending' after upload"
else
    yellow "AI status is '$AI_STATUS'" "Expected 'pending'"
fi
echo ""

# ── 9. Feed Endpoints ───────────────────────────────────
echo "── 9. Feed Endpoints ──"
STATUS=$(do_curl "$API/api/posts/hot")
check "Hot feed" "$STATUS" "200"

STATUS=$(do_curl "$API/api/posts/new")
check "New feed" "$STATUS" "200"

STATUS=$(do_curl "$API/api/posts/hot?community=$COMMUNITY_NAME")
check "Community feed" "$STATUS" "200"

# Get single post
STATUS=$(do_curl "$API/api/posts/$POST_ID")
check "Get single post" "$STATUS" "200"
echo ""

# ── 10. Comments ─────────────────────────────────────────
echo "── 10. Comments ──"
STATUS=$(do_curl -X POST "$API/api/posts/$POST_ID/comments/" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d '{"content":"This is a test comment!"}')
check "Create comment" "$STATUS" "201"

COMMENT_ID=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('id',''))" 2>/dev/null)

# Nested reply
STATUS=$(do_curl -X POST "$API/api/posts/$POST_ID/comments/" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d "{\"content\":\"This is a nested reply!\",\"parent_comment_id\":\"$COMMENT_ID\"}")
check "Create nested reply" "$STATUS" "201"

# Get comment tree
STATUS=$(do_curl "$API/api/posts/$POST_ID/comments/")
check "Get comment tree" "$STATUS" "200"

# Edit comment
STATUS=$(do_curl -X PUT "$API/api/posts/$POST_ID/comments/$COMMENT_ID" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d '{"content":"Edited comment!"}')
check "Edit comment" "$STATUS" "200"
echo ""

# ── 11. Voting ───────────────────────────────────────────
echo "── 11. Voting ──"
# Upvote post
STATUS=$(do_curl -X POST "$API/api/posts/$POST_ID/vote/" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d '{"vote_direction":1}')
check "Upvote post" "$STATUS" "200"

# Downvote (switch)
STATUS=$(do_curl -X POST "$API/api/posts/$POST_ID/vote/" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d '{"vote_direction":-1}')
check "Downvote post (switch)" "$STATUS" "200"

# Remove vote
STATUS=$(do_curl -X POST "$API/api/posts/$POST_ID/vote/" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d '{"vote_direction":0}')
check "Remove vote" "$STATUS" "200"

# Vote on comment
STATUS=$(do_curl -X POST "$API/api/comments/$COMMENT_ID/vote/" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d '{"vote_direction":1}')
check "Upvote comment" "$STATUS" "200"
echo ""

# ── 12. Saved Posts ──────────────────────────────────────
echo "── 12. Saved Posts ──"
STATUS=$(do_curl -X POST "$API/api/saved/$POST_ID" -H "$AUTH")
check "Save post" "$STATUS" "201"

STATUS=$(do_curl "$API/api/saved/" -H "$AUTH")
check "List saved posts" "$STATUS" "200"

STATUS=$(do_curl -X DELETE "$API/api/saved/$POST_ID" -H "$AUTH")
check "Unsave post" "$STATUS" "200"
echo ""

# ── 13. Notifications ────────────────────────────────────
echo "── 13. Notifications ──"
STATUS=$(do_curl "$API/api/notifications/" -H "$AUTH")
check "List notifications" "$STATUS" "200"

STATUS=$(do_curl "$API/api/notifications/count" -H "$AUTH")
check "Unread count" "$STATUS" "200"

STATUS=$(do_curl -X PUT "$API/api/notifications/read-all" -H "$AUTH")
check "Mark all read" "$STATUS" "200"
echo ""

# ── 14. Search ───────────────────────────────────────────
echo "── 14. Search ──"
STATUS=$(do_curl "$API/api/search/?q=test&type=all")
check "Search all" "$STATUS" "200"

STATUS=$(do_curl "$API/api/search/?q=test&type=posts")
check "Search posts" "$STATUS" "200"

STATUS=$(do_curl "$API/api/search/?q=test&type=communities")
check "Search communities" "$STATUS" "200"

STATUS=$(do_curl "$API/api/search/?q=testuser&type=users")
check "Search users" "$STATUS" "200"
echo ""

# ── 15. User Profile ────────────────────────────────────
echo "── 15. User Profile ──"
STATUS=$(do_curl "$API/api/profile/testuser")
check "Get user profile" "$STATUS" "200"

STATUS=$(do_curl "$API/api/profile/testuser/posts")
check "Get user posts" "$STATUS" "200"

# Update profile
STATUS=$(do_curl -X PUT "$API/api/profile/settings" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d '{"display_name":"Test User","bio":"Hello from dry run!"}')
check "Update profile" "$STATUS" "200"
echo ""

# ── 16. Reports ──────────────────────────────────────────
echo "── 16. Reports ──"
STATUS=$(do_curl -X POST "$API/api/reports" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d "{\"post_id\":\"$POST_ID\",\"reason\":\"spam\",\"description\":\"Test report\"}")
check "Create report" "$STATUS" "201"
echo ""

# ── 17. Delete Post (soft delete) ────────────────────────
echo "── 17. Soft Delete ──"
STATUS=$(do_curl -X DELETE "$API/api/posts/$POST_ID" -H "$AUTH")
check "Soft delete post" "$STATUS" "200"

# Verify deleted post returns 404
STATUS=$(do_curl "$API/api/posts/$POST_ID")
check "Deleted post returns 404" "$STATUS" "404"
echo ""

# ── 18. AI Worker Check ─────────────────────────────────
echo "── 18. AI Worker Pipeline ──"
if [ -n "$IMAGE_POST_ID" ]; then
    echo "   Waiting 5 seconds for AI worker to process..."
    sleep 5
    STATUS=$(do_curl "$API/api/posts/$IMAGE_POST_ID")

    AI_STATUS=$(python3 -c "import sys,json; print(json.load(open('$TMP_BODY')).get('ai_status',''))" 2>/dev/null)
    AI_ROAST=$(python3 -c "import sys,json; r=json.load(open('$TMP_BODY')).get('ai_roast'); print(r.get('aura_score','') if r else '')" 2>/dev/null)

    if [ "$AI_STATUS" = "completed" ]; then
        green "AI worker processed image (status=completed, score=$AI_ROAST)"
    elif [ "$AI_STATUS" = "processing" ]; then
        yellow "AI still processing" "Worker may be slow, try checking manually"
    elif [ "$AI_STATUS" = "pending" ]; then
        red "AI never picked up job" "Check worker logs: docker-compose logs worker"
    else
        yellow "AI status: $AI_STATUS" "Unexpected status"
    fi
else
    yellow "Skipped AI test" "Image post was not created"
fi
echo ""

# ── 19. Delete comment (soft delete) ────────────────────
echo "── 19. Comment Soft Delete ──"
STATUS=$(do_curl -X DELETE "$API/api/posts/$POST_ID/comments/$COMMENT_ID" -H "$AUTH")
# Post is deleted so this might 404 — that's OK
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
    green "Delete comment (HTTP $STATUS)"
else
    red "Delete comment" "Got $STATUS"
fi
echo ""

# ── 20. Community Leave ──────────────────────────────────
echo "── 20. Leave Community ──"
STATUS=$(do_curl -X DELETE "$API/api/communities/$COMMUNITY_NAME/members/leave" -H "$AUTH")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
    green "Leave community (HTTP $STATUS)"
else
    red "Leave community" "Got $STATUS"
fi
echo ""

# ── Cleanup ──────────────────────────────────────────────
rm -f "$TMP_BODY" /tmp/test_image.png

# ══════════════════════════════════════════════════════════
echo "══════════════════════════════════════════════════"
echo "  RESULTS"
echo "══════════════════════════════════════════════════"
echo ""
echo -e "  \033[32m✅ Passed: $PASS\033[0m"
echo -e "  \033[31m❌ Failed: $FAIL\033[0m"
echo -e "  \033[33m⚠️  Warnings: $WARN\033[0m"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "  \033[32m🚀 ALL TESTS PASSED — Ready to deploy!\033[0m"
else
    echo -e "  \033[31m⛔ $FAIL test(s) failed — fix before deploying\033[0m"
fi
echo ""
