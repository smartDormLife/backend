import { Router } from "express";
import { postController } from "../controllers/post.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/", authMiddleware, (req, res) => {
    if (req.query.category !== 'taxi' && !req.query.dorm_id) {
        req.query.dorm_id = req.user.dorm_id;
    }
    postController.list(req, res);
});
router.get("/recent", authMiddleware, postController.recent);
router.get("/:postId", authMiddleware, postController.detail);

router.post("/", authMiddleware, postController.create);
router.patch("/:postId", authMiddleware, postController.update);
router.delete("/:postId", authMiddleware, postController.remove);

router.get("/:postId/comments", postController.listComments);
router.post("/:postId/comments", authMiddleware, postController.addComment);

export default router;
