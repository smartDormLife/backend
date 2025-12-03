import { commentService } from "../services/comment.service.js";
import prisma from "../utils/prisma.js";

export const commentController = {
  async myComments(req, res) {
    try {
      const userId = req.user?.user_id;
      const size = Number(req.query.size ?? 10);

      const comments = await prisma.comment.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: size,
        include: {
          post: {
            select: {
              post_id: true,
              title: true,
              category: true,
              dorm_id: true,
              dorm: true,
            },
          },
        },
      });

      return res.json({
        items: comments,
        totalCount: comments.length,
        page: 1,
        size,
      });
    } catch (err) {
      console.error("myComments ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },

  async remove(req, res) {
    try {
      const commentId = Number(req.params.commentId);
      const userId = req.user?.user_id;

      // 1) 댓글 존재 여부 확인
      const comment = await prisma.comment.findUnique({
        where: { comment_id: commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // 2) 삭제 권한 체크 (본인 댓글만 삭제 가능)
      if (comment.user_id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // 3) 삭제 수행
      await prisma.comment.delete({
        where: { comment_id: commentId },
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("removeComment ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },
};