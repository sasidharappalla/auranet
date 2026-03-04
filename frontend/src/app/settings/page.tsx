"use client";

import { useState } from "react";
import { updateProfile, changePassword } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Settings, User, Lock, Save, Check } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, setAuth } = useAuth();
  const [tab, setTab] = useState<"profile" | "account">("profile");

  // Profile form
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(user?.banner_url || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-aura-bg flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-12 h-12 text-aura-muted mx-auto mb-4" />
          <p className="text-aura-muted mb-4">Sign in to access settings</p>
          <Link href="/auth" className="text-aura-purple hover:underline">Sign in</Link>
        </div>
      </div>
    );
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const updated = await updateProfile({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl || undefined,
        banner_url: bannerUrl || undefined,
      });
      setAuth(updated, localStorage.getItem("auranet_token") || "");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-aura-bg">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-aura-text flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6" /> Settings
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          <button
            onClick={() => setTab("profile")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === "profile"
                ? "bg-aura-purple/20 text-aura-purple"
                : "text-aura-muted hover:bg-aura-card"
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => setTab("account")}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              tab === "account"
                ? "bg-aura-purple/20 text-aura-purple"
                : "text-aura-muted hover:bg-aura-card"
            }`}
          >
            <Lock className="w-4 h-4" /> Account
          </button>
        </div>

        {/* Profile Settings */}
        {tab === "profile" && (
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="p-6 bg-aura-card border border-aura-border rounded-xl space-y-5">
              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={100}
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-lg text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-purple transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-lg text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-purple transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Avatar URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-lg text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-purple transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Banner URL</label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-lg text-aura-text placeholder-aura-muted focus:outline-none focus:border-aura-purple transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-aura-purple rounded-lg text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {profileSaved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> {profileSaving ? "Saving..." : "Save Changes"}</>
              )}
            </button>
          </form>
        )}

        {/* Account Settings */}
        {tab === "account" && (
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="p-6 bg-aura-card border border-aura-border rounded-xl space-y-5">
              <h3 className="text-lg font-semibold text-aura-text">Change Password</h3>

              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-lg text-aura-text focus:outline-none focus:border-aura-purple transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-lg text-aura-text focus:outline-none focus:border-aura-purple transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-aura-text mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-aura-bg border border-aura-border rounded-lg text-aura-text focus:outline-none focus:border-aura-purple transition-colors"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-aura-purple rounded-lg text-white font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {passwordSaved ? (
                <><Check className="w-4 h-4" /> Changed!</>
              ) : (
                <><Lock className="w-4 h-4" /> {passwordSaving ? "Changing..." : "Change Password"}</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
