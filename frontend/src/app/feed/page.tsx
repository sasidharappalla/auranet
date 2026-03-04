"use client";

import { useState, useEffect } from "react";
import { getHotPosts, getNewPosts, getCommunities } from "@/lib/api";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { Flame, Clock, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher = sort === "hot" ? getHotPosts : getNewPosts;
    fetcher()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [sort]);

  useEffect(() => {
    getCommunities().then(setCommunities).catch(() => {});
  }, []);

  return (
    <div className="flex gap-6">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        {/* Quick create bar */}
        {user && (
          <Link
            href="/post/create"
            className="flex items-center gap-3 p-3 mb-4 bg-aura-card border border-aura-border rounded-xl hover:border-aura-border-hover transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-aura-purple to-aura-accent flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {user.username[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 bg-aura-bg border border-aura-border rounded-full px-4 py-2 text-sm text-aura-muted">
              Create Post
            </div>
          </Link>
        )}

        {/* Sort tabs */}
        <div className="flex items-center gap-1 p-2 mb-4 bg-aura-card border border-aura-border rounded-xl">
          {[
            { key: "hot" as const, icon: <Flame className="w-4 h-4" />, label: "Hot" },
            { key: "new" as const, icon: <Clock className="w-4 h-4" />, label: "New" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSort(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                sort === tab.key
                  ? "bg-aura-bg text-aura-text"
                  : "text-aura-muted hover:bg-aura-bg/50 hover:text-aura-text"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="loader" />
            <p className="text-aura-muted text-sm">Loading the vibes...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-aura-card border border-aura-border rounded-xl">
            <Sparkles className="w-12 h-12 text-aura-purple mx-auto mb-4 animate-float" />
            <p className="text-aura-text text-lg font-medium mb-2">No posts yet</p>
            <p className="text-aura-muted text-sm mb-4">Be the first to share your aura.</p>
            {user && (
              <Link
                href="/post/create"
                className="inline-flex px-4 py-2 bg-aura-purple rounded-lg text-sm font-medium hover:brightness-110 transition"
              >
                Create a Post
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <Sidebar communities={communities} />
    </div>
  );
}
