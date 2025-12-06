import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    console.log("🔐 Socket.io Auth - Token received:", token ? "Yes" : "No");

    if (!token || token === "undefined") {
      console.log("❌ Socket.io Auth - No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Socket.io Auth - Token decoded:", decoded);

    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      select: {
        user_id: true,
        email: true,
        name: true,
        dorm_id: true,
        room_no: true,
      },
    });

    if (!user) {
      console.log("❌ Socket.io Auth - User not found");
      return next(new Error("Authentication error: User not found"));
    }

    console.log("✅ Socket.io Auth - User authenticated:", user.name);

    socket.user = user;
    next();
  } catch (err) {
    console.log("❌ Socket.io Auth - Token verification failed:", err.message);
    return next(new Error("Authentication error: Invalid token"));
  }
};
