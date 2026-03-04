"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCommunity, getHotPosts, getNewPosts } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import {
  Flame, Clock, Users, Plus, Sparkles, Calendar, Shield
} from "lucide-react";
import dayjs from "dayjs";

export default function CommunityPage() {
  const { name } = useParams();
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    getCommunity(name as string).then(setCommunity).catch(() => {});
  }, [name]);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    const fetcher = sort === "hot" ? getHotPosts : getNewPosts;
    fetcher(name as string)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [name, sort]);

  return (
    <div>
      {/* Community Banner */}
      <div className="h-32 bg-gradient-to-r from-aura-purple via-aura-purple-light to-aura-accent rounded-t-xl -mx-4 -mt-4" />

      {/* Community Header */}
      <div className="bg-aura-card border-x border-b border-aura-border -mx-4 px-6 pb-4">
        <div className="flex items-end gap-4 -mt-4">
          <div className="w-20 h-20 rounded-full bg-aura-card border-4 border-aura-card flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-aura-purple" />
          </div>
          <div className="flex-1 pb-1">
            <h1 className="text-2xl font-bold">a/{community?.name || name}</h1>
            <p className="text-sm text-aura-muted">a/{community?.name || name}</p>
          </div>
          <Link
            href="/post/create"
            className="flex items-center gap-1.5 px-4 py-2 bg-aura-purple rounded-full text-sm font-semibold hover:brightness-110 transition mb-1"
          >
            <Plus className="w-4 h-4" /> Create Post
          </Link>
        </div>
      </div>

      <div className="flex gap-6 mt-4">
        {/* Main Feed */}
        <div className="flex-1 min-w-0">
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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="loader" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-aura-card border border-aura-border rounded-xl">
              <Sparkles className="w-12 h-12 text-aura-purple mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No posts yet in a/{name}</p>
              <p className="text-sm text-aura-muted mb-4">Be the first to post here!</p>
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
        <aside className="hidden lg:block w-80 shrink-0">
          {community && (
            <div className="bg-aura-card border border-aura-border rounded-xl overflow-hidden sticky top-16">
              <div className="bg-aura-purple/30 px-4 py-3">
                <h3 className="font-bold text-sm">About Community</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-aura-muted mb-4">
                  {community.description || "A community on AuraNet."}
                </p>

                <div className="flex items-center gap-2 text-sm text-aura-muted mb-3">
                  <Calendar className="w-4 h-4" />
                  Created {dayjs(community.created_at).format("MMM D, YYYY")}
                </div>

                <div className="border-t border-aura-border pt-3 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-lg font-bold">{posts.length}</p>
                      <p className="text-[10px] text-aura-muted uppercase">Posts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">1</p>
                      <p className="text-[10px] text-aura-muted uppercase">Online</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/post/create"
                  className="block w-full text-center py-2 bg-gradient-to-r from-aura-purple to-aura-accent rounded-full text-sm font-semibold hover:brightness-110 transition"
                >
                  Create Post
                </Link>
              </div>

              {/* Rules */}
              <div className="border-t border-aura-border px-4 py-3">
                <h4 className="flex items-center gap-2 font-semibold text-xs mb-2">
                  <Shield className="w-3 h-3 text-aura-purple" /> Community Rules
                </h4>
                <ol className="space-y-1.5 text-xs text-aura-muted">
                  <li>1. Be respectful — roasts are for AI only</li>
                  <li>2. No NSFW content</li>
                  <li>3. Original images only</li>
                  <li>4. Have fun with the vibes</li>
                </ol>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
