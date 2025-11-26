import prisma from "../config/prisma.js";

export async function extractDormIdMiddleware(req, res, next) {
  try {
    // 1) Query에 dorm_id → GET /posts?dorm_id=
    if (req.query && req.query.dorm_id) {
      req.requestedDormId = Number(req.query.dorm_id);
      return next();
    }

    // 2) Body에 dorm_id → POST/PUT/PATCH 요청에서만 사용
    if (req.body && req.body.dorm_id !== undefined) {
      req.requestedDormId = Number(req.body.dorm_id);
      return next();
    }

    // 3) URL param - postId 있는 경우: GET /posts/:postId
    if (req.params && req.params.postId) {
      const post = await prisma.post.findUnique({
        where: { post_id: Number(req.params.postId) },
        select: { dorm_id: true, category: true },
      });

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      req.requestedDormId = post.dorm_id;
      req.postCategory = post.category;
      return next();
    }

    // 4) partyId 기반 요청 (join/leave 등)
    if (req.params && req.params.partyId) {
      const party = await prisma.party.findUnique({
        where: { party_id: Number(req.params.partyId) },
        select: {
          post: { select: { dorm_id: true, category: true } },
        },
      });

      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }

      req.requestedDormId = party.post.dorm_id;
      req.postCategory = party.post.category;
      return next();
    }

    // 5) 아무것도 없으면 그냥 next()
    return next();

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


export function dormAccessMiddleware(req, res, next) {
  const userDorm = req.user?.dorm_id ?? null;
  const requestedDorm = req.requestedDormId ?? null;
  const postCategory = req.postCategory ?? req.body?.category ?? req.query?.category;

  // 1) taxi는 dorm 제한 없음
  if (postCategory === "taxi") {
    return next();
  }

  // 2) dorm_id가 없는 요청은 검증할 필요 없음
  if (requestedDorm === null || requestedDorm === undefined) {
    return next();
  }

  // 3) user.dorm_id가 null 인 경우는 dorm_id 요구 API 사용 불가
  if (userDorm === null) {
    return res.status(403).json({ message: "Dormitory not assigned" });
  }

  // 4) dorm mismatch → 접근 금지
  if (Number(userDorm) !== Number(requestedDorm)) {
    return res.status(403).json({ message: "Forbidden: Dorm access denied" });
  }

  return next();
}
