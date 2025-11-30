import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// /users/me
router.get("/me", authMiddleware, userController.getMe);
router.get('/user/me', authMiddleware, userController.getMe)
router.patch("/me", authMiddleware, userController.updateMe);
router.get("/me/posts", authMiddleware, userController.getMyPosts);
router.get("/me/parties", authMiddleware, userController.getMyParties);

export default router;
