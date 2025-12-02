import { userService } from "../services/user.service.js";

export const userController = {
  async me(req, res) {
    res.json(await userService.me(req.user.user_id));
  },
  async updateMe(req, res) {
    res.json(await userService.updateMe(req.user.user_id, req.body));
  },
  async myPosts(req, res) {
    res.json(await userService.myPosts(req.user.user_id, req.query));
  },
  async myParties(req, res) {
    res.json(await userService.myParties(req.user.user_id));
  }
};
