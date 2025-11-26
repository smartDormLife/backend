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
  updateMe,
};
