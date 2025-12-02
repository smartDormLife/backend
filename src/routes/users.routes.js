import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/me", authMiddleware, userController.me);
router.patch("/me", authMiddleware, userController.updateMe);
router.get("/me/posts", authMiddleware, userController.myPosts);
router.get("/me/parties", authMiddleware, userController.myParties);

export default router;
