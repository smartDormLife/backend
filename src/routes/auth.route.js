import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

router.get("/me", authMiddleware, (req, res) => {
  const user = req.user;
  return res.json({
    name: user.name,
    email: user.email,
    dorm_name: user.dorm?.dorm_name || null,
    room_no: user.room_no,
    phone: user.phone
  });
});

export default router;
