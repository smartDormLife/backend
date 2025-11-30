import prisma from "../config/prisma.js";

// ------------------------------
// 1) dorm_id / category 추출
// ------------------------------
export async function extractDormIdMiddleware(req, res, next) {
  try {
    // Query.dorm_id → GET posts?dorm_id=
    if (req.query?.dorm_id) {
      req.requestedDormId = Number(req.query.dorm_id);
      return next();
    }

    // Body.dorm_id → POST/PATCH
    if (req.body?.dorm_id !== undefined) {
      req.requestedDormId = Number(req.body.dorm_id);
      return next();
    }

    // Posts/:postId (GET/POST comments 포함)
    if (req.params?.postId) {
      const post = await prisma.post.findUnique({
        where: { post_id: Number(req.params.postId) },
        select: { dorm_id: true, category: true },
      });

      if (!post) return res.status(404).json({ message: "Post not found" });

      req.requestedDormId = post.dorm_id;      // taxi면 null
      req.postCategory   = post.category;      // taxi / delivery / purchase / general
      return next();
    }

    // PartyId (join/leave)
    if (req.params?.partyId) {
      const party = await prisma.party.findUnique({
        where: { party_id: Number(req.params.partyId) },
        select: { post: { select: { dorm_id: true, category: true } } },
      });

      if (!party) return res.status(404).json({ message: "Party not found" });

      req.requestedDormId = party.post.dorm_id;
      req.postCategory = party.post.category;
      return next();
    }

    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ------------------------------
// 2) dorm 접근 제한
// ------------------------------
export function dormAccessMiddleware(req, res, next) {
  const userDorm = req.user?.dorm_id ?? null;
  const requestedDorm = req.requestedDormId ?? null;
  const postCategory =
    req.postCategory ??
    req.body?.category ??
    req.query?.category ??
    null;

  // 1) category를 알 수 없으면 검증 하지 않음 (댓글 POST 등)
  if (!postCategory) return next();

  // 2) taxi는 전체 공개
  if (postCategory === "taxi") return next();

  // 3) dorm_id 필요하지만 유저가 할당받지 않은 경우
  if (requestedDorm !== null && userDorm === null) {
    return res.status(403).json({ message: "Dormitory not assigned" });
  }

  // 4) dorm mismatch → 접근 금지
  if (requestedDorm !== null && Number(userDorm) !== Number(requestedDorm)) {
    return res.status(403).json({ message: "Forbidden: Dorm access denied" });
  }

  return next();
}
