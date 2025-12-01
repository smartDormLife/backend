import prisma from "../config/prisma.js";

const DEFAULT_DORMS = [
  { dorm_id: 1, dorm_name: "남제관" },
  { dorm_id: 2, dorm_name: "용지관" },
  { dorm_id: 3, dorm_name: "광교관" },
  { dorm_id: 4, dorm_name: "화홍관" },
  { dorm_id: 5, dorm_name: "국제학사관" },
  { dorm_id: 6, dorm_name: "일신관" }
];

async function getAllDorms() {
  const count = await prisma.dormitory.count();
  if (count === 0) {
    await prisma.dormitory.createMany({
      data: DEFAULT_DORMS,
      skipDuplicates: true
    });
  }

  return await prisma.dormitory.findMany({
    orderBy: { dorm_id: "asc" }
  });
}

export default { getAllDorms };
