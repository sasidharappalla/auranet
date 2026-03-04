"use client";

import { useEffect, useState } from "react";
import { getSavedPosts } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import { Bookmark } from "lucide-react";
import Link from "next/link";

export default function SavedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const data = await getSavedPosts();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-aura-bg flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-12 h-12 text-aura-muted mx-auto mb-4" />
          <p className="text-aura-muted mb-4">Sign in to view your saved posts</p>
          <Link href="/auth" className="text-aura-purple hover:underline">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aura-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-aura-text flex items-center gap-2 mb-6">
          <Bookmark className="w-6 h-6" /> Saved Posts
        </h1>

        {loading ? (
          <div className="flex justify-center py-12"><div className="loader" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-aura-muted/30 mx-auto mb-4" />
            <p className="text-aura-muted mb-2">No saved posts yet</p>
            <p className="text-sm text-aura-muted">
              Click the bookmark icon on any post to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
