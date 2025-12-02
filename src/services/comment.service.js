import prisma from "../utils/prisma.js";

export const commentService = {
  async remove(userId, commentId) {
    const comment = await prisma.comment.findUnique({
      where: { comment_id: commentId }
    });

    if (!comment) throw { status: 404, message: "Not found" };
    if (comment.user_id !== userId) throw { status: 403, message: "Forbidden" };

    await prisma.comment.delete({
      where: { comment_id: commentId }
    });
  }
};
