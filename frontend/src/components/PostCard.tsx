"use client";

import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowBigUp, ArrowBigDown, MessageSquare, Zap,
  Share2, Bookmark, MoreHorizontal, Award, Users
} from "lucide-react";
import { voteOnPost } from "@/lib/api";
import { useState } from "react";

dayjs.extend(relativeTime);

interface Post {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  ai_roast: { aura_score: number; roast: string; tags?: string[] } | null;
  score: number;
  created_at: string;
  author_username: string;
  community_name: string;
  upvotes: number;
  downvotes: number;
  comment_count: number;
}

function AuraScoreBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return "from-yellow-400 to-orange-500 text-yellow-400";
    if (s >= 60) return "from-aura-purple to-aura-purple-light text-aura-purple";
    if (s >= 40) return "from-blue-400 to-cyan-400 text-blue-400";
    return "from-gray-400 to-gray-500 text-gray-400";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Elite Aura";
    if (s >= 60) return "Strong Aura";
    if (s >= 40) return "Mid Aura";
    return "Low Aura";
  };

  return (
    <div className={`flex items-center gap-1.5`}>
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getColor(score)} flex items-center justify-center`}>
        <span className="text-xs font-black text-white">{score}</span>
      </div>
      <span className={`text-xs font-semibold ${getColor(score).split(" ").pop()}`}>
        {getLabel(score)}
      </span>
    </div>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const [score, setScore] = useState(post.upvotes - post.downvotes);
  const [userVote, setUserVote] = useState<number>(0);

  async function handleVote(direction: number) {
    const newDir = userVote === direction ? 0 : direction;
    try {
      const result = await voteOnPost(post.id, newDir);
      setScore(result.new_score);
      setUserVote(result.user_vote);
    } catch {}
  }

  return (
    <div className="bg-aura-card border border-aura-border rounded-xl overflow-hidden hover:border-aura-border-hover transition group">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-aura-purple/60 to-aura-accent/60 flex items-center justify-center">
          <Users className="w-3 h-3 text-white" />
        </div>
        <Link
          href={`/community/${post.community_name}`}
          className="text-xs font-bold text-aura-text hover:text-aura-purple transition"
        >
          a/{post.community_name}
        </Link>
        <span className="text-[11px] text-aura-muted">
          Posted by u/{post.author_username} {dayjs(post.created_at).fromNow()}
        </span>
        {post.ai_roast && (
          <div className="ml-auto">
            <AuraScoreBadge score={post.ai_roast.aura_score} />
          </div>
        )}
      </div>

      <div className="flex">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-0 px-2 py-2">
          <button
            onClick={() => handleVote(1)}
            className={`p-1 rounded-md hover:bg-aura-purple/20 transition-colors ${
              userVote === 1 ? "text-aura-purple" : "text-aura-muted hover:text-aura-purple"
            }`}
          >
            <ArrowBigUp className={`w-6 h-6 ${userVote === 1 ? "fill-current" : ""}`} />
          </button>
          <span className={`text-xs font-bold py-0.5 ${
            userVote === 1 ? "text-aura-purple" : userVote === -1 ? "text-aura-accent" : "text-aura-text"
          }`}>
            {score}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className={`p-1 rounded-md hover:bg-aura-accent/20 transition-colors ${
              userVote === -1 ? "text-aura-accent" : "text-aura-muted hover:text-aura-accent"
            }`}
          >
            <ArrowBigDown className={`w-6 h-6 ${userVote === -1 ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 pb-2 pr-4">
          <Link href={`/post/${post.id}`}>
            <h2 className="text-base font-semibold text-aura-text hover:text-aura-purple transition leading-snug mb-1">
              {post.title}
            </h2>
          </Link>

          {post.body && (
            <p className="text-sm text-aura-muted line-clamp-3 mb-2">{post.body}</p>
          )}

          {/* Image */}
          {post.image_url && (
            <Link href={`/post/${post.id}`} className="block mb-2">
              <div className="relative rounded-lg overflow-hidden bg-aura-bg max-h-[512px]">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full max-h-[512px] object-contain"
                />
              </div>
            </Link>
          )}

          {/* AI Roast Card */}
          {post.ai_roast && (
            <div className="relative bg-gradient-to-r from-aura-purple/10 via-aura-card to-aura-accent/10 border border-aura-purple/20 rounded-lg p-3 mb-2 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-aura-purple/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm text-aura-text/80 italic leading-relaxed">
                    &ldquo;{post.ai_roast.roast}&rdquo;
                  </p>
                  {post.ai_roast.tags && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {post.ai_roast.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-aura-purple/20 text-aura-purple-light uppercase tracking-wide"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-1 -ml-2">
            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-aura-muted hover:bg-aura-bg hover:text-aura-text transition"
            >
              <MessageSquare className="w-4 h-4" />
              {post.comment_count} Comments
            </Link>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-aura-muted hover:bg-aura-bg hover:text-aura-text transition">
              <Award className="w-4 h-4" /> Award
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-aura-muted hover:bg-aura-bg hover:text-aura-text transition">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-aura-muted hover:bg-aura-bg hover:text-aura-text transition">
              <Bookmark className="w-4 h-4" /> Save
            </button>
            <button className="p-1.5 rounded-full text-aura-muted hover:bg-aura-bg hover:text-aura-text transition">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
