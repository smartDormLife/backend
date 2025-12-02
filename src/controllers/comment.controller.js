import { commentService } from "../services/comment.service.js";

export const commentController = {
  remove: (req, res) =>
    commentService.remove(req.user.user_id, Number(req.params.commentId))
      .then(() => res.status(204).send())
};
