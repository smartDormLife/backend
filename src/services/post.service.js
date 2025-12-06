import prisma from "../utils/prisma.js";
// ------------------------------
// category 변환기 (프론트 → Prisma enum)
// ------------------------------
function normalizeCategory(c) {
  if (!c) return c;

  return {
    "used-sale": "used_sale",
    "used_sale": "used_sale",
    "usedSale": "used_sale",
    "usedsale": "used_sale",

    "delivery": "delivery",
    "purchase": "purchase",
    "general": "general",
    "taxi": "taxi"
  }[c] ?? c;
}

// post 변환기
function mapPost(post, userId) {
  const party = post.party;

  return {
    ...post,
    max_member: party?.max_member ?? null,
    current_member_count: party?.members?.length ?? 0,
    party: party
      ? {
          ...party,
          current_member_count: party.members.length,
          is_joined: party.members.some((m) => m.user_id === userId),
        }
      : null,
  };
}

// Service
export const postService = {
  // 게시판 목록
  async list(params, userId) {
    let { category, dorm_id, status } = params;

    console.log("들어온 요청 =============================");
    console.log("REQ QUERY:", params);
    console.log("USER ID:", userId);

    // taxi가 아닐 때만 dorm_id 자동 설정
    if (category !== "taxi" && !dorm_id) {
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { dorm_id: true }
        });
        dorm_id = user.dorm_id;
        console.log("➡ 자동 설정된 dorm_id:", dorm_id);
    }

    console.log("QUERY dorm_id:", dorm_id);
    console.log("CATEGORY:", category);

    // taxi일 때는 dorm_id 조건 없음
    const dormCondition = category === "taxi" ? {} : { dorm_id: Number(dorm_id) };

    console.log("🔍 Prisma where 조건:", { category, status, ...dormCondition });

    const posts = await prisma.post.findMany({
        where: { 
            category, 
            status, 
            ...dormCondition 
        },
        orderBy: { created_at: "desc" },
        include: {
            user: true,
            party: { include: { members: true } }
        }
    });

    console.log("조회된 게시글 수:", posts.length);

    const mappedPosts = posts.map(p => mapPost(p, userId));

    return { posts: mappedPosts };
  }, 

  // 상세 조회
  async detail(postId, userId) {
    console.log("DETAIL CALL:", postId, userId);
    const post = await prisma.post.findUnique({
        where: { post_id: postId },
        include: {
            user: true,
            party: { include: { members: true } },
        },
    });
    console.log("DETAIL RESULT post:", post);

    if (!post) throw { status: 404, message: "Post not found" };

    // taxi 게시글은 권한 체크 스킵
    if (post.category !== "taxi") {
        const user = await prisma.user.findUnique({
            where: { user_id: userId },
        });

        if (post.dorm_id !== user.dorm_id) {
            throw { status: 403, message: "해당 기숙사 게시판 접근 불가" };
        }
    }

    return mapPost(post, userId);
  },

  // 게시글 생성
  async create(userId, body) {
    const { title, content, category, dorm_id, max_member, deadline, location, price } = body;

    console.log("게시글 생성 요청:", { category, dorm_id, title });

    const post = await prisma.post.create({
        data: {
            user_id: userId,
            dorm_id: category === "taxi" ? null : dorm_id,  // ✅ taxi일 때 null
            title,
            content,
            category,
            price: price ?? null,
            status: "active",
        }
    });

    // 배달/공구/택시일 때 party 생성
    if (["delivery", "purchase", "taxi"].includes(category)) {
        const party = await prisma.party.create({
            data: {
                post_id: post.post_id,
                host_id: userId,
                max_member: max_member ?? 4,
                deadline: deadline ? new Date(deadline) : null,
                location: location ?? null,
            }
        });

        // 호스트를 자동으로 파티 멤버로 추가
        await prisma.partyMember.create({
            data: {
                party_id: party.party_id,
                user_id: userId,
            }
        });

        console.log(`✅ 호스트를 파티 멤버로 추가: party_id=${party.party_id}, user_id=${userId}`);

        // 파티 생성 시 자동으로 채팅방 생성
        const chatRoom = await prisma.chatRoom.create({
            data: {
                party_id: party.party_id,
                last_message: `${title} 채팅방이 생성되었습니다.`,
            }
        });

        // 호스트를 자동으로 채팅방 멤버로 추가
        await prisma.chatMember.create({
            data: {
                room_id: chatRoom.room_id,
                user_id: userId,
                is_active: true,
            }
        });

        console.log(`✅ 채팅방 생성 완료: room_id=${chatRoom.room_id}, party_id=${party.party_id}`);
    }

    console.log("게시글 생성 완료:", post.post_id);

    return post;
  },

  // 수정
  async update(userId, postId, data) {
    const post = await prisma.post.findUnique({ where: { post_id: postId } });
    if (!post) throw { status: 404, message: "Not found" };
    if (post.user_id !== userId) throw { status: 403, message: "Forbidden" };

    await prisma.post.update({
      where: { post_id: postId },
      data,
    });

    return this.detail(postId, userId);
  },

  // 삭제
  async remove(userId, postId) {
    const post = await prisma.post.findUnique({
      where: { post_id: postId },
      include: { party: true }
    });

    if (!post) throw { status: 404, message: "Not found" };
    if (post.user_id !== userId) throw { status: 403, message: "Forbidden" };

    console.log(`🗑️ 게시글 삭제 시작: post_id=${postId}`);

    // 파티가 있는 경우 (배달/공구/택시)
    if (post.party) {
      const partyId = post.party.party_id;

      // 1. 채팅방 찾기
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { party_id: partyId }
      });

      if (chatRoom) {
        // 1-1. 채팅 메시지 삭제
        await prisma.chatMessage.deleteMany({
          where: { room_id: chatRoom.room_id }
        });
        console.log(`✅ 채팅 메시지 삭제 완료: room_id=${chatRoom.room_id}`);

        // 1-2. 채팅방 멤버 삭제
        await prisma.chatMember.deleteMany({
          where: { room_id: chatRoom.room_id }
        });
        console.log(`✅ 채팅방 멤버 삭제 완료: room_id=${chatRoom.room_id}`);

        // 1-3. 채팅방 삭제
        await prisma.chatRoom.delete({
          where: { room_id: chatRoom.room_id }
        });
        console.log(`✅ 채팅방 삭제 완료: room_id=${chatRoom.room_id}`);
      }

      // 2. 파티 멤버 삭제
      await prisma.partyMember.deleteMany({
        where: { party_id: partyId }
      });
      console.log(`✅ 파티 멤버 삭제 완료: party_id=${partyId}`);

      // 3. 파티 삭제
      await prisma.party.delete({
        where: { party_id: partyId }
      });
      console.log(`✅ 파티 삭제 완료: party_id=${partyId}`);
    }

    // 4. 댓글 삭제
    await prisma.comment.deleteMany({
      where: { post_id: postId }
    });
    console.log(`✅ 댓글 삭제 완료: post_id=${postId}`);

    // 5. 게시글 삭제
    await prisma.post.delete({
      where: { post_id: postId }
    });
    console.log(`✅ 게시글 삭제 완료: post_id=${postId}`);
  },

  async recent(limit = 5, userId) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { dorm_id: true }
    });
    const dormId = user?.dorm_id;
    if (!dormId) {
      return { posts: [] }; // dorm_id 없으면 매칭 불가
    }

    const posts = await prisma.post.findMany({
      where: {
        category: { in: ["delivery"] },
        status: "active",
        dorm_id: dormId,
        party: {
          status: "recruiting"   // Party가 모집 중인 상태
        }
      },
      orderBy: { created_at: "desc" },
      take: Number(limit),
      include: {
        user: true,
        party: { include: { members: true } }
      }
    });

    return {
      posts: posts.map((p) => mapPost(p, userId))
    };
  },

  // 댓글 목록
  async listComments(postId) {
    return await prisma.comment.findMany({
      where: { post_id: postId },
      orderBy: { created_at: "asc" },
      include: { user: true },
    });
  },

  // 댓글 작성
  async addComment(userId, postId, content) {
    return await prisma.comment.create({
      data: { user_id: userId, post_id: postId, content },
      include: { user: true },
    });
  },
};