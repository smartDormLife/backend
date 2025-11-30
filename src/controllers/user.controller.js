import { userService } from "../services/user.service.js";

export const userController = {
  getMe: async (req, res, next) => {
    try {
      const user = await userService.getMe(req.user.user_id);
      return res.json(user);
    } catch (e) {
      next(e);
    }
  },

  updateMe: async (req, res, next) => {
    try {
      const updated = await userService.updateMe(req.user.user_id, req.body);
      return res.json(updated);
    } catch (e) {
      next(e);
    }
  },

  getMyPosts: async (req, res, next) => {
    try {
      const posts = await userService.getMyPosts(req.user.user_id);
      return res.json(posts);
    } catch (e) {
      next(e);
    }
  },

  getMyParties: async (req, res, next) => {
    try {
      const parties = await userService.getMyParties(req.user.user_id);
      return res.json(parties);
    } catch (e) {
      next(e);
    }
  }
};
