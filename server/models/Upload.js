import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  mimeType: String,
  size: Number,
  url: String,
  public_id: String,
  format: String,
  bytes: Number,
});

// Reply schema for nested replies under a comment
const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

// Comment schema (now supports likes and replies)
const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  replies: [ReplySchema],
});

const UploadSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["project", "notes", "pyp", "info"],
      required: true,
    },
    title: String,
    description: String,
    // for info posts:
    message: String,
    files: [FileSchema],

    // Like system for the post itself
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // comments (with replies & comment-likes supported)
    comments: [CommentSchema],

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // existing fields
    liveLink: String,
    githubLink: String,
    subject: String,
    branch: String,
    semester: Number,
    year: Number,

    // duplicate helpers
    fileHash: String,
    contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Upload = mongoose.model("Upload", UploadSchema);
export default Upload;
