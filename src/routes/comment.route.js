import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  extractDormIdMiddleware,
  dormAccessMiddleware
} from "../middlewares/dorm.middleware.js";
import * as commentController from "../controllers/comment.controller.js";

const router = Router();

// 댓글 목록
router.get(
  "/comments",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  commentController.getComments
);

// 댓글 작성
router.post(
  "/comments",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  commentController.createComment
);

// 댓글 삭제
router.delete(
  "/comments/:commentId",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  commentController.deleteComment
);

export default router;
