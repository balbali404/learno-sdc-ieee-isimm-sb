import "dotenv/config";
import prisma from "../src/config/prisma.js";

async function main() {
  const lessons = await prisma.lesson.findMany({
    select: {
      id: true,
      title: true,
      pdfPath: true,
      sessionId: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  console.log(JSON.stringify(lessons, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
