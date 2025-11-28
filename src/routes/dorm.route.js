import { Router } from "express";
import * as dormController from "../controllers/dorm.controller.js";

const router = Router();

router.get("/dormitories", dormController.getDorms);

export default router;
