import prisma from "../config/prisma.js";

export const userService = {
  getMe: async (user_id) => {
    const user = await prisma.user.findUnique({
      where: { user_id },
      include: { dorm: true },
    });

    if (!user) return null;

    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,

      // 🔥 dorm_name 추가
      dorm_id: user.dorm_id,
      dorm_name: user.dorm ? user.dorm.dorm_name : null,

      room_no: user.room_no,
      phone: user.phone,
      account_number: user.account_number,
      created_at: user.created_at,
    };
  },

  async getMyPosts(userId) {
    const posts = await prisma.post.findMany({
      where: { user_id: userId },
      include: {
        party: {
          include: { members: true }
        }
      }
    });
    return posts;
  },

  async getMyParties(userId) {
    const parties = await prisma.partyMember.findMany({
      where: { user_id: userId },
      include: {
        party: {
          include: {
            post: true,
            members: true
          }
        }
      }
    });
    return parties;
  }
};
