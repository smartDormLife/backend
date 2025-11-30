import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const authService = {
  register: async (data) => {
    const { email, password, name, dorm_id, room_no, phone } = data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw { status: 409, message: "Email already exists" };

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        dorm_id,
        room_no,
        phone
      },
      include: { dorm: true }
    });

    const accessToken = generateToken(newUser.user_id);

    return {
      accessToken,
      user: {
        name: newUser.name,
        email: newUser.email,
        dorm_name: newUser.dorm?.dorm_name || null,
        room_no: newUser.room_no,
        phone: newUser.phone
      }
    };
  },

  login: async ({ email, password }) => {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { dorm: true }
    });
    if (!user) throw { status: 401, message: "Invalid email or password" };

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw { status: 401, message: "Invalid email or password" };

    const accessToken = generateToken(user.user_id);

    return {
      accessToken,
      user: {
        name: user.name,
        email: user.email,
        dorm_name: user.dorm?.dorm_name || null,
        room_no: user.room_no,
        phone: user.phone
      }
    };
  }
};
