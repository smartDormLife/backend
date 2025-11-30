import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.get("/me", authMiddleware, userController.getMe);
router.get("/me/posts", authMiddleware, userController.getMyPosts);
router.get("/me/comments", authMiddleware, userController.getMyComments);
router.get("/me/parties", authMiddleware, userController.getMyParties);
router.patch("/me", authMiddleware, userController.updateMe);

export default router;
