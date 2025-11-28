import prisma from "../config/prisma.js";

function validatePostBody(body) {
  const { category, dorm_id, max_member, price } = body;

  // 공통 필수값 체크
  if (!category) {
    const e = new Error("category is required");
    e.status = 400;
    throw e;
  }

  // 카테고리별 검증
  switch (category) {
    case "delivery":
      if (!dorm_id) throw Object.assign(new Error("dorm_id required"), { status: 400 });
      if (!max_member) throw Object.assign(new Error("max_member required"), { status: 400 });
      break;

    case "purchase":
      if (!dorm_id) throw Object.assign(new Error("dorm_id required"), { status: 400 });
      if (!max_member) throw Object.assign(new Error("max_member required"), { status: 400 });
      break;

    case "taxi":
      if (dorm_id !== null) {
        const e = new Error("taxi category requires dorm_id = null");
        e.status = 400;
        throw e;
      }
      if (!max_member) throw Object.assign(new Error("max_member required"), { status: 400 });
      break;

    case "used_sale":
      if (!dorm_id) throw Object.assign(new Error("dorm_id required"), { status: 400 });
      if (!price) throw Object.assign(new Error("price required"), { status: 400 });
      break;

    case "general":
      if (!dorm_id) throw Object.assign(new Error("dorm_id required"), { status: 400 });
      break;

    default:
      throw Object.assign(new Error("Invalid category"), { status: 400 });
  }
}

async function createPost(user_id, body) {
  validatePostBody(body);

  const { category, dorm_id, title, content, price, max_member } = body;

  return await prisma.$transaction(async (tx) => {
    // 1) Post 생성
    const post = await tx.post.create({
      data: {
        user_id,
        category,
        dorm_id,
        title,
        content,
        price: price ?? null,
      },
    });

    // 2) Party 자동 생성 카테고리
    const autoParty = ["delivery", "purchase", "taxi"];

    let party = null;
    let chatRoom = null;

    if (autoParty.includes(category)) {
      party = await tx.party.create({
        data: {
          post_id: post.post_id,
          host_id: user_id,
          max_member: max_member,
          status: "recruiting",
        },
      });

      // 3) ChatRoom 자동 생성
      chatRoom = await tx.chatRoom.create({
        data: {
          party_id: party.party_id,
        },
      });

      // 4) Host를 ChatMember로 추가
      await tx.chatMember.create({
        data: {
          room_id: chatRoom.room_id,
          user_id: user_id,
        },
      });
    }

    return {
      post,
      party,
      chatRoom,
    };
  });
}

function buildWhere(query) {
  const where = {};

  // category
  if (query.category) {
    where.category = query.category;
  }

  // dorm_id (택시는 dorm_id null)
  if (query.category !== "taxi") {
    if (!query.dorm_id) {
      const e = new Error("dorm_id is required for this category");
      e.status = 400;
      throw e;
    }
    where.dorm_id = Number(query.dorm_id);
  } else {
    // taxi는 dorm_id 제한 없음 (전체 조회)
    // 명시적으로 null을 찾기보다 필터를 걸지 않는 것이 안전함
  }

  // keyword
  if (query.keyword) {
    where.title = {
      contains: query.keyword,
    };
  }

  // status
  if (query.status) {
    where.status = query.status; // active / closed
  } else {
    where.status = "active"; // 기본 active
  }

  return where;
}

async function getPosts(query) {
  const page = Number(query.page ?? 1);
  const size = Number(query.size ?? 10);
  const skip = (page - 1) * size;

  const where = buildWhere(query);

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            dorm_id: true
          },
        },
        party: {
          select: {
            max_member: true,
            status: true,
            members: true
          }
        }
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: size,
    }),
    prisma.post.count({ where }),
  ]);

  // current_member_count 계산
  const formatted = posts.map((p) => ({
    ...p,
    current_member_count: p.party ? p.party.members.length : null,
  }));

  return {
    posts: formatted,
    totalCount,
    page,
    size,
  };
}

