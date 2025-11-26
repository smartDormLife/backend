import { verifyAccessToken } from "../utils/jwt.js";
import prisma from "../config/prisma.js";

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Invalid token" });

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: { user_id: true, dorm_id: true },
    });

    if (!user)
      return res.status(401).json({ message: "Invalid user" });

    req.user = user;   // user_id, dorm_id 둘 다 포함됨
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
