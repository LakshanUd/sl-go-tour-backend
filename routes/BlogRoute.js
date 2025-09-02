// routes/BlogRoute.js
import express from "express";
import {
  getAllBlogs,
  addBlog,
  getById,
  updateBlog,
  deleteBlog,
} from "../controllers/BlogController.js";

const blogRouter = express.Router();

blogRouter.get("/", getAllBlogs);
blogRouter.post("/", addBlog);
blogRouter.get("/:id", getById);
blogRouter.put("/:id", updateBlog);
blogRouter.delete("/:id", deleteBlog);

export default blogRouter;
