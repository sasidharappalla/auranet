/**
 * API client for AuraNet backend.
 * Wraps axios with auth token injection.
 */

import axios from "axios";

// In production behind Nginx, use relative URLs (empty string).
// In dev, point to the backend container directly.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
});

// Inject JWT token into every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auranet_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────

export async function register(username: string, email: string, password: string) {
  const { data } = await api.post("/api/users/register", { username, email, password });
  return data;
}

export async function login(username: string, password: string) {
  const { data } = await api.post("/api/users/login", { username, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get("/api/users/me");
  return data;
}

// ── Profile ──────────────────────────────────────────────

export async function getUserProfile(username: string) {
  const { data } = await api.get(`/api/profile/${username}`);
  return data;
}

export async function getUserPosts(username: string) {
  const { data } = await api.get(`/api/profile/${username}/posts`);
  return data;
}

export async function updateProfile(payload: {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
}) {
  const { data } = await api.put("/api/profile/settings", payload);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.put("/api/profile/settings/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}

// ── Communities ───────────────────────────────────────────

export async function getCommunities() {
  const { data } = await api.get("/api/communities/");
  return data;
}

export async function getCommunity(name: string) {
  const { data } = await api.get(`/api/communities/${name}`);
  return data;
}

export async function joinCommunity(name: string) {
  const { data } = await api.post(`/api/communities/${name}/members/join`);
  return data;
}

export async function leaveCommunity(name: string) {
  const { data } = await api.delete(`/api/communities/${name}/members/leave`);
  return data;
}

export async function getMembershipStatus(name: string) {
  const { data } = await api.get(`/api/communities/${name}/members/status`);
  return data;
}

// ── Posts ─────────────────────────────────────────────────

export async function getHotPosts(community?: string) {
  const params = community ? { community } : {};
  const { data } = await api.get("/api/posts/hot", { params });
  return data;
}

export async function getNewPosts(community?: string) {
  const params = community ? { community } : {};
  const { data } = await api.get("/api/posts/new", { params });
  return data;
}

export async function getPost(postId: string) {
  const { data } = await api.get(`/api/posts/${postId}`);
  return data;
}

export async function createPost(formData: FormData) {
  const { data } = await api.post("/api/posts/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deletePost(postId: string) {
  const { data } = await api.delete(`/api/posts/${postId}`);
  return data;
}

// ── Comments ──────────────────────────────────────────────

export async function getComments(postId: string) {
  const { data } = await api.get(`/api/posts/${postId}/comments/`);
  return data;
}

export async function createComment(postId: string, content: string, parentId?: string) {
  const { data } = await api.post(`/api/posts/${postId}/comments/`, {
    content,
    parent_comment_id: parentId || null,
  });
  return data;
}

export async function editComment(postId: string, commentId: string, content: string) {
  const { data } = await api.put(`/api/posts/${postId}/comments/${commentId}`, { content });
  return data;
}

export async function deleteComment(postId: string, commentId: string) {
  const { data } = await api.delete(`/api/posts/${postId}/comments/${commentId}`);
  return data;
}

// ── Votes ─────────────────────────────────────────────────

export async function voteOnPost(postId: string, direction: number) {
  const { data } = await api.post(`/api/posts/${postId}/vote/`, {
    vote_direction: direction,
  });
  return data;
}

export async function voteOnComment(commentId: string, direction: number) {
  const { data } = await api.post(`/api/comments/${commentId}/vote/`, {
    vote_direction: direction,
  });
  return data;
}

// ── Saved Posts ───────────────────────────────────────────

export async function getSavedPosts() {
  const { data } = await api.get("/api/saved/");
  return data;
}

export async function savePost(postId: string) {
  const { data } = await api.post(`/api/saved/${postId}`);
  return data;
}

export async function unsavePost(postId: string) {
  const { data } = await api.delete(`/api/saved/${postId}`);
  return data;
}

// ── Notifications ────────────────────────────────────────

export async function getNotifications(unreadOnly = false) {
  const { data } = await api.get("/api/notifications/", { params: { unread_only: unreadOnly } });
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get("/api/notifications/count");
  return data;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.put(`/api/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.put("/api/notifications/read-all");
  return data;
}

export async function clearNotifications() {
  const { data } = await api.delete("/api/notifications/clear");
  return data;
}

// ── Search ────────────────────────────────────────────────

export async function searchAll(query: string, type = "all") {
  const { data } = await api.get("/api/search/", { params: { q: query, type } });
  return data;
}

// ── Reports ───────────────────────────────────────────────

export async function createReport(payload: {
  post_id?: string;
  comment_id?: string;
  reported_user?: string;
  reason: string;
  description?: string;
}) {
  const { data } = await api.post("/api/reports", payload);
  return data;
}

// ── Mod Actions ───────────────────────────────────────────

export async function createModAction(payload: {
  action_type: string;
  target_post?: string;
  target_comment?: string;
  target_user?: string;
  reason?: string;
}) {
  const { data } = await api.post("/api/mod/actions", payload);
  return data;
}

export default api;
