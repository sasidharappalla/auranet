"use client";

import Link from "next/link";
import {
  Users, TrendingUp, Info, Zap, Shield,
  Github, ExternalLink, Sparkles
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  description: string;
}

export default function Sidebar({ communities }: { communities: Community[] }) {
  return (
    <aside className="hidden lg:flex flex-col gap-4 w-80 shrink-0">
      {/* About AuraNet */}
      <div className="bg-aura-card border border-aura-border rounded-xl overflow-hidden sticky top-16">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-aura-purple to-aura-accent relative">
          <div className="absolute -bottom-4 left-4">
            <div className="w-12 h-12 rounded-full bg-aura-card border-4 border-aura-card flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-aura-purple" />
            </div>
          </div>
        </div>

        <div className="p-4 pt-6">
          <h3 className="font-bold text-lg">AuraNet</h3>
          <p className="text-xs text-aura-muted mt-1">
            The AI-powered community where vibes get rated. Post images,
            get scored, and climb the aura leaderboard.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4 py-3 border-t border-b border-aura-border">
            <div>
              <p className="text-lg font-bold text-aura-text">4</p>
              <p className="text-[10px] text-aura-muted uppercase tracking-wide">Communities</p>
            </div>
            <div>
              <p className="text-lg font-bold text-aura-text">1</p>
              <p className="text-[10px] text-aura-muted uppercase tracking-wide">Online</p>
            </div>
          </div>

          <Link
            href="/post/create"
            className="flex items-center justify-center gap-2 w-full mt-3 py-2 bg-gradient-to-r from-aura-purple to-aura-accent rounded-full text-sm font-semibold hover:brightness-110 transition"
          >
            Create Post
          </Link>
        </div>
      </div>

      {/* Communities */}
      <div className="bg-aura-card border border-aura-border rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3 text-aura-text">
          <TrendingUp className="w-4 h-4 text-aura-accent" />
          Top Communities
        </h3>
        <div className="flex flex-col">
          {communities.map((c, i) => (
            <Link
              key={c.id}
              href={`/community/${c.name}`}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-aura-bg transition group"
            >
              <span className="text-xs text-aura-muted w-4">{i + 1}</span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-aura-purple/60 to-aura-accent/60 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-aura-purple transition">
                  a/{c.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tech Stack Info */}
      <div className="bg-aura-card border border-aura-border rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-semibold text-sm mb-3 text-aura-text">
          <Info className="w-4 h-4 text-aura-purple" />
          Under the Hood
        </h3>
        <div className="space-y-2">
          {[
            { icon: <Zap className="w-3 h-3" />, label: "FastAPI + PostgreSQL" },
            { icon: <Shield className="w-3 h-3" />, label: "RabbitMQ Workers" },
            { icon: <Sparkles className="w-3 h-3" />, label: "Vision AI Scoring" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-aura-muted">
              <span className="text-aura-purple">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
