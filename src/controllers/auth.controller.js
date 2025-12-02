import { authService } from "../services/auth.service.js";

export const authController = {
  async login(req, res) {
    const data = await authService.login(req.body);
    res.json(data);
  },
  async register(req, res) {
    const data = await authService.register(req.body);
    res.status(201).json(data);
  },
  async logout(_, res) {
    res.json({ message: "OK" });
  }
};
