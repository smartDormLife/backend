import prisma from "../utils/prisma.js";

export const partyService = {
  async join(userId, partyId) {
    const party = await prisma.party.findUnique({
      where: { party_id: partyId },
      include: { members: true }
    });

    if (!party) throw { status: 404, message: "Party not found" };

    if (party.members.some((m) => m.user_id === userId))
      throw { status: 409, message: "Already joined" };

    if (party.max_member && party.members.length >= party.max_member)
      throw { status: 409, message: "Party is full" };

    await prisma.partyMember.create({
      data: { user_id: userId, party_id: partyId }
    });

    const updated = await prisma.party.findUnique({
      where: { party_id: partyId },
      include: { members: true, post: true }
    });

    const memberCount = updated.members.length;
    const max = updated.max_member;

    if (memberCount >= max) {
      await prisma.party.update({
        where: { party_id: partyId },
        data: { status: "closed" }
      });
    }

    return {
      current_member_count: memberCount,
      status: memberCount >= max ? "closed" : updated.status
    };
  },

  async leave(userId, partyId) {
    await prisma.partyMember.delete({
      where: {
        party_id_user_id: { party_id: partyId, user_id: userId }
      }
    });

    const updated = await prisma.party.findUnique({
      where: { party_id: partyId },
      include: { members: true }
    });

    return {
      current_member_count: updated.members.length
    };
  },

  async detail(partyId) {
    return await prisma.party.findUnique({
      where: { party_id: partyId },
      include: { members: true, post: true }
    });
  }
};
