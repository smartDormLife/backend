import prisma from "../utils/prisma.js";

export const dormService = {
  async list() {
    return prisma.dormitory.findMany({
      orderBy: { dorm_id: "asc" }
    });
  }
};
  