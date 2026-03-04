"use client";

import Link from "next/link";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import DisplayCards from "@/components/ui/display-cards";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Zap, MessageSquare, Image, Users, ArrowRight,
  Brain, TrendingUp, Shield, Search, Bell, Bookmark, Flag, Settings
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const { user } = useAuth();

  const featureCards = [
    {
      icon: <Zap className="size-4 text-yellow-300" />,
      title: "AI Aura Scoring",
      description: "Get your vibe rated 0-100 by AI",
      date: "Powered by LLMs",
      iconClassName: "text-yellow-500",
      titleClassName: "text-yellow-500",
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <MessageSquare className="size-4 text-purple-300" />,
      title: "Nested Threads",
      description: "Infinite comment nesting",
      date: "Like Reddit, but cooler",
      iconClassName: "text-purple-500",
      titleClassName: "text-purple-500",
      className:
        "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      icon: <TrendingUp className="size-4 text-rose-300" />,
      title: "Hot Algorithm",
      description: "Time-decay ranked feeds",
      date: "Always fresh",
      iconClassName: "text-rose-500",
      titleClassName: "text-rose-500",
      className:
        "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
    },
  ];

  const bentoFeatures = [
    {
      name: "AI Roasts",
      description: "Upload images and let AI rate your aura with savage one-liners and a score from 0-100.",
      Icon: Brain,
      href: "/feed",
      cta: "Try it out",
      className: "col-span-3 lg:col-span-1",
      background: <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10" />,
    },
    {
      name: "Communities",
      description: "Join themed boards like a/Battlestations, a/Pets, a/Fits and more.",
      Icon: Users,
      href: "/feed",
      cta: "Browse communities",
      className: "col-span-3 lg:col-span-2",
      background: <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />,
    },
    {
      name: "Search",
      description: "Find posts, communities, and users with powerful full-text search.",
      Icon: Search,
      href: "/search",
      cta: "Search now",
      className: "col-span-3 lg:col-span-2",
      background: <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10" />,
    },
    {
      name: "Notifications",
      description: "Stay updated on replies, mentions, and community activity in real-time.",
      Icon: Bell,
      href: "/notifications",
      cta: "View alerts",
      className: "col-span-3 lg:col-span-1",
      background: <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-pink-500/10" />,
    },
    {
      name: "Bookmarks",
      description: "Save your favorite posts and come back to them anytime.",
      Icon: Bookmark,
      href: "/saved",
      cta: "View saved",
      className: "col-span-3 lg:col-span-1",
      background: <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10" />,
    },
    {
      name: "Moderation",
      description: "Community-driven moderation with reports, mod actions, and audit logs.",
      Icon: Shield,
      href: "/feed",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-2",
      background: <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10" />,
    },
  ];

  return (
    <div className="min-h-screen bg-aura-bg">
      {/* Hero Section */}
      <Card className="w-full h-[600px] bg-black/[0.96] relative overflow-hidden border-0 rounded-none">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

        <div className="flex h-full max-w-7xl mx-auto">
          {/* Left content */}
          <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-aura-purple" />
              <span className="text-sm font-medium text-aura-purple tracking-wide uppercase">
                Welcome to AuraNet
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                Rate the
              </span>
              <br />
              <span className="text-gradient">Vibes.</span>
            </h1>

            <p className="mt-6 text-neutral-400 max-w-lg text-lg leading-relaxed">
              Post your images. Let AI roast your aura. Vote on the best vibes.
              Join communities and build your reputation in the most
              unhinged rating platform on the internet.
            </p>

            <div className="flex gap-3 mt-8">
              <Link
                href={user ? "/feed" : "/auth"}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-aura-purple to-aura-accent rounded-xl font-semibold text-white hover:brightness-110 transition-all animate-pulse-glow"
              >
                {user ? "Browse Feed" : "Get Started"} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/feed"
                className="flex items-center gap-2 px-6 py-3 border border-aura-border rounded-xl font-semibold text-aura-text hover:bg-aura-card transition-all"
              >
                Explore
              </Link>
            </div>
          </div>

          {/* Right - 3D Spline Scene */}
          <div className="flex-1 relative hidden md:block">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </Card>

      {/* ContainerScroll Feature Showcase */}
      <section className="py-8">
        <ContainerScroll
          titleComponent={
            <div className="text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-aura-text mb-4">
                Experience the <span className="text-gradient">Future</span> of Social
              </h2>
              <p className="text-aura-muted max-w-2xl mx-auto">
                A full-stack distributed system with async AI workers, real-time scoring,
                and a community-driven feed algorithm.
              </p>
            </div>
          }
        >
          <div className="h-full w-full rounded-2xl bg-gradient-to-br from-aura-card to-aura-bg p-8 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
              {[
                { icon: <Brain className="w-8 h-8" />, color: "text-yellow-400", title: "AI Vision", desc: "GPT-4 powered image analysis" },
                { icon: <TrendingUp className="w-8 h-8" />, color: "text-aura-purple", title: "Hot Algorithm", desc: "Time-decay scoring R = (U-D)/(T+2)^1.8" },
                { icon: <MessageSquare className="w-8 h-8" />, color: "text-aura-accent", title: "Nested Threads", desc: "Infinite depth comments" },
                { icon: <Shield className="w-8 h-8" />, color: "text-emerald-400", title: "Async Queue", desc: "RabbitMQ + Worker pipeline" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-xl bg-aura-bg/80 border border-aura-border hover:border-aura-border-hover transition-all">
                  <span className={item.color}>{item.icon}</span>
                  <h3 className="font-bold text-aura-text mt-3">{item.title}</h3>
                  <p className="text-sm text-aura-muted mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* BentoGrid Features */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-aura-text mb-4">
            Everything You Need
          </h2>
          <p className="text-aura-muted max-w-2xl mx-auto">
            Full Reddit-style features with AI superpowers.
          </p>
        </div>

        <BentoGrid>
          {bentoFeatures.map((feature, idx) => (
            <BentoCard key={idx} {...feature} />
          ))}
        </BentoGrid>
      </section>

      {/* DisplayCards Section */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 flex justify-center">
            <DisplayCards cards={featureCards} />
          </div>

          <div className="flex-1 space-y-6">
            {[
              {
                icon: <Brain className="w-5 h-5" />,
                color: "text-yellow-400",
                bg: "bg-yellow-400/10",
                title: "AI-Powered Roasts",
                desc: "Upload any image and our Vision AI rates your aura from 0-100 with a savage one-liner.",
              },
              {
                icon: <Image className="w-5 h-5" />,
                color: "text-aura-purple",
                bg: "bg-aura-purple/10",
                title: "Community Boards",
                desc: "Join themed communities like a/Battlestations, a/Pets, a/Fits, and a/Food.",
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                color: "text-aura-accent",
                bg: "bg-aura-accent/10",
                title: "Hot Feed Algorithm",
                desc: "Posts are ranked using time-decay scoring so fresh content always rises.",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                title: "Async Architecture",
                desc: "Images are processed asynchronously via RabbitMQ workers.",
              },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className={`p-2 rounded-lg ${feature.bg}`}>
                  <span className={feature.color}>{feature.icon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-aura-text">{feature.title}</h3>
                  <p className="text-sm text-aura-muted mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-aura-border">
        <div className="max-w-7xl mx-auto px-8 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to check your aura?</h2>
          <p className="text-aura-muted mb-8 max-w-md mx-auto">
            Join the community. Post your images. Get roasted by AI. It's free and unhinged.
          </p>
          <Link
            href={user ? "/feed" : "/auth"}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-aura-purple to-aura-accent rounded-xl font-bold text-white text-lg hover:brightness-110 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            {user ? "Go to Feed" : "Create Account"}
          </Link>
        </div>
      </section>
    </div>
  );
}