async function getRecentPosts(limit = 5) {
  const posts = await prisma.post.findMany({
    where: {
      status: "active"
    },
    include: {
      user: {
        select: { name: true, dorm_id: true }
      },
      party: {
        include: {
          members: true
        }
      }
    },
    orderBy: {
      created_at: "desc"
    },
    take: limit
  });

  const formatted = posts.map((p) => ({
    ...p,
    current_member_count: p.party ? p.party.members.length : null
  }));

  return {
    posts: formatted
  };
}

async function updatePost(post_id, user_id, body) {
  const { title, content, price, max_member } = body;

  // 1) 기존 Post 조회
  const post = await prisma.post.findUnique({
    where: { post_id },
    include: { party: true },
  });

  if (!post) {
    const e = new Error("Post not found");
    e.status = 404;
    throw e;
  }

  // 2) 작성자 확인
  if (post.user_id !== user_id) {
    const e = new Error("Forbidden: Not the post owner");
    e.status = 403;
    throw e;
  }

  // 3) 카테고리 변경 시도 금지
  if (body.category && body.category !== post.category) {
    const e = new Error("Cannot change category");
    e.status = 400;
    throw e;
  }

  // 4) dorm_id 변경 금지
  if (body.dorm_id && body.dorm_id !== post.dorm_id) {
    const e = new Error("Cannot change dorm_id");
    e.status = 400;
    throw e;
  }

  return await prisma.$transaction(async (tx) => {
    // 5) Post 업데이트
    const updatedPost = await tx.post.update({
      where: { post_id },
      data: {
        title: title ?? post.title,
        content: content ?? post.content,
        price: price ?? post.price,
      },
    });

    let updatedParty = null;

    // 6) Party 수정 (max_member만)
    if (post.party) {
      if (max_member !== undefined) {
        updatedParty = await tx.party.update({
          where: { party_id: post.party.party_id },
          data: { max_member },
        });
      }
    }

    return {
      post: updatedPost,
      party: updatedParty,
    };
  });
}

async function deletePost(post_id, user_id) {
  // 1) Post 조회
  const post = await prisma.post.findUnique({
    where: { post_id },
    include: {
      party: true,
    },
  });

  if (!post) {
    const e = new Error("Post not found");
    e.status = 404;
    throw e;
  }

  // 2) 소유자 체크
  if (post.user_id !== user_id) {
    const e = new Error("Forbidden: Not the post owner");
    e.status = 403;
    throw e;
  }

  // 3) 삭제 = status=closed
  const updated = await prisma.post.update({
    where: { post_id },
    data: { status: "closed" },
  });

  // 4) Party가 있다면 party도 closed 처리
  let updatedParty = null;

  if (post.party) {
    updatedParty = await prisma.party.update({
      where: { party_id: post.party.party_id },
      data: { status: "closed" },
    });
  }

  return {
    message: "Post closed successfully",
    post: updated,
    party: updatedParty,
  };
}

async function getPostDetail(post_id, user_id) {
  const post = await prisma.post.findUnique({
    where: { post_id },
    include: {
      user: {
        select: {
          user_id: true,
          name: true
        }
      },
      dorm: {
        select: {
          dorm_id: true,
          dorm_name: true
        }
      },
      party: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  user_id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!post) {
    const e = new Error("Post not found");
    e.status = 404;
    throw e;
  }

  // 댓글
  const comments = await prisma.comment.findMany({
    where: { post_id },
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: { created_at: "asc" }
  });

  let partyData = null;
  if (post.party) {
    const members = post.party.members.map((m) => ({
      user_id: m.user_id,
      name: m.user.name
    }));

    const isJoined = user_id
      ? members.some((m) => m.user_id === user_id)
      : false;

    partyData = {
      party_id: post.party.party_id,
      max_member: post.party.max_member,
      status: post.party.status,
      members,
      current_member_count: members.length,
      is_joined: isJoined
    };
  }

  return {
    post: post,
    party: partyData,
    comments
  };
}
export default {
  createPost,
  getPosts,
  getRecentPosts,
  getPostDetail,
  updatePost,
  deletePost
};
