import prisma from "../config/prisma.js";

async function getComments(post_id) {
  if (!post_id) {
    const e = new Error("post_id required");
    e.status = 400;
    throw e;
  }

  const comments = await prisma.comment.findMany({
    where: { post_id },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { created_at: "asc" }
  });

  return { comments };
}

async function createComment(user_id, body) {
  const { post_id, content } = body;

  if (!post_id || !content) {
    const e = new Error("post_id and content required");
    e.status = 400;
    throw e;
  }

  const comment = await prisma.comment.create({
    data: {
      user_id,
      post_id,
      content
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  return comment;
}

async function deleteComment(comment_id, user_id) {
  const comment = await prisma.comment.findUnique({
    where: { comment_id }
  });

  if (!comment) {
    const e = new Error("Comment not found");
    e.status = 404;
    throw e;
  }

  if (comment.user_id !== user_id) {
    const e = new Error("Forbidden: Not the owner");
    e.status = 403;
    throw e;
  }

  await prisma.comment.delete({
    where: { comment_id }
  });

  return { message: "Comment deleted" };
}

export default {
  getComments,
  createComment,
  deleteComment
};
