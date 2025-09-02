// controllers/BlogController.js
import Blog from "../models/BlogModel.js"; // change to "../Model/BlogModel.js" if that's your path

// GET /blogs  → list all blogs (latest first)
// Returns 200 with [] if none (frontend-friendly)
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.status(200).json({ blogs });
  } catch (err) {
    console.error("getAllBlogs error:", err);
    return res.status(500).json({ message: "Error fetching blogs" });
  }
};

// POST /blogs  → create a new blog
export const addBlog = async (req, res) => {
  try {
    const { title, content, author, tags, image, publishedDate } = req.body;

    // Basic validation
    if (!title || !content || !author) {
      return res
        .status(400)
        .json({ message: "title, content, and author are required" });
    }

    const blog = await Blog.create({
      title: String(title).trim(),
      content,
      author: String(author).trim(),
      image: image || "",
      // accept tags as CSV string or array
      tags: Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      publishedDate: publishedDate ? new Date(publishedDate) : undefined,
    });

    return res
      .status(201)
      .json({ message: "Blog created successfully", blog });
  } catch (err) {
    console.error("addBlog error:", err);
    return res
      .status(400)
      .json({ message: "Unable to add blog", error: err.message });
  }
};

// GET /blogs/:id  → get one blog
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    return res.status(200).json({ blog });
  } catch (err) {
    console.error("getById error:", err);
    return res
      .status(500)
      .json({ message: "Error fetching blog", error: err.message });
  }
};

// PUT /blogs/:id  → update a blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, tags, image, publishedDate } = req.body;

    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (content !== undefined) update.content = content;
    if (author !== undefined) update.author = String(author).trim();
    if (image !== undefined) update.image = image;
    if (tags !== undefined) {
      update.tags = Array.isArray(tags)
        ? tags.map((t) => String(t).trim()).filter(Boolean)
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
    }
    if (
      publishedDate !== undefined &&
      publishedDate !== null &&
      publishedDate !== ""
    ) {
      update.publishedDate = new Date(publishedDate);
    }

    const blog = await Blog.findByIdAndUpdate(id, update, { new: true });
    if (!blog)
      return res
        .status(404)
        .json({ message: "Blog not found or update failed" });

    return res
      .status(200)
      .json({ message: "Blog updated successfully", blog });
  } catch (err) {
    console.error("updateBlog error:", err);
    return res
      .status(400)
      .json({ message: "Unable to update blog", error: err.message });
  }
};

// DELETE /blogs/:id  → delete a blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog)
      return res
        .status(404)
        .json({ message: "Blog not found or delete failed" });

    return res
      .status(200)
      .json({ message: "Blog deleted successfully", blog });
  } catch (err) {
    console.error("deleteBlog error:", err);
    return res
      .status(400)
      .json({ message: "Unable to delete blog", error: err.message });
  }
};

// Optional: default export for CJS/ESM interop (safe to keep)
export default {
  getAllBlogs,
  addBlog,
  getById,
  updateBlog,
  deleteBlog,
};
