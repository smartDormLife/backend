import prisma from "../config/prisma.js";

async function joinParty(party_id, user_id) {
  const party = await prisma.party.findUnique({
    where: { party_id },
    include: {
      members: true,
    },
  });

  if (!party) {
    const e = new Error("Party not found");
    e.status = 404;
    throw e;
  }

  // 이미 closed?
  if (party.status === "closed") {
    const e = new Error("Party already closed");
    e.status = 403;
    throw e;
  }

  // 중복 참여 검사
  const already = party.members.find(m => m.user_id === user_id);
  if (already) {
    const e = new Error("Already joined");
    e.status = 409;
    throw e;
  }

  // 정원 초과 검사
  const currentCount = party.members.length;
  if (party.max_member && currentCount >= party.max_member) {
    const e = new Error("Party is full");
    e.status = 409;
    throw e;
  }

  // 참여
  await prisma.partyMember.create({
    data: {
      party_id,
      user_id
    }
  });

  // 참여 후 다시 count
  const updatedMembers = await prisma.partyMember.count({
    where: { party_id }
  });

  // 정원 도달 → party close
  let updatedStatus = party.status;
  if (party.max_member && updatedMembers >= party.max_member) {
    updatedStatus = "closed";
    await prisma.party.update({
      where: { party_id },
      data: { status: "closed" }
    });
  }

  return {
    current_member_count: updatedMembers,
    status: updatedStatus
  };
}

async function leaveParty(party_id, user_id) {
  const party = await prisma.party.findUnique({
    where: { party_id },
    include: {
      members: true
    },
  });

  if (!party) {
    const e = new Error("Party not found");
    e.status = 404;
    throw e;
  }

  // 참가 여부 확인
  const member = party.members.find(m => m.user_id === user_id);
  if (!member) {
    const e = new Error("Not a party member");
    e.status = 403;
    throw e;
  }

  // 삭제
  await prisma.partyMember.delete({
    where: {
      party_id_user_id: {
        party_id,
        user_id
      }
    }
  });

  // 다시 count
  const updatedCount = await prisma.partyMember.count({
    where: { party_id }
  });

  return {
    current_member_count: updatedCount
  };
}

export default {
  joinParty,
  leaveParty
};
