import { Router } from "express";
import { postController } from "../controllers/post.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

//router.get("/", authMiddleware, postController.getPosts);
router.get("/posts", authMiddleware, postController.getPosts);
router.get("/posts/:postId", authMiddleware, postController.getPost);
router.get("/board/:dormId/:category/:postId", authMiddleware, postController.getPost);
router.post("/posts", authMiddleware, postController.createPost);
router.patch("/posts/:postId", authMiddleware, postController.updatePost);
router.delete("/posts/:postId", authMiddleware, postController.deletePost);


export default router;
