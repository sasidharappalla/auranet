"use client";

import { useState } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MessageSquare, ArrowBigUp, ArrowBigDown, ChevronDown, ChevronUp } from "lucide-react";
import { createComment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

dayjs.extend(relativeTime);

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  author_username: string;
  replies: Comment[];
}

const DEPTH_COLORS = [
  "border-aura-purple/40",
  "border-aura-accent/40",
  "border-blue-500/40",
  "border-emerald-500/40",
  "border-yellow-500/40",
  "border-pink-500/40",
];

function CommentNode({ comment, postId, depth = 0 }: { comment: Comment; postId: string; depth?: number }) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(comment.replies);

  const borderColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  async function handleReply() {
    if (!replyText.trim()) return;
    try {
      const newComment = await createComment(postId, replyText, comment.id);
      setReplies([...replies, { ...newComment, replies: [] }]);
      setReplyText("");
      setShowReply(false);
    } catch {}
  }

  return (
    <div className={`${depth > 0 ? `ml-4 pl-4 border-l-2 ${borderColor}` : ""} mt-0.5`}>
      <div className="py-2 group">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-aura-muted hover:text-aura-text transition"
          >
            {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-aura-purple/50 to-aura-accent/50 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">
              {comment.author_username[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-semibold text-aura-text hover:text-aura-purple cursor-pointer transition">
            u/{comment.author_username}
          </span>
          <span className="text-[11px] text-aura-muted">
            {dayjs(comment.created_at).fromNow()}
          </span>
        </div>

        {!collapsed && (
          <>
            {/* Comment body */}
            <div className="ml-8">
              <p className="text-sm text-aura-text/90 leading-relaxed">{comment.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-1 mt-1 -ml-2">
                <button className="p-1 rounded text-aura-muted hover:text-aura-purple transition">
                  <ArrowBigUp className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-aura-muted px-0.5">0</span>
                <button className="p-1 rounded text-aura-muted hover:text-aura-accent transition">
                  <ArrowBigDown className="w-4 h-4" />
                </button>

                {user && (
                  <button
                    onClick={() => setShowReply(!showReply)}
                    className="flex items-center gap-1 ml-1 px-2 py-1 rounded text-xs font-medium text-aura-muted hover:bg-aura-bg hover:text-aura-text transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Reply
                  </button>
                )}
              </div>

              {/* Reply form */}
              {showReply && (
                <div className="mt-2 mb-1">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to u/${comment.author_username}...`}
                    rows={3}
                    className="w-full bg-aura-bg border border-aura-border rounded-lg px-3 py-2 text-sm text-aura-text
                      focus:border-aura-purple outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => { setShowReply(false); setReplyText(""); }}
                      className="px-3 py-1 text-xs text-aura-muted hover:text-aura-text transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="px-4 py-1.5 bg-aura-purple rounded-full text-xs font-medium hover:brightness-110 transition disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Nested replies */}
            {replies.length > 0 && (
              <div className="ml-4">
                {replies.map((reply) => (
                  <CommentNode key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
                ))}
              </div>
            )}
          </>
        )}

        {collapsed && replies.length > 0 && (
          <span className="ml-8 text-xs text-aura-muted">
            {replies.length} {replies.length === 1 ? "reply" : "replies"} hidden
          </span>
        )}
      </div>
    </div>
  );
}

export default function CommentTree({ comments, postId }: { comments: Comment[]; postId: string }) {
  return (
    <div>
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-8 h-8 text-aura-muted mx-auto mb-2" />
          <p className="text-aura-muted text-sm">No comments yet. Start the conversation!</p>
        </div>
      ) : (
        comments.map((comment) => (
          <CommentNode key={comment.id} comment={comment} postId={postId} depth={0} />
        ))
      )}
    </div>
  );
}
