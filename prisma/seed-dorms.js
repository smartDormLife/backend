import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dorms = [
    { dorm_id: 1, dorm_name: '남제관' },
    { dorm_id: 2, dorm_name: '용지관' },
    { dorm_id: 3, dorm_name: '광교관' },
    { dorm_id: 4, dorm_name: '화홍관' },
    { dorm_id: 5, dorm_name: '국제학사관' },
    { dorm_id: 6, dorm_name: '일신관' },
];

async function main() {
    console.log('🌱 Seeding dormitories...');

    for (const dorm of dorms) {
        await prisma.dormitory.upsert({
            where: { dorm_id: dorm.dorm_id },
            update: {},
            create: dorm,
        });
    }

    console.log('✅ Dormitories seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
