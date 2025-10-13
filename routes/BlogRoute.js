// routes/BlogRoute.js
import express from "express";
import {
  getAllBlogs,
  addBlog,
  getById,
  incrementViewCount,
  updateBlog,
  deleteBlog,
} from "../controllers/BlogController.js";

const blogRouter = express.Router();

blogRouter.get("/", getAllBlogs);
blogRouter.post("/", addBlog);
blogRouter.get("/:id", getById);
blogRouter.post("/:id/view", incrementViewCount);
blogRouter.put("/:id", updateBlog);
blogRouter.delete("/:id", deleteBlog);

export default blogRouter;
