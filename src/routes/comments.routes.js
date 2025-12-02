import { Router } from "express";
import { commentController } from "../controllers/comment.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.delete("/:commentId", authMiddleware, commentController.remove);

export default router;
