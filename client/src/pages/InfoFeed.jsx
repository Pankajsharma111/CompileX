// InfoFeed.jsx (updated)
// Replace your existing file with this one

import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FilePreview from "../components/FilePreview";

/*
  If you want a demo/test image (optional), use the uploaded file path:
  "/mnt/data/25da4ddd-347a-44ec-b2a8-ba6e8e11d3bc.png"
  (your environment will transform local path to served url as needed)
*/

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

// Facebook-style ThumbsUp (outline when not filled, solid when filled)
const ThumbsUp = ({ filled }) => (
  <svg
    className="w-5 h-5"
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

const InfoFeed = () => {
  const { axios, token, user } = useAppContext();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI maps
  const [openCommentsFor, setOpenCommentsFor] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openReplyFor, setOpenReplyFor] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});

  // edit state for comments/replies
  const [editingCommentFor, setEditingCommentFor] = useState({});
  const [editCommentText, setEditCommentText] = useState({});
  const [editingReplyFor, setEditingReplyFor] = useState({});
  const [editReplyText, setEditReplyText] = useState({});

  // loading guards
  const [postLikeLoading, setPostLikeLoading] = useState({}); // per-post
  const [commentLikeLoading, setCommentLikeLoading] = useState({}); // per-comment

  const meId = user?._id ? String(user._id) : null;

  /* normalize server shapes for safer UI */
  const normalizeComments = (comments = []) =>
    (comments || []).map((c) => {
      const userObj =
        c.user && typeof c.user === "object"
          ? c.user
          : { name: "Unknown", _id: c.user || null };
      const replies = (c.replies || []).map((r) => ({
        ...r,
        user:
          r.user && typeof r.user === "object"
            ? r.user
            : { name: "Unknown", _id: r.user || null },
        likes: r.likes || 0,
      }));
      const likedByUser =
        meId && Array.isArray(c.likedBy)
          ? c.likedBy.map(String).includes(meId)
          : !!c.likedByUser;
      return { ...c, user: userObj, replies, likedByUser, likes: c.likes || 0 };
    });

  const normalizePosts = (postsArr = []) =>
    (postsArr || []).map((p) => {
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

  /* fetch feed from backend */
  const fetchPosts = async () => {
    setLoading(true);
    try {
      if (!axios) throw new Error("axios not available");
      const res = await axios.get("/api/uploads", {
        headers: { Authorization: token },
      });
      const serverPosts = res?.data?.posts ?? [];
      setPosts(normalizePosts(serverPosts));
    } catch (err) {
      console.error("fetchPosts error", err);
      setPosts([]); // keep empty if backend fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line
  }, [meId]);

  const replaceCommentsInPost = (postId, commentsFromServer) => {
    const normalized = normalizeComments(commentsFromServer || []);
    setPosts((prev) =>
      prev.map((p) => (p._id === postId ? { ...p, comments: normalized } : p))
    );
  };

  const replaceSinglePostFromServer = (postId, serverPost) => {
    const normalized = normalizePosts([serverPost])[0];
    setPosts((prev) => prev.map((p) => (p._id === postId ? normalized : p)));
  };

  /* ---------- like a post (optimistic, per-post loading) ---------- */
  const handleLikePost = async (postId) => {
    // prevent double clicks
    setPostLikeLoading((s) => ({ ...s, [postId]: true }));

    // optimistic update
    setPosts((prev) =>
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
          setPosts((prev) =>
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
            setPosts((prev) =>
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
        setPosts((prev) =>
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
      setPosts((prev) =>
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

  /* ---------- comments & replies ---------- */
  const toggleComments = (postId) =>
    setOpenCommentsFor((s) => ({ ...s, [postId]: !s[postId] }));
  const setCommentDraft = (postId, text) =>
    setCommentDrafts((s) => ({ ...s, [postId]: text }));

  const submitComment = async (postId) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;
    // optimistic local append (temporary id)
    const tempComment = {
      _id: `tmp-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      user: { name: user?.name || "You", _id: meId },
      likes: 0,
      likedBy: [],
      replies: [],
      likedByUser: false,
    };
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, comments: [tempComment, ...(p.comments || [])] }
          : p
      )
    );
    setCommentDrafts((s) => ({ ...s, [postId]: "" }));

    try {
      if (!axios) return;
      const res = await axios.post(
        `/api/uploads/${postId}/comment`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchPosts();
    } catch (err) {
      console.error("submitComment error", err);
      fetchPosts();
    }
  };

  const toggleLikeComment = async (postId, commentId) => {
    setCommentLikeLoading((s) => ({ ...s, [commentId]: true }));
    try {
      if (!axios) return;
      const res = await axios.post(
        `/api/uploads/${postId}/comment/${commentId}/like`,
        {},
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchPosts();
    } catch (err) {
      console.error("toggleLikeComment error", err);
      fetchPosts();
    } finally {
      setCommentLikeLoading((s) => ({ ...s, [commentId]: false }));
    }
  };

  const setReplyDraft = (commentId, text) =>
    setReplyDrafts((s) => ({ ...s, [commentId]: text }));

  const submitReply = async (postId, commentId) => {
    const text = (replyDrafts[commentId] || "").trim();
    if (!text) return;
    const tempReply = {
      _id: `tmp-r-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      user: { name: user?.name || "You", _id: meId },
      likes: 0,
    };

    setPosts((prev) =>
      prev.map((p) =>
        p._id !== postId
          ? p
          : {
              ...p,
              comments: (p.comments || []).map((c) =>
                c._id === commentId
                  ? { ...c, replies: [...(c.replies || []), tempReply] }
                  : c
              ),
            }
      )
    );

    setReplyDrafts((s) => ({ ...s, [commentId]: "" }));
    setOpenReplyFor((s) => ({ ...s, [commentId]: false }));

    try {
      if (!axios) return;
      const res = await axios.post(
        `/api/uploads/${postId}/comment/${commentId}/reply`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchPosts();
    } catch (err) {
      console.error("submitReply error", err);
      fetchPosts();
    }
  };

  /* ---------- EDIT & DELETE (frontend calls backend which enforces ownership) ---------- */

  // Comments
  const startEditComment = (commentId, currentText) => {
    setEditingCommentFor((s) => ({ ...s, [commentId]: true }));
    setEditCommentText((s) => ({ ...s, [commentId]: currentText }));
  };
  const cancelEditComment = (commentId) => {
    setEditingCommentFor((s) => ({ ...s, [commentId]: false }));
    setEditCommentText((s) => ({ ...s, [commentId]: "" }));
  };
  const saveEditComment = async (postId, commentId) => {
    const text = (editCommentText[commentId] || "").trim();
    if (!text) return;
    try {
      if (!axios) return;
      const res = await axios.put(
        `/api/uploads/${postId}/comment/${commentId}`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      cancelEditComment(commentId);
    } catch (err) {
      console.error("saveEditComment error", err);
      fetchPosts();
    }
  };

  const removeComment = async (postId, commentId) => {
    if (!confirm("Delete this comment?")) return;
    try {
      if (!axios) return;
      const res = await axios.delete(
        `/api/uploads/${postId}/comment/${commentId}`,
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchPosts();
    } catch (err) {
      console.error("removeComment error", err);
      fetchPosts();
    }
  };

  // Replies
  const startEditReply = (replyId, currentText) => {
    setEditingReplyFor((s) => ({ ...s, [replyId]: true }));
    setEditReplyText((s) => ({ ...s, [replyId]: currentText }));
  };
  const cancelEditReply = (replyId) => {
    setEditingReplyFor((s) => ({ ...s, [replyId]: false }));
    setEditReplyText((s) => ({ ...s, [replyId]: "" }));
  };
  const saveEditReply = async (postId, commentId, replyId) => {
    const text = (editReplyText[replyId] || "").trim();
    if (!text) return;
    try {
      if (!axios) return;
      const res = await axios.put(
        `/api/uploads/${postId}/comment/${commentId}/reply/${replyId}`,
        { text },
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      cancelEditReply(replyId);
    } catch (err) {
      console.error("saveEditReply error", err);
      fetchPosts();
    }
  };

  const removeReply = async (postId, commentId, replyId) => {
    if (!confirm("Delete this reply?")) return;
    try {
      if (!axios) return;
      const res = await axios.delete(
        `/api/uploads/${postId}/comment/${commentId}/reply/${replyId}`,
        { headers: { Authorization: token } }
      );
      if (res.data?.comments) replaceCommentsInPost(postId, res.data.comments);
      else fetchPosts();
    } catch (err) {
      console.error("removeReply error", err);
      fetchPosts();
    }
  };

  /* ---------- render ---------- */
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 pb-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Share Feed</h2>
          {loading && <div className="text-center py-8">Loading...</div>}

          <div className="space-y-6">
            {posts.map((post) => (
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
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {post.message}
                  </p>
                </div>

                {post.files?.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {post.files.map((file, i) => (
                      <FilePreview key={i} file={file} />
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
                    } ${postLikeLoading[post._id] ? "opacity-60 " : ""}`}
                  >
                    <span
                      className={`${
                        post.likedByUser ? "text-blue-600" : "text-gray-700"
                      }`}
                    >
                      <ThumbsUp filled={!!post.likedByUser} />
                    </span>
                    <span>{post.likedByUser ? "Liked" : "Like"}</span>
                    <span
                      className={`text-xs ${
                        post.likedByUser ? "text-blue-500" : "text-gray-500"
                      }`}
                    >
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
                      {(post.comments || []).map((c) => (
                        <div key={c._id} className="mb-2">
                          <div className="flex gap-3 items-start">
                            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center">
                              {c.user?.name?.[0] || "U"}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="text-sm font-semibold text-gray-800">
                                  {c.user?.name || "Unknown"}{" "}
                                  {c.editedAt ? (
                                    <span className="text-xs text-gray-400 ml-1">
                                      (edited)
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {timeAgo(c.createdAt)}
                                </div>
                              </div>

                              {/* comment content / editor */}
                              <div className="mt-2">
                                {!editingCommentFor[c._id] ? (
                                  <div className="bg-gray-100 p-3 rounded-lg text-left">
                                    <div className="text-sm text-gray-700">
                                      {c.text}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-yellow-50 p-3 rounded-lg">
                                    <textarea
                                      value={editCommentText[c._id] || ""}
                                      onChange={(e) =>
                                        setEditCommentText((s) => ({
                                          ...s,
                                          [c._id]: e.target.value,
                                        }))
                                      }
                                      className="w-full p-2 border rounded"
                                      rows={3}
                                    />
                                    <div className="mt-2 flex gap-2">
                                      <button
                                        onClick={() =>
                                          saveEditComment(post._id, c._id)
                                        }
                                        className="px-3 py-1 bg-indigo-600 text-white rounded"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => cancelEditComment(c._id)}
                                        className="px-3 py-1 bg-gray-200 rounded"
                                      >
                                        Cancel
                                      </button>
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
                                  <ThumbsUp filled={!!c.likedByUser} />
                                  <span>Like</span>
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

                                {/* Edit/Delete for comment owner only (UI) */}
                                {meId &&
                                  String(c.user?._id) === String(meId) && (
                                    <>
                                      <button
                                        onClick={() =>
                                          startEditComment(c._id, c.text)
                                        }
                                        className="px-2 py-1 rounded-md hover:bg-gray-100 text-sm"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          removeComment(post._id, c._id)
                                        }
                                        className="px-2 py-1 rounded-md hover:bg-gray-100 text-sm text-red-600"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                              </div>

                              {/* replies */}
                              {openReplyFor[c._id] && (
                                <>
                                  <div className="mt-2 ml-6 space-y-2">
                                    {(c.replies || []).map((r) => (
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
                                              {r.user?.name || "Unknown"}{" "}
                                              {r.editedAt ? (
                                                <span className="text-xs text-gray-400 ml-1">
                                                  (edited)
                                                </span>
                                              ) : null}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                              {timeAgo(r.createdAt)}
                                            </div>
                                          </div>

                                          {!editingReplyFor[r._id] ? (
                                            <div className="text-sm text-gray-700 text-left mt-1">
                                              {r.text}
                                            </div>
                                          ) : (
                                            <div className="mt-1">
                                              <textarea
                                                value={
                                                  editReplyText[r._id] || ""
                                                }
                                                onChange={(e) =>
                                                  setEditReplyText((s) => ({
                                                    ...s,
                                                    [r._id]: e.target.value,
                                                  }))
                                                }
                                                className="w-full p-2 border rounded"
                                                rows={2}
                                              />
                                              <div className="mt-2 flex gap-2">
                                                <button
                                                  onClick={() =>
                                                    saveEditReply(
                                                      post._id,
                                                      c._id,
                                                      r._id
                                                    )
                                                  }
                                                  className="px-3 py-1 bg-indigo-600 text-white rounded"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    cancelEditReply(r._id)
                                                  }
                                                  className="px-3 py-1 bg-gray-200 rounded"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          )}

                                          {/* <div className="text-xs text-gray-400 mt-1">Like ({r.likes || 0})</div> */}

                                          {/* reply owner controls */}
                                          <div className="mt-1 flex gap-2">
                                            {meId &&
                                              String(r.user?._id) ===
                                                String(meId) && (
                                                <>
                                                  <button
                                                    onClick={() =>
                                                      startEditReply(
                                                        r._id,
                                                        r.text
                                                      )
                                                    }
                                                    className="text-sm hover:underline"
                                                  >
                                                    Edit
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      removeReply(
                                                        post._id,
                                                        c._id,
                                                        r._id
                                                      )
                                                    }
                                                    className="text-sm text-red-600 hover:underline"
                                                  >
                                                    Delete
                                                  </button>
                                                </>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
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
                      ))}
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
};

export default InfoFeed;
