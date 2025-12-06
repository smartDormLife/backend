import { Router } from "express";
import { chatController } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.get("/rooms", authMiddleware, chatController.listRooms);

router.get("/rooms/:roomId", authMiddleware, chatController.getRoomDetail);

router.post("/rooms", authMiddleware, chatController.createRoom);

router.get(
  "/rooms/:roomId/messages",
  authMiddleware,
  chatController.getMessages
);

router.post(
  "/rooms/:roomId/messages",
  authMiddleware,
  chatController.sendMessage
);

router.get("/rooms/:roomId/members", authMiddleware, chatController.getMembers);

router.post(
  "/rooms/:roomId/read",
  authMiddleware,
  chatController.markAsRead
);

export default router;
