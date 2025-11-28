import prisma from "../config/prisma.js";

async function getAllDorms() {
  return await prisma.dormitory.findMany({
    orderBy: { dorm_id: "asc" }
  });
}

export default { getAllDorms };
