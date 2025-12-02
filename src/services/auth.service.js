import prisma from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authService = {
  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw { status: 401, message: "Invalid credentials" };

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw { status: 401, message: "Invalid credentials" };

    const accessToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      accessToken,
      user
    };
  },

  async register(data) {
    const exists = await prisma.user.findUnique({
      where: { email: data.email }
    });
    if (exists) throw { status: 409, message: "Email already exists" };

    const hash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: { ...data, password: hash }
    });

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      accessToken: token,
      user
    };
  }
};
