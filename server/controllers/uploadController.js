import Upload from "../models/Upload.js";
import cloudinary from "cloudinary";
import crypto from "crypto";

// Cloudinary Configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility to compute file hash
const computeFileHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

// Helper: upload one buffer to cloudinary returning result
const uploadBufferToCloudinary = (
  buffer,
  originalName,
  resourceType = "auto"
) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      { folder: "compilex_uploads", resource_type: resourceType },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// -------------------- Create Upload (supports multiple files) --------------------
export const createUpload = async (req, res) => {
  try {
    const uploader = req.user;
    const type = req.body.type;

    if (!type) {
      return res
        .status(400)
        .json({ success: false, message: "Upload type is required" });
    }

    const data = {
      type,
      uploadedBy: uploader._id,
      uploadedAt: Date.now(),
      contributors: [uploader._id],
    };

    // Type-specific duplicate checks (preserve your previous logic)
    if (type === "pyp") {
      const existing = await Upload.findOne({
        type,
        subject: req.body.subject?.trim().toLowerCase(),
        branch: req.body.branch,
        semester: Number(req.body.semester),
        year: Number(req.body.year),
      });
      if (existing) {
        if (!existing.contributors.includes(uploader._id)) {
          existing.contributors.push(uploader._id);
          await existing.save();
        }
        return res.status(409).json({
          success: false,
          message: "PYP already exists! You've been added as a contributor.",
        });
      }
    }

    // If files exist → upload each to Cloudinary
    // Note: your multer should supply req.files (array) when using fields/multiple
    if (req.files && req.files.length > 0) {
      data.files = [];
      for (const f of req.files) {
        const isBuffer = !!f.buffer;
        // compute hash if buffer present and only for duplicate detection for notes/pyp
        let fileHash;
        if (isBuffer) {
          fileHash = computeFileHash(f.buffer);
        } else if (f.path) {
          // if disk storage used, you could read the file to compute hash, but skipping here
          fileHash = undefined;
        }

        // Duplicate check for notes (as earlier)
        if (type === "notes" && fileHash) {
          const existingHash = await Upload.findOne({ fileHash });
          if (existingHash) {
            if (!existingHash.contributors.includes(uploader._id)) {
              existingHash.contributors.push(uploader._id);
              await existingHash.save();
            }
            return res.status(409).json({
              success: false,
              message:
                "Duplicate notes detected! You’ve been added as a contributor.",
            });
          }
        }

        // Upload buffer to Cloudinary
        const isImage = f.mimetype && f.mimetype.startsWith("image/");
        const resourceType = isImage ? "image" : "raw";

        const result = isBuffer
          ? await uploadBufferToCloudinary(
              f.buffer,
              f.originalname,
              resourceType
            )
          : await new Promise(async (resolve, reject) => {
              // fallback: if multer stored to disk and provides path
              const stream = cloudinary.v2.uploader.upload_stream(
                { folder: "compilex_uploads", resource_type: resourceType },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              // read from file system stream
              const fs = await import("fs");
              const rs = fs.createReadStream(f.path);
              rs.pipe(stream);
            });

        data.files.push({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          originalName: f.originalname,
          mimeType: f.mimetype,
          resourceType: resourceType,
        });

        // store hash (only store once, last hash will be set)
        if (fileHash) data.fileHash = fileHash;
      }
    }

    // Common fields
    data.title = req.body.title || req.body.subject || "";
    data.description = req.body.description || "";

    // Type-specific fields
    switch (type) {
      case "project":
        data.liveLink = req.body.liveLink || "";
        data.githubLink = req.body.githubLink || "";
        break;

      case "notes":
        data.subject = req.body.subject?.trim().toLowerCase();
        data.branch = req.body.branch;
        data.semester = Number(req.body.semester);
        break;

      case "pyp":
        data.subject = req.body.subject?.trim().toLowerCase();
        data.branch = req.body.branch;
        data.semester = Number(req.body.semester);
        data.year = Number(req.body.year);
        break;

      case "info":
        data.message = req.body.message || "";
        break;

      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid upload type" });
    }

    // Initialize likes/comments if info post
    if (type === "info") {
      data.likes = 0;
      data.likedBy = [];
      data.comments = [];
    }

    const createdUpload = await Upload.create(data);

    // populate uploader info
    const populated = await createdUpload.populate("uploadedBy", "name email");
    res.status(201).json({
      success: true,
      message: "Uploaded successfully!",
      upload: populated,
    });
  } catch (error) {
    console.error("createUpload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Get All Uploads --------------------
export const getAllUploads = async (req, res) => {
  try {
    const uploads = await Upload.find().populate("uploadedBy", "name email");
    res.json({ success: true, uploads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Get Feed (only info posts, sorted; includes likedByUser flag) --------------------
export const getInfoFeed = async (req, res) => {
  try {
    const posts = await Upload.find({ type: "info" })
      .sort({ createdAt: -1 })
      .populate([
        { path: "uploadedBy", select: "name avatar" },
        { path: "comments.user", select: "name avatar" },
        { path: "comments.replies.user", select: "name avatar" },
      ])
      .lean();

    // Optionally ensure likedBy arrays exist on comments/posts for frontend
    const normalized = posts.map((p) => ({
      ...p,
      likedBy: p.likedBy || [],
      likes: p.likes || 0,
      comments: (p.comments || []).map((c) => ({
        ...c,
        likedBy: c.likedBy || [],
        likes: c.likes || 0,
        replies: (c.replies || []).map((r) => ({
          ...r,
          likes: r.likes || 0,
        })),
      })),
    }));

    return res.json({ success: true, posts: normalized });
  } catch (err) {
    console.error("getInfoFeed error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- Get Single Upload (info post) --------------------
export const getUploadById = async (req, res) => {
  try {
    const post = await Upload.findById(req.params.id)
      .populate("uploadedBy", "name avatar")
      .populate("comments.user", "name avatar");

    if (!post)
      return res.status(404).json({ success: false, message: "Not found" });

    const obj = post.toObject();
    obj.likedByUser = post.likedBy
      ? post.likedBy.some((id) => id.equals(req.user._id))
      : false;

    res.json({ success: true, post: obj });
  } catch (error) {
    console.error("getUploadById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Like / Unlike Post (toggle) --------------------
export const toggleLike = async (req, res) => {
  try {
    const post = await Upload.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const userId = req.user._id;
    const already = post.likedBy?.some((id) => id.equals(userId));

    if (already) {
      // unlike
      post.likedBy = post.likedBy.filter((id) => !id.equals(userId));
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      post.likedBy = post.likedBy || [];
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    }

    await post.save();
    return res.json({
      success: true,
      likes: post.likes,
      likedByUser: !already,
    });
  } catch (error) {
    console.error("toggleLike error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// -------------------- Toggle Like on a Comment --------------------
export const toggleCommentLike = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await Upload.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    // toggle likedBy
    comment.likedBy = comment.likedBy || [];
    const already = comment.likedBy.some((id) => String(id) === String(userId));
    if (already) {
      comment.likedBy = comment.likedBy.filter(
        (id) => String(id) !== String(userId)
      );
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likes = (comment.likes || 0) + 1;
    }

    await post.save();

    // return populated comments so frontend can update
    await post.populate([
      { path: "comments.user", select: "name avatar" },
      { path: "comments.replies.user", select: "name avatar" },
    ]);

    return res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("toggleCommentLike error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- Add Comment --------------------
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res
        .status(400)
        .json({ success: false, message: "Comment text required" });

    const post = await Upload.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments = post.comments || [];
    post.comments.push(comment);
    await post.save();

    // populate the newly added comments' user info and return
    await post.populate([
      { path: "comments.user", select: "name avatar" },
      { path: "comments.replies.user", select: "name avatar" },
    ]);
    res.json({ success: true, comments: post.comments });
  } catch (error) {
    console.error("addComment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Add Reply to a Comment --------------------
export const addReply = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim())
      return res
        .status(400)
        .json({ success: false, message: "Reply text required" });

    const post = await Upload.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    comment.replies = comment.replies || [];
    comment.replies.push({
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
    });

    await post.save();

    await post.populate([
      { path: "comments.user", select: "name avatar" },
      { path: "comments.replies.user", select: "name avatar" },
    ]);

    return res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("addReply error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- Delete Comment (only by comment owner or post owner) --------------------
// DELETE /api/uploads/:id/comment/:commentId
export const deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const post = await Upload.findById(postId); // DO NOT use .lean() here
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    // find comment (can be plain object or subdoc)
    const comment = (post.comments || []).find(
      (c) => String(c._id) === String(commentId)
    );
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    const uid = String(req.user._id);
    if (String(comment.user) !== uid && String(post.uploadedBy) !== uid) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to delete comment" });
    }

    // remove by filtering — works whether comment is subdoc or plain object
    post.comments = (post.comments || []).filter(
      (c) => String(c._id) !== String(commentId)
    );
    await post.save();

    // populate before returning so frontend receives names
    await post.populate("comments.user", "name avatar");
    await post.populate("comments.replies.user", "name avatar");

    return res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("deleteComment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/uploadController.js
// add these functions (make sure Upload model is imported)

//
// Edit a comment (only comment owner allowed)
// PUT /api/uploads/:id/comment/:commentId
//
export const editComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ success: false, message: "Text required" });

    const post = await Upload.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    // only comment owner can edit
    if (String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment",
      });
    }

    comment.text = text.trim();
    comment.editedAt = new Date();
    await post.save();

    // populate before returning so frontend immediately sees names
    await post.populate([
      { path: "comments.user", select: "name avatar" },
      { path: "comments.replies.user", select: "name avatar" },
    ]);

    return res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("editComment error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//
// Edit a reply (only reply owner)
// PUT /api/uploads/:id/comment/:commentId/reply/:replyId
//
export const editReply = async (req, res) => {
  try {
    const { id: postId, commentId, replyId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ success: false, message: "Text required" });

    const post = await Upload.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply)
      return res
        .status(404)
        .json({ success: false, message: "Reply not found" });

    // only reply owner can edit
    if (String(reply.user) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to edit this reply" });
    }

    reply.text = text.trim();
    reply.editedAt = new Date();
    await post.save();

    await post.populate([
      { path: "comments.user", select: "name avatar" },
      { path: "comments.replies.user", select: "name avatar" },
    ]);

    return res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("editReply error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//
// Delete a reply (only reply owner OR post owner allowed)
// DELETE /api/uploads/:id/comment/:commentId/reply/:replyId
//
// DELETE /api/uploads/:id/comment/:commentId/reply/:replyId
export const deleteReply = async (req, res) => {
  try {
    const { id: postId, commentId, replyId } = req.params;
    const post = await Upload.findById(postId); // DO NOT use .lean()
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });

    const comment = (post.comments || []).find(
      (c) => String(c._id) === String(commentId)
    );
    if (!comment)
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });

    const reply = (comment.replies || []).find(
      (r) => String(r._id) === String(replyId)
    );
    if (!reply)
      return res
        .status(404)
        .json({ success: false, message: "Reply not found" });

    const uid = String(req.user._id);
    // allow reply owner or post owner to delete
    if (String(reply.user) !== uid && String(post.uploadedBy) !== uid) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to delete reply" });
    }

    // remove reply by filtering
    comment.replies = (comment.replies || []).filter(
      (r) => String(r._id) !== String(replyId)
    );
    // write back the mutated comment array into the post
    post.comments = post.comments.map((c) =>
      String(c._id) === String(commentId) ? comment : c
    );
    await post.save();

    await post.populate("comments.user", "name avatar");
    await post.populate("comments.replies.user", "name avatar");

    return res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("deleteReply error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- Delete Upload (enhanced to remove all Cloudinary files if files array) --------------------
export const deleteUpload = async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload)
      return res
        .status(404)
        .json({ success: false, message: "Upload not found" });

    if (upload.uploadedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // destroy all cloudinary files if present
    if (upload.files && upload.files.length > 0) {
      for (const f of upload.files) {
        if (f.public_id) {
          try {
            await cloudinary.v2.uploader.destroy(f.public_id, {
              resource_type: "auto",
            });
          } catch (err) {
            console.warn(
              "failed to destroy cloudinary file",
              f.public_id,
              err.message
            );
          }
        }
      }
    } else if (upload.file && upload.file.public_id) {
      // backward compatibility for single file `file` field
      try {
        await cloudinary.v2.uploader.destroy(upload.file.public_id, {
          resource_type: "auto",
        });
      } catch (err) {
        console.warn(
          "failed to destroy cloudinary file",
          upload.file.public_id,
          err.message
        );
      }
    }

    await upload.deleteOne();
    res.json({ success: true, message: "Upload deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Download (handles files array or single file) --------------------
export const download = async (req, res) => {
  try {
    const fileDoc = await Upload.findById(req.params.id);
    if (!fileDoc) return res.status(404).send("Not found");

    // prefer first file (for posts with multiple files) else fallback to file
    const file =
      (fileDoc.files && fileDoc.files.length > 0 ? fileDoc.files[0] : null) ||
      fileDoc.file;

    if (!file || !file.url) return res.status(404).send("File url not found");

    const originalName = file.originalName || file.originalname || "download";
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalName}"`
    );
    return res.redirect(file.url);
  } catch (error) {
    console.error("download error:", error);
    res.status(500).send(error.message);
  }
};
// -------------------- Get User Uploads --------------------
export const getUserUploads = async (req, res) => {
  try {
    const uploads = await Upload.find({ uploadedBy: req.user._id });
    res.json({ success: true, uploads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Update Upload --------------------
export const updateUpload = async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload)
      return res
        .status(404)
        .json({ success: false, message: "Upload not found" });

    if (upload.uploadedBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    Object.assign(upload, req.body);
    const updatedUpload = await upload.save();
    res.json({
      success: true,
      message: "Upload updated",
      upload: updatedUpload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- Get Subjects for Autocomplete --------------------
export const getSubjects = async (req, res) => {
  try {
    const { branch, semester, q } = req.query;
    const filter = { branch, semester: Number(semester) };

    let subjects = await Upload.distinct("subject", filter);

    if (q) {
      const regex = new RegExp(q, "i");
      subjects = subjects.filter((s) => regex.test(s));
    }

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- Get Subjects List for SubjectList.jsx --------------------
export const getSubjectsList = async (req, res) => {
  try {
    const { branch, semester } = req.query;

    const subjects = await Upload.aggregate([
      {
        $match: {
          branch,
          semester: Number(semester),
          type: { $in: ["notes", "pyp"] },
        },
      },
      {
        $unwind: "$files",
      },
      {
        $group: {
          _id: "$subject",
          items: {
            $push: {
              uploadId: "$_id",          // 🔥 VERY IMPORTANT
              type: "$type",
              year: "$year",
              originalName: "$files.originalName",
              url: "$files.url",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          notes: {
            $filter: {
              input: "$items",
              as: "i",
              cond: { $eq: ["$$i.type", "notes"] },
            },
          },
          pyp: {
            $filter: {
              input: "$items",
              as: "i",
              cond: { $eq: ["$$i.type", "pyp"] },
            },
          },
        },
      },
    ]);

    res.json(subjects);
  } catch (error) {
    console.error("getSubjectsList error:", error);
    res.status(500).json({ message: "Failed to load subjects" });
  }
};


// Add this export near other exports (top of file already imports Upload model)
export const getProjectFeed = async (req, res) => {
  try {
    const posts = await Upload.find({ type: "project" })
      .sort({ createdAt: -1 })
      .populate([
        { path: "uploadedBy", select: "name avatar" },
        { path: "comments.user", select: "name avatar" },
        { path: "comments.replies.user", select: "name avatar" },
      ])
      .lean();

    // normalize likes/comments fields (safe defaults)
    const normalized = posts.map((p) => ({
      ...p,
      likedBy: p.likedBy || [],
      likes: p.likes || 0,
      comments: (p.comments || []).map((c) => ({
        ...c,
        likedBy: c.likedBy || [],
        likes: c.likes || 0,
        replies: (c.replies || []).map((r) => ({ ...r, likes: r.likes || 0 })),
      })),
    }));

    return res.json({ success: true, posts: normalized });
  } catch (err) {
    console.error("getProjectFeed error", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
