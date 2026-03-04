"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Sparkles, LogOut, LogIn, Plus, Search,
  Bell, Home, Compass, ChevronDown, User
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <nav className="sticky top-0 z-50 bg-aura-card/95 backdrop-blur-lg border-b border-aura-border">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aura-purple to-aura-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline text-lg font-bold text-gradient">
            AuraNet
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/feed"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-aura-muted hover:text-aura-text hover:bg-aura-bg transition"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link
            href="/feed"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-aura-muted hover:text-aura-text hover:bg-aura-bg transition"
          >
            <Compass className="w-4 h-4" /> Explore
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aura-muted group-focus-within:text-aura-purple transition" />
            <input
              type="text"
              placeholder="Search AuraNet"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-aura-bg border border-aura-border rounded-full px-10 py-1.5 text-sm
                placeholder:text-aura-muted focus:border-aura-purple focus:bg-aura-card outline-none transition-all"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Create Post */}
              <Link
                href="/post/create"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-aura-border rounded-full text-sm
                  text-aura-text hover:border-aura-purple hover:text-aura-purple transition"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </Link>

              {/* Notifications */}
              <button className="relative p-2 rounded-full text-aura-muted hover:text-aura-text hover:bg-aura-bg transition">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-aura-accent rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-aura-bg transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-aura-purple to-aura-accent flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-medium text-aura-text leading-tight">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-aura-muted leading-tight">
                      1 aura
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-aura-muted hidden md:block" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-aura-card border border-aura-border rounded-xl shadow-xl z-50 py-2">
                      <div className="px-4 py-2 border-b border-aura-border">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-aura-purple to-aura-accent flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {user.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">u/{user.username}</p>
                            <p className="text-xs text-aura-muted">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/feed"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-aura-text hover:bg-aura-bg transition"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4 text-aura-muted" /> Profile
                        </Link>
                      </div>
                      <div className="border-t border-aura-border pt-1">
                        <button
                          onClick={() => { logout(); setShowUserMenu(false); }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-aura-accent hover:bg-aura-bg transition w-full text-left"
                        >
                          <LogOut className="w-4 h-4" /> Log Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="px-4 py-1.5 text-sm font-medium text-aura-text border border-aura-border rounded-full hover:border-aura-text transition"
              >
                Log In
              </Link>
              <Link
                href="/auth"
                className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-aura-purple to-aura-accent rounded-full hover:brightness-110 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
