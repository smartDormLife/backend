import { Router } from "express";
import { partyController } from "../controllers/party.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

router.post("/:partyId/join", authMiddleware, partyController.join);
router.delete("/:partyId/leave", authMiddleware, partyController.leave);
router.get("/:partyId", authMiddleware, partyController.detail);

export default router;
