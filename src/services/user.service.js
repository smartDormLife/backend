import prisma from "../utils/prisma.js";

export const userService = {
  async me(userId) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        dorm: true
      }
    });

    if (!user) throw { status: 404, message: "User not found" };

    return {
      user_id: user.user_id,        // ✅ 추가
      name: user.name,
      email: user.email,
      dorm_id: user.dorm_id,        // ✅ 추가 (핵심!)
      dorm_name: user.dorm?.dorm_name ?? "",
      room_no: user.room_no,
      phone: user.phone,
      account_number: user.account_number,  // ✅ 추가 (있으면)
      created_at: user.created_at,  // ✅ 추가 (있으면)
    };
  },

  async updateMe(userId, payload) {
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: payload
    });

    return user;
  },

  async myPosts(userId, query) {
    const { category } = query;

    const posts = await prisma.post.findMany({
      where: {
        user_id: userId,
        ...(category ? { category } : {})
      },
      orderBy: { created_at: "desc" },
      include: {
        party: {
          include: { members: true }
        },
        user: true
      }
    });

    const mapped = posts.map((p) => ({
      ...p,
      current_member_count: p.party?.members.length ?? 0,
      max_member: p.party?.max_member ?? null
    }));

    return {
      items: mapped,
      totalCount: mapped.length,
      page: 1,
      size: mapped.length
    };
  },

  async myParties(userId) {
    const members = await prisma.partyMember.findMany({
      where: { user_id: userId },
      include: {
        party: {
          include: {
            post: {
              include: { user: true }
            },
            members: true
          }
        }
      }
    });

    const posts = members.map((m) => ({
      ...m.party.post,
      current_member_count: m.party.members.length,
      max_member: m.party.max_member
    }));

    return {
      items: posts,
      totalCount: posts.length,
      page: 1,
      size: posts.length
    };
  }
};
