// models/ReportModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/** Lightweight event for blog reads. Optional but enables “most/least read blog”. */
const blogReadSchema = new Schema(
  {
    blog: { type: Schema.Types.ObjectId, ref: "Blog", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    ip:   { type: String },
    ua:   { type: String },
  },
  { timestamps: true }
);

blogReadSchema.index({ createdAt: -1 });

// Guarded compile to avoid OverwriteModelError
const BlogRead = mongoose.models.BlogRead || mongoose.model("BlogRead", blogReadSchema);
export default BlogRead;
