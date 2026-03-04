"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getUserProfile, getUserPosts } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PostCard from "@/components/PostCard";
import { Calendar, MessageSquare, FileText, Award, Settings } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [tab, setTab] = useState<"posts" | "comments">("posts");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileData, postsData] = await Promise.all([
          getUserProfile(username),
          getUserPosts(username),
        ]);
        setProfile(profileData);
        setPosts(postsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-aura-bg">
        <div className="loader" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-aura-bg">
        <p className="text-aura-muted text-lg">User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="min-h-screen bg-aura-bg">
      {/* Banner */}
      <div
        className="h-48 w-full bg-gradient-to-r from-aura-purple/30 to-aura-accent/30"
        style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      />

      <div className="max-w-5xl mx-auto px-4 -mt-16">
        {/* Profile Header */}
        <div className="flex items-end gap-4 mb-6">
          <div className="w-32 h-32 rounded-full bg-aura-card border-4 border-aura-bg flex items-center justify-center text-4xl font-bold text-aura-purple">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              profile.username[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-aura-text">
                {profile.display_name || profile.username}
              </h1>
              {profile.role !== "user" && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-aura-purple/20 text-aura-purple font-medium">
                  {profile.role}
                </span>
              )}
            </div>
            <p className="text-aura-muted">u/{profile.username}</p>
          </div>
          {isOwnProfile && (
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-aura-card border border-aura-border hover:border-aura-border-hover text-sm text-aura-text transition-all"
            >
              <Settings className="w-4 h-4" /> Edit Profile
            </Link>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-aura-text mb-6 max-w-2xl">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2 text-aura-muted">
            <Award className="w-4 h-4 text-aura-gold" />
            <span className="font-semibold text-aura-text">{profile.karma}</span> karma
          </div>
          <div className="flex items-center gap-2 text-aura-muted">
            <FileText className="w-4 h-4" />
            <span className="font-semibold text-aura-text">{profile.post_count}</span> posts
          </div>
          <div className="flex items-center gap-2 text-aura-muted">
            <MessageSquare className="w-4 h-4" />
            <span className="font-semibold text-aura-text">{profile.comment_count}</span> comments
          </div>
          <div className="flex items-center gap-2 text-aura-muted">
            <Calendar className="w-4 h-4" />
            Joined {dayjs(profile.created_at).format("MMM YYYY")}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-aura-border mb-6">
          <button
            onClick={() => setTab("posts")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "posts"
                ? "text-aura-purple border-b-2 border-aura-purple"
                : "text-aura-muted hover:text-aura-text"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setTab("comments")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              tab === "comments"
                ? "text-aura-purple border-b-2 border-aura-purple"
                : "text-aura-muted hover:text-aura-text"
            }`}
          >
            Comments
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 pb-12">
          {tab === "posts" && posts.length === 0 && (
            <p className="text-center text-aura-muted py-12">No posts yet</p>
          )}
          {tab === "posts" && posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
          {tab === "comments" && (
            <p className="text-center text-aura-muted py-12">Comments view coming soon</p>
          )}
        </div>
      </div>
    </div>
  );
}
