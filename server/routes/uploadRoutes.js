import express from "express";
import multer from "multer";
import { protect } from "../middlewares/auth.js";
import {
  createUpload,
  getAllUploads,
  getUserUploads,
  updateUpload,
  deleteUpload,
  getSubjects,
  getSubjectsList,
  download,
  getInfoFeed,
  getUploadById,
  toggleLike,
  addComment,
  toggleCommentLike,
  addReply,
  editComment,
  deleteComment,
  editReply,
  deleteReply,
  getProjectFeed,
} from "../controllers/uploadController.js";

const router = express.Router();

// Use memoryStorage for Cloudinary uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create upload (supports multiple files with field name "file")
router.post("/", protect, upload.array("file", 10), createUpload);

// Feed (info posts, paginated). Keeps GET "/" as the feed.
router.get("/", protect, getInfoFeed);

// Backwards-compatible: get all uploads (unfiltered)
router.get("/all", protect, getAllUploads);

// route: GET /api/uploads/projects
router.get("/projects", protect, getProjectFeed);

// User uploads
router.get("/my", protect, getUserUploads);

// Dynamic subjects routes
router.get("/subjects", getSubjects); // for autocomplete
router.get("/subjects/list", getSubjectsList); // for SubjectList.jsx display

// Download: keep your existing route and also provide alternate for compatibility
router.get("/download/:id", protect, download);
router.get("/:id/download", protect, download);

// Get single post
router.get("/:id", protect, getUploadById);

// Like / Unlike toggle
router.post("/:id/like", protect, toggleLike);

// Add comment
router.post("/:id/comment", protect, addComment);

// Like/unlike a comment
router.post("/:id/comment/:commentId/like", protect, toggleCommentLike);

// Add a reply to a comment
router.post("/:id/comment/:commentId/reply", protect, addReply);
router.put("/:id/comment/:commentId/reply/:replyId", protect, editReply);
router.delete("/:id/comment/:commentId/reply/:replyId", protect, deleteReply);

// Delete comment (postId in :id, commentId as param)
// comments edit/delete
router.delete("/:id/comment/:commentId", protect, deleteComment);
router.put("/:id/comment/:commentId", protect, editComment);

// Update / Delete upload
router.put("/:id", protect, updateUpload);
router.delete("/:id", protect, deleteUpload);
router.get("/:id", protect, getUploadById);

export default router;
