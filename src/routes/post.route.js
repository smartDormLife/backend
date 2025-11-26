import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  extractDormIdMiddleware,
  dormAccessMiddleware
} from "../middlewares/dorm.middleware.js";
import * as postController from "../controllers/post.controller.js";

const router = Router();

//recent posts
router.get(
  "/posts/recent",
  authMiddleware,
  postController.getRecentPosts
);

//list
router.get(
  "/posts",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  postController.getPosts
);

//detail
router.get(
  "/posts/:postId",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  postController.getPostDetail
);

//create
router.post(
  "/posts",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  postController.createPost
);

//patch
router.patch(
  "/posts/:postId",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  postController.updatePost
);

//delete
router.delete(
  "/posts/:postId",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  postController.deletePost
);

router.get(
  "/posts/:postId",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  postController.getPostDetail
);



export default router;
