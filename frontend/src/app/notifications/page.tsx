"use client";

import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Bell, Check, CheckCheck, Trash2, MessageSquare, ArrowUp, Award, Users } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const ICON_MAP: Record<string, any> = {
  comment_reply: MessageSquare,
  post_vote: ArrowUp,
  comment_vote: ArrowUp,
  ai_complete: Award,
  community_join: Users,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!user) return;
    loadNotifications();
  }, [user, filter]);

  async function loadNotifications() {
    try {
      const data = await getNotifications(filter === "unread");
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleClear() {
    await clearNotifications();
    setNotifications((prev) => prev.filter((n) => !n.is_read));
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-aura-bg flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-12 h-12 text-aura-muted mx-auto mb-4" />
          <p className="text-aura-muted mb-4">Sign in to view your notifications</p>
          <Link href="/auth" className="text-aura-purple hover:underline">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aura-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-aura-text flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-aura-card border border-aura-border hover:border-aura-border-hover text-aura-muted transition-all"
            >
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-aura-card border border-aura-border hover:border-aura-border-hover text-aura-muted transition-all"
            >
              <Trash2 className="w-3 h-3" /> Clear read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-6">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                filter === f
                  ? "bg-aura-purple/20 text-aura-purple"
                  : "text-aura-muted hover:bg-aura-card"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="loader" /></div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-aura-muted/30 mx-auto mb-4" />
            <p className="text-aura-muted">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const IconComponent = ICON_MAP[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    n.is_read
                      ? "bg-aura-card/50 border-aura-border"
                      : "bg-aura-card border-aura-purple/30"
                  }`}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${n.is_read ? "bg-aura-bg" : "bg-aura-purple/10"}`}>
                    <IconComponent className={`w-4 h-4 ${n.is_read ? "text-aura-muted" : "text-aura-purple"}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.is_read ? "text-aura-muted" : "text-aura-text"}`}>
                      {n.actor_username && (
                        <Link href={`/user/${n.actor_username}`} className="font-semibold hover:text-aura-purple">
                          {n.actor_username}
                        </Link>
                      )}{" "}
                      {n.message}
                    </p>
                    <p className="text-xs text-aura-muted mt-1">{dayjs(n.created_at).fromNow()}</p>
                  </div>

                  {/* Unread dot */}
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-aura-purple mt-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
