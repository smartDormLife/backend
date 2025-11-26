import commentService from "../services/comment.service.js";

export async function getComments(req, res) {
  try {
    const postId = Number(req.query.post_id);
    const result = await commentService.getComments(postId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createComment(req, res) {
  try {
    const userId = req.user.user_id;
    const result = await commentService.createComment(userId, req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteComment(req, res) {
  try {
    const commentId = Number(req.params.commentId);
    const userId = req.user.user_id;
    const result = await commentService.deleteComment(commentId, userId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status ?? 500).json({ message: err.message });
  }
}
