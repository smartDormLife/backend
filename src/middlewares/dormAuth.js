export const dormAuth = (req, res, next) => {
  const userDormId = req.user?.dorm_id;
  const reqDormId = Number(req.query.dorm_id ?? req.params.dormId);

  // taxi 카테고리는 기숙사 체크 없음
  const category = req.query.category;

  if (category === "taxi") {
    return next();
  }

  // dorm_id 없는 경우는 pass (프론트가 알아서 넘김)
  if (!reqDormId || !userDormId) return next();

  if (userDormId !== reqDormId) {
    return res.status(403).json({
      message: "해당 기숙사 게시판에 접근할 권한이 없습니다."
    });
  }

  next();
};
