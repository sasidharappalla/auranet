"use client";

import { useState } from "react";
import { searchAll } from "@/lib/api";
import PostCard from "@/components/PostCard";
import { Search, Users, FileText, Hash } from "lucide-react";
import Link from "next/link";

type SearchType = "all" | "posts" | "communities" | "users";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchAll(query, type);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const tabs: { value: SearchType; label: string; icon: any }[] = [
    { value: "all", label: "All", icon: Search },
    { value: "posts", label: "Posts", icon: FileText },
    { value: "communities", label: "Communities", icon: Hash },
    { value: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-aura-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-aura-text flex items-center gap-2 mb-6">
          <Search className="w-6 h-6" /> Search
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-aura-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts, communities, users..."
                className="w-full pl-10 pr-4 py-3 bg-aura-card border border-aura-border rounded-xl text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-purple transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-aura-purple rounded-xl text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </form>

        {/* Type Tabs */}
        <div className="flex gap-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                type === t.value
                  ? "bg-aura-purple/20 text-aura-purple"
                  : "text-aura-muted hover:bg-aura-card"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="loader" /></div>
        ) : !searched ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-aura-muted/30 mx-auto mb-4" />
            <p className="text-aura-muted">Search for anything on AuraNet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Posts */}
            {results?.posts?.length > 0 && (type === "all" || type === "posts") && (
              <div>
                {type === "all" && (
                  <h2 className="text-lg font-semibold text-aura-text mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Posts
                  </h2>
                )}
                <div className="space-y-3">
                  {results.posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Communities */}
            {results?.communities?.length > 0 && (type === "all" || type === "communities") && (
              <div>
                {type === "all" && (
                  <h2 className="text-lg font-semibold text-aura-text mb-3 flex items-center gap-2">
                    <Hash className="w-5 h-5" /> Communities
                  </h2>
                )}
                <div className="space-y-2">
                  {results.communities.map((c: any) => (
                    <Link
                      key={c.id}
                      href={`/community/${c.name}`}
                      className="flex items-center gap-3 p-4 bg-aura-card border border-aura-border rounded-xl hover:border-aura-border-hover transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-aura-purple to-aura-accent flex items-center justify-center text-white font-bold">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-aura-text">a/{c.name}</p>
                        <p className="text-sm text-aura-muted line-clamp-1">{c.description}</p>
                      </div>
                      <span className="text-xs text-aura-muted">{c.member_count} members</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results?.users?.length > 0 && (type === "all" || type === "users") && (
              <div>
                {type === "all" && (
                  <h2 className="text-lg font-semibold text-aura-text mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" /> Users
                  </h2>
                )}
                <div className="space-y-2">
                  {results.users.map((u: any) => (
                    <Link
                      key={u.id}
                      href={`/user/${u.username}`}
                      className="flex items-center gap-3 p-4 bg-aura-card border border-aura-border rounded-xl hover:border-aura-border-hover transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-aura-card border border-aura-border flex items-center justify-center text-aura-purple font-bold">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          u.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-aura-text">{u.display_name || u.username}</p>
                        <p className="text-sm text-aura-muted">u/{u.username}</p>
                      </div>
                      <span className="text-xs text-aura-muted">{u.karma} karma</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {results && !results.posts?.length && !results.communities?.length && !results.users?.length && (
              <div className="text-center py-12">
                <p className="text-aura-muted">No results found for &quot;{query}&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
