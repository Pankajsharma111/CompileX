// src/pages/ProjectVerse.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAppContext } from "../context/AppContext";

// timeAgo helper
function timeAgo(input) {
  if (!input) return "";
  const date = new Date(input);
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

// ThumbsUp icon
const ThumbsUp = ({ filled, className }) => (
  <svg
    className={`w-5 h-5 transform -scale-x-100 ${className || ""}`}
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    role="img"
  >
    {filled ? (
      <path
        d="M2 10h3v8H2V10zM7 10v-4a4 4 0 0 1 4-4h2l1 5h4l-1 8H7z"
        fill="currentColor"
      />
    ) : (
      <path
        d="M2 10h3v8H2V10zM7 10v-4a4 4 0 0 1 4-4h2l1 5h4l-1 8H7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export default function ProjectVerse() {
  const { axios, token, user } = useAppContext();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openCommentsFor, setOpenCommentsFor] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openReplyFor, setOpenReplyFor] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [commentLikeLoading, setCommentLikeLoading] = useState({});
  const [postLikeLoading, setPostLikeLoading] = useState({}); // NEW: per-post like loading
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyText, setEditingReplyText] = useState("");
  const [actionLoading, setActionLoading] = useState({}); // for edit/delete comment/reply

  const meId = user?._id ? String(user._id) : null;

  // normalize helpers (same logic as InfoFeed)
  const normalizeComments = (comments = []) =>
    (comments || []).map((c) => {
      const userObj =
        c.user && typeof c.user === "object" ? c.user : { name: "Unknown" };
      const replies = (c.replies || []).map((r) => ({
        ...r,
        user:
          r.user && typeof r.user === "object" ? r.user : { name: "Unknown" },
        likes: r.likes || 0,
      }));
      const likedByUser =
        meId && Array.isArray(c.likedBy)
          ? c.likedBy.map(String).includes(meId)
          : !!c.likedByUser;
      return { ...c, user: userObj, replies, likedByUser, likes: c.likes || 0 };
    });

  const normalizeProjects = (arr = []) =>
    (arr || []).map((p) => {
      const likedByUser =
        meId && Array.isArray(p.likedBy)
          ? p.likedBy.map(String).includes(meId)
          : !!p.likedByUser;
      return {
        ...p,
        likedByUser,
        likes: p.likes || 0,
        comments: normalizeComments(p.comments || []),
      };
    });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/uploads/projects", {
        headers: { Authorization: token },
      });
      setProjects(normalizeProjects(res.data.posts || res.data.projects || []));
    } catch (err) {
      console.error("fetchProjects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, [user?._id]);

  const replaceCommentsInPost = (postId, commentsFromServer) => {
    const normalized = normalizeComments(commentsFromServer || []);
    setProjects((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, comments: normalized } : p))
    );
  };

  // LIKE A POST (with per-post loading)
  const handleLikePost = async (postId) => {
    // prevent double clicks
    setPostLikeLoading((s) => ({ ...s, [postId]: true }));

    // optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likedByUser: !p.likedByUser,
              likes: p.likedByUser
                ? Math.max(0, p.likes - 1)
                : (p.likes || 0) + 1,
            }
          : p
      )
    );

    try {
      if (!axios) return;
      const res = await axios.post(
        `/api/uploads/${postId}/like`,
        {},
        { headers: { Authorization: token } }
      );

      // merge server truth if provided
      if (res?.data?.success) {
        const { likes, likedByUser, post: returnedPost } = res.data;

        if (
          typeof likes !== "undefined" ||
          typeof likedByUser !== "undefined"
        ) {
          // server returned like + likedByUser directly
          setProjects((prev) =>
            prev.map((p) =>
              p._id === postId
                ? {
                    ...p,
                    likes: typeof likes !== "undefined" ? likes : p.likes,
                    likedByUser:
                      typeof likedByUser === "boolean"
                        ? likedByUser
                        : p.likedByUser,
                  }
                : p
            )
          );
        } else if (returnedPost) {
          // backend returned full post object
          replaceSinglePostFromServer(postId, returnedPost);
        } else {
          // fallback: fetch single post quietly
          try {
            const single = await axios.get(`/api/uploads/${postId}`, {
              headers: { Authorization: token },
            });
            if (single?.data?.post)
              replaceSinglePostFromServer(postId, single.data.post);
          } catch (_e) {
            // revert optimistic update
            setProjects((prev) =>
              prev.map((p) =>
                p._id === postId
                  ? {
                      ...p,
                      likedByUser: !p.likedByUser,
                      likes: p.likedByUser
                        ? Math.max(0, p.likes - 1)
                        : (p.likes || 0) + 1,
                    }
                  : p
              )
            );
          }
        }
      } else {
        // revert optimistic on failure
        setProjects((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  likedByUser: !p.likedByUser,
                  likes: p.likedByUser
                    ? Math.max(0, p.likes - 1)
                    : (p.likes || 0) + 1,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("handleLikePost error", err);

      // revert optimistic on error
      setProjects((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likedByUser: !p.likedByUser,
                likes: p.likedByUser
                  ? Math.max(0, p.likes - 1)
                  : (p.likes || 0) + 1,
              }
            : p
        )
      );
    } finally {
      setPostLikeLoading((s) => ({ ...s, [postId]: false }));
    }
  };

  const toggleComments = (postId) =>
    setOpenCommentsFor((s) => ({ ...s, [postId]: !s[postId] }));
  const setCommentDraft = (postId, text) =>
    setCommentDrafts((s) => ({ ...s, [postId]: text }));

  const submitComment = async (postId) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    try {
      const res = await axios.post(
        `/api/uploads/${postId}/comment`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      setCommentDrafts((s) => ({ ...s, [postId]: "" }));
    } catch (e) {
      console.error("submitComment", e);
      fetchProjects();
    }
  };

  // COMMENT LIKE (existing)
  const toggleLikeComment = async (postId, commentId) => {
    setCommentLikeLoading((s) => ({ ...s, [commentId]: true }));
    try {
      const res = await axios.post(
        `/api/uploads/${postId}/comment/${commentId}/like`,
        {},
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchProjects();
    } catch (e) {
      console.error("toggleLikeComment", e);
      fetchProjects();
    } finally {
      setCommentLikeLoading((s) => ({ ...s, [commentId]: false }));
    }
  };

  const setReplyDraft = (commentId, text) =>
    setReplyDrafts((s) => ({ ...s, [commentId]: text }));

  const submitReply = async (postId, commentId) => {
    const text = (replyDrafts[commentId] || "").trim();
    if (!text) return;
    try {
      const res = await axios.post(
        `/api/uploads/${postId}/comment/${commentId}/reply`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      setReplyDrafts((s) => ({ ...s, [commentId]: "" }));
      setOpenReplyFor((s) => ({ ...s, [commentId]: false }));
    } catch (e) {
      console.error("submitReply", e);
      fetchProjects();
    }
  };

  // ---------- Comment edit / delete handlers ----------
  const startEditComment = (commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText || "");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveEditComment = async (postId, commentId) => {
    const text = (editingCommentText || "").trim();
    if (!text) return;
    setActionLoading((s) => ({ ...s, [`editComment:${commentId}`]: true }));
    try {
      const res = await axios.put(
        `/api/uploads/${postId}/comment/${commentId}`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      cancelEditComment();
    } catch (e) {
      console.error("saveEditComment", e);
      fetchProjects();
    } finally {
      setActionLoading((s) => ({ ...s, [`editComment:${commentId}`]: false }));
    }
  };

  const deleteCommentHandler = async (postId, commentId) => {
    if (!confirm("Delete this comment?")) return;
    setActionLoading((s) => ({ ...s, [`deleteComment:${commentId}`]: true }));
    try {
      const res = await axios.delete(
        `/api/uploads/${postId}/comment/${commentId}`,
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchProjects();
    } catch (e) {
      console.error("deleteCommentHandler", e);
      fetchProjects();
    } finally {
      setActionLoading((s) => ({
        ...s,
        [`deleteComment:${commentId}`]: false,
      }));
    }
  };

  // ---------- Reply edit / delete ----------
  const startEditReply = (replyId, currentText) => {
    setEditingReplyId(replyId);
    setEditingReplyText(currentText || "");
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyText("");
  };

  const saveEditReply = async (postId, commentId, replyId) => {
    const text = (editingReplyText || "").trim();
    if (!text) return;
    setActionLoading((s) => ({ ...s, [`editReply:${replyId}`]: true }));
    try {
      const res = await axios.put(
        `/api/uploads/${postId}/comment/${commentId}/reply/${replyId}`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      cancelEditReply();
    } catch (e) {
      console.error("saveEditReply", e);
      fetchProjects();
    } finally {
      setActionLoading((s) => ({ ...s, [`editReply:${replyId}`]: false }));
    }
  };

  const deleteReplyHandler = async (postId, commentId, replyId) => {
    if (!confirm("Delete this reply?")) return;
    setActionLoading((s) => ({ ...s, [`deleteReply:${replyId}`]: true }));
    try {
      const res = await axios.delete(
        `/api/uploads/${postId}/comment/${commentId}/reply/${replyId}`,
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchProjects();
    } catch (e) {
      console.error("deleteReplyHandler", e);
      fetchProjects();
    } finally {
      setActionLoading((s) => ({ ...s, [`deleteReply:${replyId}`]: false }));
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">ProjectVerse</h2>
          {loading && <div className="text-center py-8">Loading...</div>}

          <div className="space-y-6">
            {projects.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-xl p-4 shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center uppercase">
                    {post.uploadedBy?.name?.[0] || "U"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {post.uploadedBy?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeAgo(post.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  {post.title && (
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {post.title}
                    </h3>
                  )}
                  {post.description && (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {post.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3">
                    {post.liveLink && (
                      <a
                        className="text-sm underline"
                        target="_blank"
                        rel="noreferrer"
                        href={post.liveLink}
                      >
                        Live
                      </a>
                    )}
                    {post.githubLink && (
                      <a
                        className="text-sm underline"
                        target="_blank"
                        rel="noreferrer"
                        href={post.githubLink}
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>

                {post.files?.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {post.files.map((f, i) => (
                      <img
                        key={i}
                        src={f.url}
                        alt={f.originalName || `img-${i}`}
                        className="w-full h-44 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 border-t pt-3">
                  <button
                    onClick={() => handleLikePost(post._id)}
                    disabled={!!postLikeLoading[post._id]}
                    className={`flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-md ${
                      post.likedByUser
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {/* show small spinner when loading */}
                    {postLikeLoading[post._id] ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          opacity="0.2"
                        />
                        <path
                          d="M22 12a10 10 0 00-10-10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    ) : (
                      <ThumbsUp filled={post.likedByUser} />
                    )}
                    <span>Like</span>
                    <span className="text-xs text-gray-500">
                      ({post.likes || 0})
                    </span>
                  </button>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className="text-sm text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
                  >
                    Comment{" "}
                    <span className="text-xs text-gray-500">
                      ({(post.comments || []).length})
                    </span>
                  </button>
                </div>

                {openCommentsFor[post._id] && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                        {user?.name?.[0] || "Y"}
                      </div>
                      <input
                        value={commentDrafts[post._id] || ""}
                        onChange={(e) =>
                          setCommentDraft(post._id, e.target.value)
                        }
                        placeholder="Add a comment..."
                        className="flex-1 border rounded-full px-4 py-2"
                      />
                      <button
                        onClick={() => submitComment(post._id)}
                        disabled={
                          !((commentDrafts[post._id] || "").trim().length > 0)
                        }
                        className={`px-4 py-2 rounded-full ${
                          (commentDrafts[post._id] || "").trim().length > 0
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        Send
                      </button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {(post.comments || []).map((c) => {
                        const isCommentOwner =
                          String(c.user?._id || c.user) === meId;
                        const isPostOwner =
                          String(post.uploadedBy?._id || post.uploadedBy) ===
                          meId;
                        return (
                          <div key={c._id} className="mb-2">
                            <div className="flex gap-3 items-start">
                              <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                                {c.user?.name?.[0] || "U"}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="text-sm font-semibold text-gray-800">
                                    {c.user?.name || "Unknown"}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {timeAgo(c.createdAt)}
                                  </div>
                                </div>

                                {/* comment text or edit textarea */}
                                <div className="mt-2">
                                  {editingCommentId === c._id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editingCommentText}
                                        onChange={(e) =>
                                          setEditingCommentText(e.target.value)
                                        }
                                        className="w-full border rounded p-2"
                                        rows={3}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            saveEditComment(post._id, c._id)
                                          }
                                          disabled={
                                            !!actionLoading[
                                              `editComment:${c._id}`
                                            ]
                                          }
                                          className="px-3 py-1 rounded bg-indigo-600 text-white"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelEditComment}
                                          className="px-3 py-1 rounded bg-gray-200"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-100 p-3 rounded-lg text-left">
                                      <div className="text-sm text-gray-700">
                                        {c.text}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-4 mt-2 ml-1 text-sm text-gray-600">
                                  <button
                                    onClick={() =>
                                      toggleLikeComment(post._id, c._id)
                                    }
                                    disabled={!!commentLikeLoading[c._id]}
                                    className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${
                                      c.likedByUser
                                        ? "text-blue-600"
                                        : "hover:text-gray-800"
                                    }`}
                                  >
                                    <ThumbsUp filled={c.likedByUser} />{" "}
                                    <span>Like</span>{" "}
                                    <span className="text-xs text-gray-400">
                                      ({c.likes || 0})
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      setOpenReplyFor((s) => ({
                                        ...s,
                                        [c._id]: !s[c._id],
                                      }))
                                    }
                                    className="px-2 py-1 rounded-md hover:bg-gray-100"
                                  >
                                    Reply{" "}
                                    <span className="text-xs text-gray-500">
                                      ({(c.replies || []).length})
                                    </span>
                                  </button>

                                  {/* Edit / Delete for comment (edit only by comment owner; delete by comment owner or post owner) */}
                                  {isCommentOwner &&
                                    editingCommentId !== c._id && (
                                      <button
                                        onClick={() =>
                                          startEditComment(c._id, c.text)
                                        }
                                        className="px-2 py-1 rounded-md hover:bg-gray-100 text-sm"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  {(isCommentOwner || isPostOwner) && (
                                    <button
                                      onClick={() =>
                                        deleteCommentHandler(post._id, c._id)
                                      }
                                      disabled={
                                        !!actionLoading[
                                          `deleteComment:${c._id}`
                                        ]
                                      }
                                      className="px-2 py-1 rounded-md hover:bg-gray-100 text-sm text-red-600"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>

                                {/* Replies block */}
                                {openReplyFor[c._id] && (
                                  <>
                                    <div className="mt-2 ml-6 space-y-2">
                                      {(c.replies || []).map((r) => {
                                        const isReplyOwner =
                                          String(r.user?._id || r.user) ===
                                          meId;
                                        // post owner may delete reply per backend; show delete to post owner too
                                        const canDeleteReply =
                                          isReplyOwner || isPostOwner;
                                        return (
                                          <div
                                            key={r._id}
                                            className="flex gap-2 items-start"
                                          >
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                              {r.user?.name?.[0] || "U"}
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-lg flex-1">
                                              <div className="flex items-center justify-between">
                                                <div className="text-sm font-semibold">
                                                  {r.user?.name || "Unknown"}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                  {timeAgo(r.createdAt)}
                                                </div>
                                              </div>

                                              {/* reply text or edit textarea */}
                                              <div className="mt-1">
                                                {editingReplyId === r._id ? (
                                                  <div className="space-y-2">
                                                    <textarea
                                                      value={editingReplyText}
                                                      onChange={(e) =>
                                                        setEditingReplyText(
                                                          e.target.value
                                                        )
                                                      }
                                                      className="w-full border rounded p-2"
                                                      rows={2}
                                                    />
                                                    <div className="flex gap-2">
                                                      <button
                                                        onClick={() =>
                                                          saveEditReply(
                                                            post._id,
                                                            c._id,
                                                            r._id
                                                          )
                                                        }
                                                        disabled={
                                                          !!actionLoading[
                                                            `editReply:${r._id}`
                                                          ]
                                                        }
                                                        className="px-3 py-1 rounded bg-indigo-600 text-white"
                                                      >
                                                        Save
                                                      </button>
                                                      <button
                                                        onClick={
                                                          cancelEditReply
                                                        }
                                                        className="px-3 py-1 rounded bg-gray-200"
                                                      >
                                                        Cancel
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="text-sm text-gray-700 text-left mt-1">
                                                    {r.text}
                                                  </div>
                                                )}
                                              </div>

                                              <div className="flex items-center gap-3 mt-2">
                                                {/* edit / delete controls for reply */}
                                                {isReplyOwner &&
                                                  editingReplyId !== r._id && (
                                                    <button
                                                      onClick={() =>
                                                        startEditReply(
                                                          r._id,
                                                          r.text
                                                        )
                                                      }
                                                      className="px-2 py-1 rounded-md hover:bg-gray-100 text-sm"
                                                    >
                                                      Edit
                                                    </button>
                                                  )}
                                                {canDeleteReply && (
                                                  <button
                                                    onClick={() =>
                                                      deleteReplyHandler(
                                                        post._id,
                                                        c._id,
                                                        r._id
                                                      )
                                                    }
                                                    disabled={
                                                      !!actionLoading[
                                                        `deleteReply:${r._id}`
                                                      ]
                                                    }
                                                    className="px-2 py-1 rounded-md hover:bg-gray-100 text-sm text-red-600"
                                                  >
                                                    Delete
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    <div className="flex items-center gap-3 mt-2 ml-6">
                                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                                        {user?.name?.[0] || "Y"}
                                      </div>
                                      <input
                                        value={replyDrafts[c._id] || ""}
                                        onChange={(e) =>
                                          setReplyDrafts((s) => ({
                                            ...s,
                                            [c._id]: e.target.value,
                                          }))
                                        }
                                        placeholder={`Reply to ${
                                          c.user?.name || "comment"
                                        }`}
                                        className="flex-1 border rounded-full px-4 py-2"
                                      />
                                      <button
                                        onClick={() =>
                                          submitReply(post._id, c._id)
                                        }
                                        disabled={
                                          !(
                                            (replyDrafts[c._id] || "").trim()
                                              .length > 0
                                          )
                                        }
                                        className={`px-4 py-2 rounded-full ${
                                          (replyDrafts[c._id] || "").trim()
                                            .length > 0
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-200 text-gray-400"
                                        }`}
                                      >
                                        Send
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
