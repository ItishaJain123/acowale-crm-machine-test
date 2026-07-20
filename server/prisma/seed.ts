import "dotenv/config";
import { PrismaClient, Category } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seeds the admin user (from env vars) and sample feedback for demo purposes.
async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@acowale.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: await bcrypt.hash(password, 10),
      name: "Acowale Admin",
    },
  });
  console.log(`Admin user ready: ${email}`);

  // Sample feedback so the dashboard isn't empty on first load.
  const count = await prisma.feedback.count();
  if (count === 0) {
    const samples: { category: Category; comment: string; rating: number; daysAgo: number }[] = [
      { category: "PRODUCT", comment: "Loving the new dashboard! It's so intuitive.", rating: 5, daysAgo: 0 },
      { category: "FEATURE_REQUEST", comment: "Can we get dark mode in the next update?", rating: 4, daysAgo: 1 },
      { category: "BUG", comment: "Export to CSV fails when the table has more than 100 rows.", rating: 2, daysAgo: 1 },
      { category: "UI_UX", comment: "The reporting feature is not exporting CSV correctly on mobile.", rating: 3, daysAgo: 2 },
      { category: "PRODUCT", comment: "Great product! Helped our team a lot with tracking.", rating: 5, daysAgo: 3 },
      { category: "BILLING", comment: "Billing page needs more clarity on plan differences.", rating: 3, daysAgo: 4 },
      { category: "SUPPORT", comment: "Support team responded quickly, very happy!", rating: 5, daysAgo: 5 },
      { category: "OTHER", comment: "Just wanted to say the onboarding was smooth.", rating: 4, daysAgo: 6 },
    ];
    for (const s of samples) {
      await prisma.feedback.create({
        data: {
          category: s.category,
          comment: s.comment,
          rating: s.rating,
          createdAt: new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log(`Seeded ${samples.length} sample feedback entries`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
