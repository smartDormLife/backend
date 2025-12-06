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

    // 파티 참가 시 자동으로 채팅방 멤버로 추가
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { party_id: partyId }
    });

    if (chatRoom) {
      // 기존 멤버가 있으면 재활성화, 없으면 새로 생성
      const existingMember = await prisma.chatMember.findUnique({
        where: {
          room_id_user_id: {
            room_id: chatRoom.room_id,
            user_id: userId
          }
        }
      });

      if (existingMember) {
        await prisma.chatMember.update({
          where: {
            room_id_user_id: {
              room_id: chatRoom.room_id,
              user_id: userId
            }
          },
          data: {
            is_active: true,
            joined_at: new Date()
          }
        });
        console.log(`✅ 채팅방 멤버 재활성화: room_id=${chatRoom.room_id}, user_id=${userId}`);
      } else {
        await prisma.chatMember.create({
          data: {
            room_id: chatRoom.room_id,
            user_id: userId,
            is_active: true
          }
        });
        console.log(`✅ 채팅방 멤버 추가: room_id=${chatRoom.room_id}, user_id=${userId}`);
      }
    }

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

    // 파티 나가기 시 채팅방 멤버 비활성화
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { party_id: partyId }
    });

    if (chatRoom) {
      await prisma.chatMember.update({
        where: {
          room_id_user_id: {
            room_id: chatRoom.room_id,
            user_id: userId
          }
        },
        data: {
          is_active: false
        }
      });
      console.log(`✅ 채팅방 멤버 비활성화: room_id=${chatRoom.room_id}, user_id=${userId}`);
    }

    const updated = await prisma.party.findUnique({
      where: { party_id: partyId },
      include: { members: true }
    });

    // 만약 파티가 마감 상태였는데, 인원이 줄어서 다시 모집 가능해지면 상태 변경
    if (updated.status === "closed" && updated.max_member && updated.members.length < updated.max_member) {
      await prisma.party.update({
        where: { party_id: partyId },
        data: { status: "recruiting" }
      });
      updated.status = "recruiting"; // 반환값 업데이트
    }

    return {
      current_member_count: updated.members.length,
      status: updated.status
    };
  },

  async close(userId, partyId) {
    const party = await prisma.party.findUnique({
      where: { party_id: partyId }
    });

    if (!party) throw { status: 404, message: "Party not found" };
    if (party.host_id !== userId) throw { status: 403, message: "Only host can close the party" };

    const updated = await prisma.party.update({
      where: { party_id: partyId },
      data: { status: "closed" }
    });

    return updated;
  },

  async detail(partyId) {
    return await prisma.party.findUnique({
      where: { party_id: partyId },
      include: { members: true, post: true }
    });
  }
};
