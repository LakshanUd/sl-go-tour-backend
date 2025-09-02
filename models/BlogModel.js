// models/BlogModel.js  (ESM)
import mongoose from "mongoose";

const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    image: { type: String, default: "" },
    publishedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

// 👇 default export
export default Blog;
