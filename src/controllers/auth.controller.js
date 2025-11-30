import { authService } from "../services/auth.service.js";

export const authController = {
  register: async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};
