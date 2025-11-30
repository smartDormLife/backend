import prisma from "../config/prisma.js";

export const postService = {
  //게시판 목록 조회
  getPosts: async (query, user) => {
    const {
      category,
      sort = "latest",
      keyword = "",
      status = "active",
      page = 1,
      size = 10
    } = query;

    if (!category) throw { status: 400, message: "category is required" };

    const pageNum = Number(page) || 1;
    const pageSize = Number(size) || 10;
    const skip = (pageNum - 1) * pageSize;

    // ===========================
    // dorm 접근 제한
    // ===========================
    let where = {
      category,
      status,
      ...(keyword && {
        OR: [
          { title: { contains: keyword } },
          { content: { contains: keyword } }
        ]
      }),
    };

    if (category === "taxi") {
      where.dorm_id = null; // 전체 공개
    } else {
      if (!user?.dorm_id)
        throw { status: 403, message: "Forbidden: no dorm" };

      where.dorm_id = user.dorm_id;
    }

    // ===========================
    // 정렬
    // ===========================
    let orderBy = { created_at: "desc" };

    if (sort === "deadline") {
      orderBy = { party: { deadline: "asc" } };
    }

    // ===========================
    // 쿼리
    // ===========================
    const [totalCount, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: true,
          party: { include: { members: true } }
        }
      })
    ]);

    // ===========================
    // 응답 가공
    // ===========================
    const formatted = posts.map((p) => ({
      post_id: p.post_id,
      user_id: p.user_id,
      dorm_id: p.dorm_id,
      category: p.category,
      title: p.title,
      content: p.content,
      price: p.price,
      status: p.status,
      created_at: p.created_at,
      max_member: p.party?.max_member ?? null,
      current_member_count: p.party?.members.length ?? null,
      user: {
        name: p.user.name,
        dorm_id: p.user.dorm_id
      }
    }));

    return {
      posts: formatted,
      totalCount,
      page: pageNum,
      size: pageSize
    };
  },

  //-----------------------------------------
  // 2) 게시글 상세조회
  //-----------------------------------------
  getPost: async (postId, user) => {
    const post = await prisma.post.findUnique({
      where: { post_id: postId },
      include: {
        user: true,
        party: { include: { members: true } }
      }
    });

    if (!post) throw { status: 404, message: "Post not found" };

    // dorm 권한 체크
    if (post.category !== "taxi" && post.dorm_id !== user.dorm_id) {
      throw { status: 403, message: "Forbidden: wrong dorm" };
    }

    return post;
  },

  //-----------------------------------------
  // 3) 게시글 생성
  //-----------------------------------------
  createPost: async (user, body) => {
    if (!user?.user_id) throw { status: 401, message: "Unauthorized" };

    const {
      category,
      title,
      content,
      price,
      dorm_id,
      party
    } = body;

    // dorm 검증
    let targetDormId = null;
    if (category !== "taxi") {
      targetDormId = user.dorm_id;
    }

    // 게시글 생성
    const newPost = await prisma.post.create({
      data: {
        user_id: user.user_id,
        dorm_id: targetDormId,
        category,
        title,
        content,
        price
      }
    });

    // 파티 생성 (필요할 때)
    if (party) {
      await prisma.party.create({
        data: {
          post_id: newPost.post_id,
          host_id: user.user_id,
          max_member: party.max_member,
          deadline: party.deadline,
          location: party.location
        }
      });
    }

    return newPost;
  },

  //-----------------------------------------
  // 4) 게시글 수정
  //-----------------------------------------
  updatePost: async (postId, user, body) => {
    const post = await prisma.post.findUnique({
      where: { post_id: postId }
    });

    if (!post) throw { status: 404, message: "Post not found" };
    if (post.user_id !== user.user_id)
      throw { status: 403, message: "Forbidden" };

    const updated = await prisma.post.update({
      where: { post_id: postId },
      data: body
    });

    return updated;
  },

  //-----------------------------------------
  // 5) 게시글 삭제
  //-----------------------------------------
  deletePost: async (postId, user) => {
    const post = await prisma.post.findUnique({
      where: { post_id: postId }
    });

    if (!post) throw { status: 404, message: "Post not found" };
    if (post.user_id !== user.user_id)
      throw { status: 403, message: "Forbidden" };

    // 파티 삭제
    await prisma.party.deleteMany({
      where: { post_id: postId }
    });

    // 게시글 삭제
    await prisma.post.delete({
      where: { post_id: postId }
    });

    return { message: "Post deleted" };
  }
};