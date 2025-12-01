import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { signAccessToken } from "../utils/jwt.js";

async function register(data) {
  const { email, password, name, dorm_id, room_no, phone } = data;

  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    const err = new Error("Email already exists");
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      dorm_id,
      room_no,
      phone,
    },
    include: { dorm: true },
  });

  const token = signAccessToken({ user_id: user.user_id });

  return {
    accessToken: token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      dorm_id: user.dorm_id,
      dorm_name: user.dorm?.dorm_name ?? null,
      room_no: user.room_no ?? null,
      phone: user.phone ?? null,
      account_number: user.account_number ?? null,
      created_at: user.created_at
    },
  };
}

async function login(data) {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { dorm: true },
  });

  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const token = signAccessToken({ user_id: user.user_id });

  return {
    accessToken: token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      dorm_id: user.dorm_id,
      dorm_name: user.dorm?.dorm_name ?? null,
      room_no: user.room_no ?? null,
      phone: user.phone ?? null,
      account_number: user.account_number ?? null,
      created_at: user.created_at
    },
  };
}

async function getMe(user_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    include: { dorm: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    dorm_id: user.dorm_id,
    dorm_name: user.dorm?.dorm_name ?? null,
    room_no: user.room_no,
    phone: user.phone,
    account_number: user.account_number ?? null,
    created_at: user.created_at
  };
}

async function updateMe(user_id, data) {
  const user = await prisma.user.update({
    where: { user_id },
    data,
    include: { dorm: true },
  });

  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    dorm_id: user.dorm_id,
    dorm_name: user.dorm?.dorm_name ?? null,
    room_no: user.room_no,
    phone: user.phone,
    account_number: user.account_number ?? null,
    created_at: user.created_at
  };
}

export default { register, login, getMe, updateMe };
