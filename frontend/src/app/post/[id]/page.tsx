"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getPost, getComments, createComment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import CommentTree from "@/components/CommentTree";
import Link from "next/link";
import { MessageSquare, ArrowLeft, Users } from "lucide-react";

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getPost(id as string), getComments(id as string)])
      .then(([p, c]) => { setPost(p); setComments(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleComment() {
    if (!commentText.trim() || !id || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await createComment(id as string, commentText);
      setComments([...comments, { ...newComment, replies: [] }]);
      setCommentText("");
    } catch {}
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="loader" />
        <p className="text-aura-muted text-sm">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="text-aura-text text-lg font-medium mb-2">Post not found</p>
        <Link href="/feed" className="text-aura-purple text-sm hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {/* Back button */}
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-aura-muted hover:text-aura-text mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to feed
        </Link>

        {/* Post */}
        <PostCard post={post} />

        {/* Comment section */}
        <div className="mt-3 bg-aura-card border border-aura-border rounded-xl">
          {/* Comment input */}
          <div className="p-4 border-b border-aura-border">
            <p className="text-xs text-aura-muted mb-2">
              Comment as{" "}
              {user ? (
                <span className="text-aura-purple font-medium">u/{user.username}</span>
              ) : (
                <Link href="/auth" className="text-aura-purple hover:underline">Sign in</Link>
              )}
            </p>

            {user ? (
              <>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What are your thoughts?"
                  rows={4}
                  className="w-full bg-aura-bg border border-aura-border rounded-lg px-4 py-3 text-sm text-aura-text
                    placeholder:text-aura-muted focus:border-aura-purple outline-none resize-none transition"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || submitting}
                    className="px-6 py-2 bg-aura-purple rounded-full text-sm font-semibold hover:brightness-110 transition disabled:opacity-50"
                  >
                    {submitting ? "Posting..." : "Comment"}
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-aura-bg border border-aura-border rounded-lg p-6 text-center">
                <p className="text-sm text-aura-muted mb-3">Log in or sign up to leave a comment</p>
                <div className="flex gap-2 justify-center">
                  <Link
                    href="/auth"
                    className="px-6 py-2 border border-aura-purple text-aura-purple rounded-full text-sm font-medium hover:bg-aura-purple/10 transition"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth"
                    className="px-6 py-2 bg-aura-purple rounded-full text-sm font-medium hover:brightness-110 transition"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Comments header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-aura-border">
            <MessageSquare className="w-4 h-4 text-aura-muted" />
            <span className="text-sm font-medium">{comments.length} Comments</span>
          </div>

          {/* Comment tree */}
          <div className="p-4">
            <CommentTree comments={comments} postId={id as string} />
          </div>
        </div>
      </div>

      {/* Right sidebar — community info */}
      {post.community_name && (
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-aura-card border border-aura-border rounded-xl overflow-hidden sticky top-16">
            <div className="h-16 bg-gradient-to-r from-aura-purple to-aura-accent" />
            <div className="p-4">
              <div className="flex items-center gap-2 -mt-8 mb-3">
                <div className="w-10 h-10 rounded-full bg-aura-card border-4 border-aura-card flex items-center justify-center">
                  <Users className="w-4 h-4 text-aura-purple" />
                </div>
                <Link href={`/community/${post.community_name}`} className="font-bold text-sm hover:text-aura-purple transition">
                  a/{post.community_name}
                </Link>
              </div>
              <Link
                href={`/community/${post.community_name}`}
                className="block w-full text-center py-2 border border-aura-border rounded-full text-sm font-medium hover:border-aura-purple hover:text-aura-purple transition"
              >
                View Community
              </Link>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
