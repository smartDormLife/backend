import prisma from "../utils/prisma.js";

class ChatService {
  async getUserChatRooms(userId) {
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        members: {
          some: {
            user_id: userId,
            is_active: true,
          },
        },
      },
      include: {
        party: {
          include: {
            post: {
              select: {
                title: true,
                category: true,
              },
            },
          },
        },
        members: {
          where: {
            is_active: true,
          },
          include: {
            user: {
              select: {
                user_id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: {
              where: {
                is_active: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // 각 채팅방의 읽지 않은 메시지 개수 계산
    const chatRoomsWithUnreadCount = await Promise.all(
      chatRooms.map(async (room) => {
        // 현재 사용자의 채팅방 멤버 정보 가져오기
        const chatMember = await prisma.chatMember.findUnique({
          where: {
            room_id_user_id: {
              room_id: room.room_id,
              user_id: userId,
            },
          },
        });

        // last_read_at 이후의 메시지 개수 세기
        let unreadCount = 0;
        if (chatMember) {
          unreadCount = await prisma.chatMessage.count({
            where: {
              room_id: room.room_id,
              timestamp: {
                gt: chatMember.last_read_at || chatMember.joined_at,
              },
              sender_id: {
                not: userId, // 내가 보낸 메시지는 제외
              },
            },
          });
        }

        return {
          ...room,
          unread_count: unreadCount,
          member_count: room._count.members,
        };
      })
    );

    return chatRoomsWithUnreadCount;
  }

  async getChatRoomDetail(roomId, userId) {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: {
        room_id: roomId,
      },
      include: {
        party: {
          include: {
            post: true,
            host: {
              select: {
                user_id: true,
                name: true,
              },
            },
            members: true,
          },
        },
        members: {
          where: {
            is_active: true,
          },
          include: {
            user: {
              select: {
                user_id: true,
                name: true,
                dorm_id: true,
                room_no: true,
              },
            },
          },
        },
      },
    });

    if (!chatRoom) {
      throw new Error("Chat room not found");
    }

    // 파티 멤버인지 확인
    const isPartyMember = chatRoom.party.members.some(
      (member) => member.user_id === userId
    );

    if (!isPartyMember) {
      throw new Error("You must be a party member to access this chat room");
    }

    // 채팅방 멤버가 아니면 자동으로 추가
    const isChatMember = chatRoom.members.some(
      (member) => member.user_id === userId
    );

    if (!isChatMember) {
      await this.addMemberToChatRoom(roomId, userId);
      console.log(`✅ Auto-added user ${userId} to chat room ${roomId}`);
    }

    return chatRoom;
  }

  async createChatRoom(partyId) {
    const party = await prisma.party.findUnique({
      where: { party_id: partyId },
      include: {
        post: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!party) {
      throw new Error("Party not found");
    }

    const existingChatRoom = await prisma.chatRoom.findUnique({
      where: { party_id: partyId },
    });

    if (existingChatRoom) {
      return existingChatRoom;
    }

    const chatRoom = await prisma.chatRoom.create({
      data: {
        party_id: partyId,
        last_message: `${party.post.title} 채팅방이 생성되었습니다.`,
      },
    });

    await prisma.chatMember.create({
      data: {
        room_id: chatRoom.room_id,
        user_id: party.host_id,
        is_active: true,
      },
    });

    return chatRoom;
  }

  async getChatMessages(roomId, userId, limit = 50, offset = 0) {
    console.log(`📩 getChatMessages: roomId=${roomId}, userId=${userId}`);

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { room_id: roomId },
      include: {
        party: {
          include: {
            members: true,
          },
        },
        members: {
          where: {
            user_id: userId,
            is_active: true,
          },
        },
      },
    });

    if (!chatRoom) {
      console.log(`❌ Chat room not found: roomId=${roomId}`);
      throw new Error("Chat room not found");
    }

    console.log(`📊 Chat room members for user ${userId}:`, chatRoom.members);

    // 파티 멤버인지 확인
    const isPartyMember = chatRoom.party.members.some(
      (member) => member.user_id === userId
    );

    if (!isPartyMember) {
      console.log(`❌ User ${userId} is not a party member`);
      throw new Error("You must be a party member to access this chat room");
    }

    // 채팅방 멤버가 아니면 자동으로 추가
    if (chatRoom.members.length === 0) {
      console.log(`🔄 Auto-adding user ${userId} to chat room ${roomId}`);
      await this.addMemberToChatRoom(roomId, userId);
    }

    // 현재 사용자의 last_read_at 가져오기 (읽음 처리 전 시점)
    const chatMember = await prisma.chatMember.findUnique({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: userId,
        },
      },
    });

    const lastReadAt = chatMember?.last_read_at || chatMember?.joined_at;

    const messages = await prisma.chatMessage.findMany({
      where: {
        room_id: roomId,
      },
      include: {
        sender: {
          select: {
            user_id: true,
            name: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      skip: offset,
    });

    // 메시지에 읽음 여부 표시 추가
    const messagesWithReadStatus = messages.reverse().map((msg) => ({
      ...msg,
      is_unread: lastReadAt ? msg.timestamp > lastReadAt && msg.sender_id !== userId : false,
    }));

    return messagesWithReadStatus;
  }

  async createMessage(roomId, userId, content) {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { room_id: roomId },
      include: {
        members: {
          where: {
            user_id: userId,
            is_active: true,
          },
        },
      },
    });

    if (!chatRoom) {
      throw new Error("Chat room not found");
    }

    if (chatRoom.members.length === 0) {
      throw new Error("You are not a member of this chat room");
    }

    const message = await prisma.chatMessage.create({
      data: {
        room_id: roomId,
        sender_id: userId,
        content: content,
      },
      include: {
        sender: {
          select: {
            user_id: true,
            name: true,
          },
        },
      },
    });

    await prisma.chatRoom.update({
      where: { room_id: roomId },
      data: {
        last_message: content,
      },
    });

    return message;
  }

  async getChatMembers(roomId, userId) {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { room_id: roomId },
      include: {
        members: {
          where: {
            user_id: userId,
            is_active: true,
          },
        },
      },
    });

    if (!chatRoom) {
      throw new Error("Chat room not found");
    }

    if (chatRoom.members.length === 0) {
      throw new Error("You are not a member of this chat room");
    }

    const members = await prisma.chatMember.findMany({
      where: {
        room_id: roomId,
        is_active: true,
      },
      include: {
        user: {
          select: {
            user_id: true,
            name: true,
            dorm_id: true,
            room_no: true,
          },
        },
      },
      orderBy: {
        joined_at: "asc",
      },
    });

    return members;
  }

  async addMemberToChatRoom(roomId, userId) {
    const existingMember = await prisma.chatMember.findUnique({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: userId,
        },
      },
    });

    if (existingMember) {
      if (!existingMember.is_active) {
        await prisma.chatMember.update({
          where: {
            room_id_user_id: {
              room_id: roomId,
              user_id: userId,
            },
          },
          data: {
            is_active: true,
            joined_at: new Date(),
          },
        });
      }
      return existingMember;
    }

    const member = await prisma.chatMember.create({
      data: {
        room_id: roomId,
        user_id: userId,
        is_active: true,
      },
    });

    return member;
  }

  async removeMemberFromChatRoom(roomId, userId) {
    await prisma.chatMember.update({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: userId,
        },
      },
      data: {
        is_active: false,
      },
    });
  }

  async markMessagesAsRead(roomId, userId) {
    // 채팅방 멤버의 last_read_at을 현재 시간으로 업데이트
    await prisma.chatMember.update({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: userId,
        },
      },
      data: {
        last_read_at: new Date(),
      },
    });

    console.log(`✅ 메시지 읽음 처리: room_id=${roomId}, user_id=${userId}`);
  }
}


export const chatService = new ChatService();
