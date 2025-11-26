import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  extractDormIdMiddleware,
  dormAccessMiddleware
} from "../middlewares/dorm.middleware.js";
import * as partyController from "../controllers/party.controller.js";

const router = Router();

router.post(
  "/parties/:partyId/join",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  partyController.joinParty
);

router.delete(
  "/parties/:partyId/leave",
  authMiddleware,
  extractDormIdMiddleware,
  dormAccessMiddleware,
  partyController.leaveParty
);

export default router;
