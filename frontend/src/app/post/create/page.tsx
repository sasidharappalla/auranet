"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPost, getCommunities } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  ImagePlus, Type, Link2, X, Zap, Users, AlertCircle
} from "lucide-react";

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"post" | "image">("post");

  useEffect(() => {
    if (!user) { router.push("/auth"); return; }
    getCommunities().then((data) => {
      setCommunities(data);
      if (data.length > 0) setCommunityId(data[0].id);
    });
  }, [user, router]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  }

  function removeImage() { setImage(null); setPreview(null); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !communityId) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("title", title);
    formData.append("body", body);
    formData.append("community_id", communityId);
    if (image) formData.append("image", image);
    try {
      const post = await createPost(formData);
      router.push(`/post/${post.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create post");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Create a Post</h1>

      <div className="flex gap-6">
        <div className="flex-1">
          {/* Community selector */}
          <div className="mb-4">
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aura-muted" />
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-64 bg-aura-card border border-aura-border rounded-lg pl-9 pr-4 py-2.5 text-sm
                  focus:border-aura-purple outline-none appearance-none cursor-pointer"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>a/{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Post form */}
          <form onSubmit={handleSubmit} className="bg-aura-card border border-aura-border rounded-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-aura-border">
              {[
                { key: "post" as const, icon: <Type className="w-4 h-4" />, label: "Post" },
                { key: "image" as const, icon: <ImagePlus className="w-4 h-4" />, label: "Image & Media" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 flex-1 px-4 py-3 text-sm font-medium border-b-2 transition ${
                    tab === t.key
                      ? "border-aura-purple text-aura-text"
                      : "border-transparent text-aura-muted hover:text-aura-text hover:bg-aura-bg/30"
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3">
              {/* Title */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-aura-bg border border-aura-border rounded-lg px-4 py-3 text-sm
                    focus:border-aura-purple outline-none transition"
                  required
                  maxLength={300}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-aura-muted">
                  {title.length}/300
                </span>
              </div>

              {/* Body */}
              <textarea
                placeholder="Text (optional)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full bg-aura-bg border border-aura-border rounded-lg px-4 py-3 text-sm
                  focus:border-aura-purple outline-none resize-y min-h-[120px] transition"
              />

              {/* Image upload */}
              {tab === "image" && !preview && (
                <label className="flex flex-col items-center justify-center gap-3 p-8 bg-aura-bg border-2 border-dashed border-aura-border rounded-xl cursor-pointer hover:border-aura-purple transition group">
                  <div className="w-12 h-12 rounded-full bg-aura-purple/10 flex items-center justify-center group-hover:bg-aura-purple/20 transition">
                    <ImagePlus className="w-6 h-6 text-aura-purple" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-aura-text">Drag and drop or click to upload</p>
                    <p className="text-xs text-aura-muted mt-1">Images will be scored by AI for aura points</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}

              {/* Image preview */}
              {preview && (
                <div className="relative rounded-xl overflow-hidden bg-aura-bg border border-aura-border">
                  <img src={preview} alt="Preview" className="w-full max-h-80 object-contain" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black/90 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/70 rounded-full px-3 py-1.5">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs font-medium">AI will score this image</span>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-aura-accent bg-aura-accent/10 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Submit bar */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-aura-border bg-aura-bg/30">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-aura-muted hover:text-aura-text rounded-full transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-6 py-2 bg-gradient-to-r from-aura-purple to-aura-accent rounded-full text-sm font-semibold hover:brightness-110 transition disabled:opacity-50"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Right sidebar — rules */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-aura-card border border-aura-border rounded-xl p-4 sticky top-16">
            <h3 className="flex items-center gap-2 font-bold text-sm mb-3">
              <AlertCircle className="w-4 h-4 text-aura-purple" />
              Posting Rules
            </h3>
            <ol className="space-y-2 text-xs text-aura-muted">
              <li className="flex gap-2"><span className="text-aura-text font-medium">1.</span> Use a descriptive title</li>
              <li className="flex gap-2"><span className="text-aura-text font-medium">2.</span> Upload an image for AI scoring</li>
              <li className="flex gap-2"><span className="text-aura-text font-medium">3.</span> Choose the right community</li>
              <li className="flex gap-2"><span className="text-aura-text font-medium">4.</span> Be original — no reposts</li>
              <li className="flex gap-2"><span className="text-aura-text font-medium">5.</span> Have fun with the vibes</li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
