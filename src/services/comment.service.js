import prisma from "../utils/prisma.js";

export const commentService = {
  async listMyComments(userId, params = {}) {
    const size = Number(params.size ?? 6);

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
          }
        }
      }
    });

    return {
      items: comments,
      totalCount: comments.length,
      page: 1,
      size,
    };
  }
};
