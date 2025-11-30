import prisma from "../config/prisma.js";

async function getMe(user_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      email: true,
      name: true,
      dorm_id: true,
      room_no: true,
      phone: true,
      account_number: true,
      created_at: true,
      dorm: {
        select: {
          dorm_name: true
        }
      }
    }
  });

  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  return user;
}

function buildPagination(query) {
  const page = Number(query.page ?? 1);
  const size = Number(query.size ?? 10);
  const skip = (page - 1) * size;
  return { page, size, skip };
}

async function getMyPosts(user_id, query = {}) {
  const { page, size, skip } = buildPagination(query);

  const where = {
    user_id,
    ...(query.category ? { category: query.category } : {}),
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        party: {
          include: { members: true },
        },
        dorm: {
          select: { dorm_name: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: size,
    }),
    prisma.post.count({ where }),
  ]);

  const items = posts.map((post) => {
    const { dorm, _count, ...restPost } = post;
    return {
      ...restPost,
      dorm_name: dorm?.dorm_name ?? null,
      current_member_count: post.party ? post.party.members.length : null,
      comment_count: _count.comments,
    };
  });

  return { items, totalCount, page, size };
}

async function getMyComments(user_id, query = {}) {
  const { page, size, skip } = buildPagination(query);

  const [comments, totalCount] = await Promise.all([
    prisma.comment.findMany({
      where: { user_id },
      include: {
        post: {
          include: {
            dorm: { select: { dorm_name: true } },
            party: {
              include: { members: true },
            },
            _count: { select: { comments: true } },
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: size,
    }),
    prisma.comment.count({ where: { user_id } }),
  ]);

  const items = comments.map((comment) => {
    const { post, ...restComment } = comment;
    if (!post) return { ...restComment, post: null };

    const { dorm, _count, ...restPost } = post;

    return {
      ...restComment,
      post: {
        ...restPost,
        dorm_name: dorm?.dorm_name ?? null,
        current_member_count: post.party ? post.party.members.length : null,
        comment_count: _count.comments,
      },
    };
  });

  return { items, totalCount, page, size };
}

async function getMyParties(user_id, query = {}) {
  const { page, size, skip } = buildPagination(query);

  const where = {
    party: {
      is: {
        OR: [
          { host_id: user_id },
          { members: { some: { user_id } } },
        ],
      },
    },
  };

  const [posts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        user: { select: { name: true, dorm_id: true } },
        party: {
          include: {
            members: true,
            host: { select: { user_id: true, name: true } },
          },
        },
        dorm: { select: { dorm_name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: size,
    }),
    prisma.post.count({ where }),
  ]);

  const items = posts.map((post) => {
    const { dorm, _count, ...restPost } = post;
    const party = restPost.party;
    const isHost = party?.host_id === user_id;
    const isMember = party?.members.some((m) => m.user_id === user_id) ?? false;

    return {
      ...restPost,
      dorm_name: dorm?.dorm_name ?? null,
      comment_count: _count.comments,
      party: party
        ? {
            ...party,
            current_member_count: party.members.length,
            is_joined: isHost || isMember,
          }
        : null,
      party_role: isHost ? "host" : isMember ? "member" : "guest",
    };
  });

  return { items, totalCount, page, size };
}

async function updateMe(user_id, body) {
  const allowed = ["name", "room_no", "phone", "account_number"];

  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      data[key] = body[key];
    }
  }

  if (Object.keys(data).length === 0) {
    const e = new Error("No valid fields to update");
    e.status = 400;
    throw e;
  }

  const updated = await prisma.user.update({
    where: { user_id },
    data,
    select: {
      user_id: true,
      email: true,
      name: true,
      dorm_id: true,
      room_no: true,
      phone: true,
      account_number: true,
      created_at: true
    }
  });

  return updated;
}

export default {
  getMe,
  getMyPosts,
  getMyComments,
  getMyParties,
  updateMe,
};
