import { Router } from "express";
import { dormController } from "../controllers/dorm.controller.js";

const router = Router();

router.get("/", dormController.list);

export default router;
